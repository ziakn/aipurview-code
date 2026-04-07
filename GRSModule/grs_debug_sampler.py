#!/usr/bin/env python3
"""GRS Debug Sampler — produce a small reproducible scenario subset for smoke-testing."""

import argparse
import datetime
import hashlib
import json
import logging
import os
import random
import sys

# ── Constants ──────────────────────────────────────────────────────────────────
VALID_SOURCES = {"gpt", "gemini", "claude"}
VALID_SCENARIO_TYPES = {"base", "mutated"}
VALID_DIMENSIONS = {"authority", "constraint", "ambiguity", "risk", "accountability"}
VALID_MUTATION_TYPES = {"urgency", "ambiguity", "authority", "language"}
REQUIRED_FIELDS = frozenset({
    "scenario_id", "obligation_id", "source", "scenario_type",
    "primary_dimension", "mutation_type", "prompt",
})


# ── Helpers (stubs — filled in later tasks) ────────────────────────────────────
def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_source(path: str, expected_source: str) -> tuple:
    """Load, validate, and namespace a single source JSONL file.

    Returns (scenarios, dropped_count).
    scenario_id is prefixed with '{expected_source}:' for global uniqueness.
    """
    scenarios = []
    dropped = 0
    with open(path, encoding="utf-8") as f:
        for lineno, raw in enumerate(f, 1):
            line = raw.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                logging.warning("Malformed JSON at %s:%d, skipping", path, lineno)
                dropped += 1
                continue

            if not REQUIRED_FIELDS.issubset(obj.keys()):
                missing = REQUIRED_FIELDS - obj.keys()
                logging.warning("Missing fields %s at %s:%d, dropping", missing, path, lineno)
                dropped += 1
                continue
            if obj["source"] not in VALID_SOURCES:
                logging.warning("Invalid source '%s' at %s:%d, dropping",
                                obj["source"], path, lineno)
                dropped += 1
                continue
            if obj["scenario_type"] not in VALID_SCENARIO_TYPES:
                logging.warning("Invalid scenario_type '%s' at %s:%d, dropping",
                                obj["scenario_type"], path, lineno)
                dropped += 1
                continue
            if obj["primary_dimension"] not in VALID_DIMENSIONS:
                logging.warning("Invalid primary_dimension '%s' at %s:%d, dropping",
                                obj["primary_dimension"], path, lineno)
                dropped += 1
                continue
            if obj["scenario_type"] == "mutated" and obj["mutation_type"] is None:
                logging.warning("Mutated scenario with null mutation_type at %s:%d, dropping",
                                path, lineno)
                dropped += 1
                continue
            if obj["scenario_type"] == "base" and obj["mutation_type"] is not None:
                logging.warning("Base scenario with non-null mutation_type at %s:%d, dropping",
                                path, lineno)
                dropped += 1
                continue
            if obj["mutation_type"] is not None and obj["mutation_type"] not in VALID_MUTATION_TYPES:
                logging.warning("Invalid mutation_type '%s' at %s:%d, dropping",
                                obj["mutation_type"], path, lineno)
                dropped += 1
                continue

            obj = dict(obj)  # shallow copy before mutating
            if obj["source"] != expected_source:
                logging.warning("Source override: '%s' → '%s' at %s:%d",
                                obj["source"], expected_source, path, lineno)
                obj["source"] = expected_source

            obj["scenario_id"] = f"{expected_source}:{obj['scenario_id']}"
            scenarios.append(obj)

    return scenarios, dropped


def deduplicate(scenarios: list) -> list:
    """Remove duplicate scenario_id entries, keeping first occurrence."""
    seen: dict = {}  # scenario_id → source label
    result = []
    for s in scenarios:
        sid = s["scenario_id"]
        if sid in seen:
            logging.warning(
                "Duplicate scenario_id '%s' (sources: '%s' and '%s'), keeping first",
                sid, seen[sid], s["source"],
            )
        else:
            seen[sid] = s["source"]
            result.append(s)
    return result


def phase1_draw(pool: list, rng: random.Random) -> tuple:
    """Draw one scenario per obligation_id (alphabetical order for determinism).

    Returns (phase1_sample, coverage_map, remaining_pool).
    coverage_map: { obligation_id → scenario_id (namespaced) }
    remaining_pool: pool minus selected scenarios.
    """
    obl_ids = sorted({s["obligation_id"] for s in pool})
    by_obl: dict = {}
    for s in pool:
        by_obl.setdefault(s["obligation_id"], []).append(s)

    sample = []
    coverage_map: dict = {}
    selected_ids: set = set()

    for obl_id in obl_ids:
        chosen = rng.choice(by_obl[obl_id])
        sample.append(chosen)
        coverage_map[obl_id] = chosen["scenario_id"]
        selected_ids.add(chosen["scenario_id"])

    remaining = [s for s in pool if s["scenario_id"] not in selected_ids]
    return sample, coverage_map, remaining


def phase2_draw(remaining: list, n_phase2: int, rng: random.Random) -> tuple:
    raise NotImplementedError


def run_audit(sample: list, coverage_map: dict, target_n: int) -> dict:
    raise NotImplementedError


# ── CLI ────────────────────────────────────────────────────────────────────────
def parse_args():
    parser = argparse.ArgumentParser(
        description="GRS Debug Sampler — produce a small reproducible scenario subset"
    )
    parser.add_argument("--source-a", required=True, help="GPT dataset JSONL (required)")
    parser.add_argument("--source-b", required=True, help="Gemini dataset JSONL (required)")
    parser.add_argument("--source-c", required=True, help="Claude dataset JSONL (required)")
    parser.add_argument("--target-n", type=int, default=30,
                        help="Target sample size [15, 100], default 30")
    parser.add_argument("--seed", type=int, default=42, help="Primary random seed, default 42")
    parser.add_argument("--output", default="grs_debug_sample.jsonl",
                        help="Output JSONL path, default grs_debug_sample.jsonl")
    parser.add_argument("--manifest", default="grs_debug_manifest.json",
                        help="Output manifest JSON path, default grs_debug_manifest.json")
    args = parser.parse_args()

    errors = []
    for attr, label in [
        ("source_a", "--source-a"),
        ("source_b", "--source-b"),
        ("source_c", "--source-c"),
    ]:
        path = getattr(args, attr)
        if not os.path.exists(path):
            errors.append(f"Source file not found: {path} ({label})")

    if not (15 <= args.target_n <= 100):
        errors.append(f"--target-n {args.target_n} is outside allowed range [15, 100]")

    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    return args


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s %(message)s",
        datefmt="%H:%M:%S",
    )
    args = parse_args()
    logging.info("GRS Debug Sampler starting — seed=%d, target_n=%d", args.seed, args.target_n)

    file_map = [
        ("gpt", args.source_a),
        ("gemini", args.source_b),
        ("claude", args.source_c),
    ]
    all_scenarios = []
    source_hashes = {}

    for source, path in file_map:
        source_hashes[source] = sha256_file(path)
        scenarios, dropped = load_source(path, source)
        logging.info("Loaded %s: %d valid, %d dropped", path, len(scenarios), dropped)
        logging.info("Namespace prefix applied: source='%s', count=%d", source, len(scenarios))
        all_scenarios.extend(scenarios)

    logging.info("Source hashes recorded: %s", list(source_hashes.keys()))

    pool = deduplicate(all_scenarios)

    # ── Phase 1 budget check ───────────────────────────────────────────────────
    n_obligations = len({s["obligation_id"] for s in pool})
    if n_obligations == 0:
        logging.error("No valid scenarios loaded from any source — cannot sample. Exiting.")
        return 1
    if n_obligations / args.target_n > 0.50:
        suggested = n_obligations * 2
        logging.warning(
            "Phase 1 budget warning: %d obligations / %d target_n > 50%%. "
            "Recommend --target-n >= %d.",
            n_obligations, args.target_n, suggested,
        )

    # ── Phase 1 ───────────────────────────────────────────────────────────────
    rng1 = random.Random(args.seed)
    phase1_sample, coverage_map, remaining_pool = phase1_draw(pool, rng1)
    p1_dist = {
        src: sum(1 for s in phase1_sample if s["source"] == src)
        for src in ["gpt", "gemini", "claude"]
    }
    logging.info("Phase 1 complete: %d drawn, distribution=%s", len(phase1_sample), p1_dist)

    # ── Phase 2 stub (replaced in Task 4) ─────────────────────────────────────
    phase2_sample: list = []
    shortfalls: dict = {}
    p2_dist = {"gpt": 0, "gemini": 0, "claude": 0}
    logging.info("Phase 2 complete: 0 drawn (stub), distribution=%s", p2_dist)

    sample = phase1_sample + phase2_sample

    # Write output
    with open(args.output, "w", encoding="utf-8") as f:
        for s in sample:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")

    output_hash = sha256_file(args.output)
    logging.info("Output written to %s (sha256: %s...)", args.output, output_hash[:16])

    # Minimal manifest (audit block added in Task 6)
    final_dist = {
        src: sum(1 for s in sample if s["source"] == src)
        for src in ["gpt", "gemini", "claude"]
    }
    manifest_data = {
        "grs_version": "v3.0",
        "sampler_version": "debug-v1.0",
        "sampling_date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "mode": "debug",
        "source_files": {
            "gpt": args.source_a,
            "gemini": args.source_b,
            "claude": args.source_c,
        },
        "source_hashes": source_hashes,
        "random_seed_1": args.seed,
        "random_seed_2": args.seed + 1,
        "target_n": args.target_n,
        "phase1": {
            "description": "One scenario drawn per obligation (coverage guarantee)",
            "scenarios_drawn": len(phase1_sample),
            "obligations_covered": len(coverage_map),
            "coverage_map": coverage_map,
            "source_distribution": p1_dist,
        },
        "phase2": {
            "description": "Equal source-balanced draw on remaining budget",
            "scenarios_drawn": len(phase2_sample),
            "shortfalls": shortfalls,
            "source_distribution": p2_dist,
        },
        "final_sample": {
            "total_scenarios": len(sample),
            "source_distribution": final_dist,
            "sha256": output_hash,
        },
        "audit": {},  # filled in Task 6
    }
    with open(args.manifest, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2, ensure_ascii=False)
    logging.info("Manifest written to %s", args.manifest)

    return 0


if __name__ == "__main__":
    sys.exit(main())
