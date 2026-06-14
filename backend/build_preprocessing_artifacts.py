#!/usr/bin/env python3
"""
Rebuild inference preprocessing artifacts from DataSet.csv using model.ipynb logic.

Outputs:
  - encoders.pkl
  - medians.pkl
  - modes.pkl
  - preprocessing_config.pkl

Does NOT modify features.pkl or model.cbm.
"""

from __future__ import annotations

import argparse
import json
import os

import joblib
import pandas as pd
from catboost import CatBoostClassifier

from preprocessing import Preprocessor

ARTIFACT_DIR = os.path.dirname(os.path.abspath(__file__))


def build_feature_consistency_report(
    features: list[str],
    selected_features: list[str],
    model_features: list[str],
) -> dict:
    return {
        "features_pkl_count": len(features),
        "selected_features_pkl_count": len(selected_features),
        "model_cbm_count": len(model_features),
        "features_pkl_matches_model": features == model_features,
        "selected_features_matches_model": selected_features == model_features,
        "selected_not_in_model": sorted(set(selected_features) - set(model_features)),
        "model_not_in_selected": sorted(set(model_features) - set(selected_features)),
        "features_order": features,
        "model_feature_order": model_features,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build preprocessing artifacts")
    parser.add_argument(
        "--dataset",
        default=os.path.join(ARTIFACT_DIR, "DataSet.csv"),
        help="Path to training DataSet.csv",
    )
    parser.add_argument(
        "--artifact-dir",
        default=ARTIFACT_DIR,
        help="Directory for output artifacts",
    )
    args = parser.parse_args()

    if not os.path.exists(args.dataset):
        raise FileNotFoundError(f"Dataset not found: {args.dataset}")

    features = joblib.load(os.path.join(args.artifact_dir, "features.pkl"))
    selected_features = joblib.load(
        os.path.join(args.artifact_dir, "selected_features.pkl")
    )

    model = CatBoostClassifier()
    model.load_model(os.path.join(args.artifact_dir, "model.cbm"))
    model_features = list(model.feature_names_)

    if features != model_features:
        raise RuntimeError(
            "features.pkl order/names do not match model.cbm — fix artifacts before building"
        )

    print(f"Loading dataset: {args.dataset}")
    df = pd.read_csv(args.dataset, low_memory=False)
    print(f"Dataset shape: {df.shape}")

    preprocessor = Preprocessor.fit_from_dataframe(df, model_features)
    preprocessor.save_artifacts(args.artifact_dir)

    report = build_feature_consistency_report(
        features, selected_features, model_features
    )
    report_path = os.path.join(args.artifact_dir, "feature_consistency_report.json")
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)

    print(f"Saved encoders.pkl ({len(preprocessor.encoders)} categorical columns)")
    print(f"Saved medians.pkl ({len(preprocessor.medians)} numeric model features)")
    print(f"Saved modes.pkl ({len(preprocessor.modes)} categorical model features)")
    print(f"Categorical model features: {preprocessor.categorical_features}")
    print(f"Feature consistency report: {report_path}")


if __name__ == "__main__":
    main()
