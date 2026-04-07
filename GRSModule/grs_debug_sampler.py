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
    raise NotImplementedError


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

    # Phase 1 + Phase 2 stubs — replaced in Tasks 3 and 4
    sample = pool[: args.target_n]

    # Write output (shuffling added in Task 5)
    with open(args.output, "w", encoding="utf-8") as f:
        for s in sample:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")

    logging.info("Output written to %s (stub, %d scenarios)", args.output, len(sample))
    return 0


if __name__ == "__main__":
    sys.exit(main())
