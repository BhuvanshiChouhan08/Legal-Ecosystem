"""Train a small, reproducible binary priority-signal model from a CSV.

Uses only Python's standard library. The generated JSON is consumed by the
Express API; no Python runtime is needed to serve predictions.

This is an educational prototype, not a validated legal triage system.
"""
import argparse
import csv
import json
import math
import random
from collections import defaultdict
from pathlib import Path


CASE_TYPES = ("civil", "criminal", "family")


def sigmoid(value):
    value = max(-30.0, min(30.0, value))
    return 1.0 / (1.0 + math.exp(-value))


def features(case_type):
    normalized = case_type.strip().lower()
    if normalized not in CASE_TYPES:
        raise ValueError(f"Unsupported case_type: {case_type}")
    # Civil is the reference category.
    return [1.0, float(normalized == "criminal"), float(normalized == "family")]


def load_rows(path):
    rows = []
    with Path(path).open(newline="", encoding="utf-8-sig") as source:
        for row in csv.DictReader(source):
            kind = (row.get("case_type") or "").strip().lower()
            label = (row.get("priority_label") or "").strip()
            if kind in CASE_TYPES and label in {"0", "1"}:
                rows.append((kind, int(label)))
    if len(rows) < 30:
        raise ValueError("Need at least 30 usable rows for a holdout evaluation.")
    return rows


def stratified_split(rows, seed=42):
    buckets = defaultdict(list)
    for row in rows:
        buckets[row].append(row)
    rng = random.Random(seed)
    train, test = [], []
    for bucket in buckets.values():
        rng.shuffle(bucket)
        count = max(1, round(len(bucket) * 0.2))
        test.extend(bucket[:count])
        train.extend(bucket[count:])
    rng.shuffle(train)
    rng.shuffle(test)
    return train, test


def fit(rows):
    weights = [0.0, 0.0, 0.0]
    rate = 0.04
    l2 = 0.02
    for epoch in range(5000):
        gradients = [0.0, 0.0, 0.0]
        for kind, label in rows:
            values = features(kind)
            probability = sigmoid(sum(w * x for w, x in zip(weights, values)))
            for index, value in enumerate(values):
                gradients[index] += (probability - label) * value
        size = len(rows)
        for index in range(len(weights)):
            penalty = 0.0 if index == 0 else l2 * weights[index]
            weights[index] -= rate * (gradients[index] / size + penalty)
    return weights


def metrics(rows, weights):
    truth, guesses = [], []
    for kind, label in rows:
        score = sigmoid(sum(w * x for w, x in zip(weights, features(kind))))
        truth.append(label)
        guesses.append(int(score >= 0.5))
    correct = sum(actual == predicted for actual, predicted in zip(truth, guesses))
    tp = sum(a == 1 and p == 1 for a, p in zip(truth, guesses))
    tn = sum(a == 0 and p == 0 for a, p in zip(truth, guesses))
    fp = sum(a == 0 and p == 1 for a, p in zip(truth, guesses))
    fn = sum(a == 1 and p == 0 for a, p in zip(truth, guesses))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    balanced = ((tp / (tp + fn)) + (tn / (tn + fp))) / 2 if tp + fn and tn + fp else 0.0
    majority = max(sum(y == 0 for y in truth), sum(y == 1 for y in truth)) / len(truth)
    return {
        "holdout_rows": len(rows),
        "accuracy": round(correct / len(rows), 4),
        "majority_baseline_accuracy": round(majority, 4),
        "balanced_accuracy": round(balanced, 4),
        "positive_class_precision": round(precision, 4),
        "positive_class_recall": round(recall, 4),
        "positive_class_f1": round(f1, 4),
        "confusion_matrix": {"true_negative": tn, "false_positive": fp, "false_negative": fn, "true_positive": tp},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path", help="Path to the labeled training CSV")
    parser.add_argument("--output", default=str(Path(__file__).with_name("priority_model.json")))
    args = parser.parse_args()

    rows = load_rows(args.csv_path)
    train_rows, test_rows = stratified_split(rows)
    weights = fit(train_rows)
    report = metrics(test_rows, weights)
    model = {
        "model_type": "binary_logistic_regression",
        "version": 1,
        "features": ["case_type"],
        "case_types": list(CASE_TYPES),
        "weights": [round(value, 10) for value in weights],
        "training_rows": len(train_rows),
        "evaluation": report,
        "warning": "Prototype trained on a small supplied dataset; not for legal decisions.",
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(model, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"model_file": str(output), **report}, indent=2))


if __name__ == "__main__":
    main()
