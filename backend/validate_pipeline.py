#!/usr/bin/env python3
"""Validate inference pipeline against DataSet.csv and generate health metrics."""

from __future__ import annotations

import json
import os
import sys

import numpy as np
import pandas as pd
import shap
from catboost import CatBoostClassifier

from preprocessing import Preprocessor

ARTIFACT_DIR = os.path.dirname(os.path.abspath(__file__))


def main() -> int:
    dataset_path = os.path.join(ARTIFACT_DIR, "DataSet.csv")
    if not os.path.exists(dataset_path):
        print(f"ERROR: {dataset_path} not found")
        return 1

    preprocessor = Preprocessor.from_artifacts(ARTIFACT_DIR)
    model = CatBoostClassifier()
    model.load_model(os.path.join(ARTIFACT_DIR, "model.cbm"))
    explainer = shap.TreeExplainer(model)

    df = pd.read_csv(dataset_path, low_memory=False)
    sample_size = min(200, len(df))
    sample = df.sample(n=sample_size, random_state=42)

    probabilities: list[float] = []
    errors: list[str] = []
    shap_ok = 0

    for idx, row in sample.iterrows():
        payload = row.to_dict()
        try:
            input_df = preprocessor.transform_row(payload)
            prob = float(model.predict_proba(input_df)[0][1])
            probabilities.append(prob)

            shap_values = explainer.shap_values(input_df)
            if shap_values is not None:
                shap_ok += 1
        except Exception as exc:
            errors.append(f"row {idx}: {exc}")

    # Explicit categorical smoke tests
    categorical_tests = []
    for _, row in df.head(20).iterrows():
        payload = row.to_dict()
        for col in preprocessor.categorical_features:
            if col in payload and pd.notna(payload[col]):
                categorical_tests.append(str(payload[col]))
                break

    stats = {
        "sample_size": sample_size,
        "successful_predictions": len(probabilities),
        "errors": errors[:10],
        "error_count": len(errors),
        "probability_min": float(np.min(probabilities)) if probabilities else None,
        "probability_max": float(np.max(probabilities)) if probabilities else None,
        "probability_mean": float(np.mean(probabilities)) if probabilities else None,
        "probability_std": float(np.std(probabilities)) if probabilities else None,
        "probability_median": float(np.median(probabilities)) if probabilities else None,
        "unique_probability_count": len(set(round(p, 6) for p in probabilities)),
        "shap_success_count": shap_ok,
        "categorical_values_tested": sorted(set(categorical_tests)),
    }

    # Sample predictions for report
    sample_predictions = []
    for i, (_, row) in enumerate(df.head(5).iterrows()):
        input_df = preprocessor.transform_row(row.to_dict())
        prob = float(model.predict_proba(input_df)[0][1])
        sample_predictions.append(
            {
                "row_index": int(i),
                "F3889_raw": row.get("F3889"),
                "F3891_raw": row.get("F3891"),
                "F3889_encoded": float(input_df["F3889"].iloc[0]),
                "F3891_encoded": float(input_df["F3891"].iloc[0]),
                "probability": prob,
                "risk_score": round(prob * 100, 2),
            }
        )

    output = {"stats": stats, "sample_predictions": sample_predictions}
    out_path = os.path.join(ARTIFACT_DIR, "validation_results.json")
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2)

    print(json.dumps(stats, indent=2))
    print(f"Wrote {out_path}")

    return 0 if stats["error_count"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
