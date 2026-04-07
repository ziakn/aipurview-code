import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "grs_debug_sampler.py")

OBLIGATIONS = [f"OBL_{i:03d}" for i in range(1, 6)]
DIMENSIONS = ["authority", "constraint", "ambiguity", "risk", "accountability"]
MUTATION_TYPES = ["urgency", "ambiguity", "authority", "language"]
REQUIRED_FIELDS = {
    "scenario_id", "obligation_id", "source", "scenario_type",
    "primary_dimension", "mutation_type", "prompt",
}
REQUIRED_MANIFEST_KEYS = {
    "grs_version", "sampler_version", "sampling_date", "mode",
    "source_files", "source_hashes", "random_seed_1", "random_seed_2",
    "target_n", "phase1", "phase2", "final_sample", "audit",
}


def make_fixture(source: str, dirpath: str, n_obligations: int = 5) -> str:
    """Generate a synthetic JSONL fixture — n_obligations × 4 scenarios."""
    obligations = [f"OBL_{i:03d}" for i in range(1, n_obligations + 1)]
    path = os.path.join(dirpath, f"{source}_{n_obligations}.jsonl")
    with open(path, "w", encoding="utf-8") as f:
        for i, obl in enumerate(obligations):
            dim = DIMENSIONS[i % len(DIMENSIONS)]
            for j in range(4):
                if j == 0:
                    s = {
                        "scenario_id": f"{source}_{obl}_s{j + 1:03d}",
                        "obligation_id": obl,
                        "source": source,
                        "scenario_type": "base",
                        "primary_dimension": dim,
                        "mutation_type": None,
                        "prompt": f"Prompt for {source} {obl} scenario {j + 1}",
                    }
                else:
                    s = {
                        "scenario_id": f"{source}_{obl}_s{j + 1:03d}",
                        "obligation_id": obl,
                        "source": source,
                        "scenario_type": "mutated",
                        "primary_dimension": dim,
                        "mutation_type": MUTATION_TYPES[(j - 1) % len(MUTATION_TYPES)],
                        "prompt": f"Prompt for {source} {obl} scenario {j + 1}",
                    }
                f.write(json.dumps(s) + "\n")
    return path


class SamplerTestBase(unittest.TestCase):
    """Base class: 5-obligation fixtures shared by most tests."""

    @classmethod
    def setUpClass(cls):
        cls.tmpdir = tempfile.mkdtemp()
        cls.gpt_path = make_fixture("gpt", cls.tmpdir)
        cls.gemini_path = make_fixture("gemini", cls.tmpdir)
        cls.claude_path = make_fixture("claude", cls.tmpdir)

    def run_sampler(self, seed=42, target_n=30, extra_args=None, out_suffix=""):
        out = os.path.join(self.tmpdir, f"sample{out_suffix}.jsonl")
        manifest = os.path.join(self.tmpdir, f"manifest{out_suffix}.json")
        cmd = [
            sys.executable, SCRIPT,
            "--source-a", self.gpt_path,
            "--source-b", self.gemini_path,
            "--source-c", self.claude_path,
            "--seed", str(seed),
            "--target-n", str(target_n),
            "--output", out,
            "--manifest", manifest,
        ]
        if extra_args:
            cmd.extend(extra_args)
        return subprocess.run(cmd, capture_output=True, text=True), out, manifest

    def load_jsonl(self, path):
        with open(path, encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]

    def load_manifest(self, path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)


class TestHandlesMissingSourceFile(SamplerTestBase):

    def test_handles_missing_source_file(self):  # T14
        out = os.path.join(self.tmpdir, "sample_t14.jsonl")
        manifest = os.path.join(self.tmpdir, "manifest_t14.json")
        cmd = [
            sys.executable, SCRIPT,
            "--source-a", "/nonexistent/path.jsonl",
            "--source-b", self.gemini_path,
            "--source-c", self.claude_path,
            "--output", out,
            "--manifest", manifest,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)


class TestLoadAndOutput(SamplerTestBase):

    def test_all_required_fields_present(self):  # T10
        _, out, _ = self.run_sampler(out_suffix="_t10")
        sample = self.load_jsonl(out)
        self.assertGreater(len(sample), 0, "Output file is empty")
        for s in sample:
            for field in REQUIRED_FIELDS:
                self.assertIn(
                    field, s,
                    f"Field '{field}' missing from scenario {s.get('scenario_id')}",
                )


class TestPhase1(SamplerTestBase):

    def test_all_obligations_represented(self):  # T06
        _, out, _ = self.run_sampler(out_suffix="_t06")
        sample = self.load_jsonl(out)
        obl_ids_in_output = {s["obligation_id"] for s in sample}
        self.assertEqual(obl_ids_in_output, set(OBLIGATIONS))

    def test_phase1_coverage_map_correct(self):  # T07
        _, out, manifest = self.run_sampler(out_suffix="_t07")
        sample = self.load_jsonl(out)
        data = self.load_manifest(manifest)
        output_ids = {s["scenario_id"] for s in sample}
        for obl_id, sid in data["phase1"]["coverage_map"].items():
            self.assertIn(
                sid, output_ids,
                f"Phase 1 coverage_map scenario '{sid}' (obl '{obl_id}') not in output",
            )


if __name__ == "__main__":
    unittest.main()
