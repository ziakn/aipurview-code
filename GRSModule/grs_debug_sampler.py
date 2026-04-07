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
    raise NotImplementedError


def load_source(path: str, expected_source: str) -> tuple:
    raise NotImplementedError


def deduplicate(scenarios: list) -> list:
    raise NotImplementedError


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
    parse_args()
    # Full implementation added in later tasks
    return 0


if __name__ == "__main__":
    sys.exit(main())
