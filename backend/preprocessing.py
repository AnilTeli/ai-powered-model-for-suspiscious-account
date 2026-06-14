"""
Training-aligned preprocessing for MuleShield inference.

Mirrors backend/model.ipynb:
  1. Drop columns with >80% missing (fit-time only; inference uses model features)
  2. Median imputation for numeric columns
  3. Mode imputation for categorical (object) columns
  4. LabelEncoder on categorical columns
  5. Select model feature columns in model.cbm order (features.pkl)
"""

from __future__ import annotations

import os
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

ARTIFACT_DIR = os.path.dirname(os.path.abspath(__file__))
HIGH_MISSING_THRESHOLD = 80
SUSPICIOUS_FEATURES = ["F3912", "F2230", "F3908", "F270"]


class PreprocessingError(ValueError):
    """Raised when raw input cannot be transformed for inference."""


class Preprocessor:
    def __init__(
        self,
        model_features: list[str],
        categorical_features: list[str],
        numeric_features: list[str],
        medians: dict[str, float],
        modes: dict[str, str],
        encoders: dict[str, LabelEncoder],
        high_missing_threshold: float = HIGH_MISSING_THRESHOLD,
    ) -> None:
        self.model_features = list(model_features)
        self.categorical_features = list(categorical_features)
        self.numeric_features = list(numeric_features)
        self.medians = medians
        self.modes = modes
        self.encoders = encoders
        self.high_missing_threshold = high_missing_threshold

    @classmethod
    def from_artifacts(cls, artifact_dir: str = ARTIFACT_DIR) -> "Preprocessor":
        config = joblib.load(os.path.join(artifact_dir, "preprocessing_config.pkl"))
        encoders = joblib.load(os.path.join(artifact_dir, "encoders.pkl"))
        medians = joblib.load(os.path.join(artifact_dir, "medians.pkl"))
        modes = joblib.load(os.path.join(artifact_dir, "modes.pkl"))
        model_features = joblib.load(os.path.join(artifact_dir, "features.pkl"))

        return cls(
            model_features=model_features,
            categorical_features=config["categorical_features"],
            numeric_features=config["numeric_features"],
            medians=medians,
            modes=modes,
            encoders=encoders,
            high_missing_threshold=config.get(
                "high_missing_threshold", HIGH_MISSING_THRESHOLD
            ),
        )

    @staticmethod
    def fit_from_dataframe(
        df: pd.DataFrame,
        model_features: list[str],
        high_missing_threshold: float = HIGH_MISSING_THRESHOLD,
    ) -> "Preprocessor":
        """Fit preprocessing statistics using the same steps as model.ipynb."""
        working = df.copy()

        missing_percent = (working.isnull().sum() / len(working)) * 100
        cols_to_drop = missing_percent[
            missing_percent > high_missing_threshold
        ].index.tolist()
        working = working.drop(columns=cols_to_drop, errors="ignore")

        if "Unnamed: 0" in working.columns:
            working = working.drop(columns=["Unnamed: 0"])

        num_cols = working.select_dtypes(include=["int64", "float64"]).columns
        cat_cols = working.select_dtypes(include=["object"]).columns

        medians = working[num_cols].median().to_dict()
        modes = {
            col: str(working[col].mode(dropna=True).iloc[0]) for col in cat_cols
        }

        encoders: dict[str, LabelEncoder] = {}
        for col in cat_cols:
            le = LabelEncoder()
            working[col] = le.fit_transform(working[col].astype(str))
            encoders[col] = le

        categorical_features = [f for f in model_features if f in cat_cols]
        numeric_features = [f for f in model_features if f not in cat_cols]

        model_medians = {
            col: float(medians[col]) for col in numeric_features if col in medians
        }
        model_modes = {
            col: modes[col] for col in categorical_features if col in modes
        }
        model_encoders = {
            col: encoders[col] for col in categorical_features if col in encoders
        }

        return Preprocessor(
            model_features=model_features,
            categorical_features=categorical_features,
            numeric_features=numeric_features,
            medians=model_medians,
            modes=model_modes,
            encoders=model_encoders,
            high_missing_threshold=high_missing_threshold,
        )

    def save_artifacts(self, artifact_dir: str = ARTIFACT_DIR) -> None:
        os.makedirs(artifact_dir, exist_ok=True)
        joblib.dump(self.encoders, os.path.join(artifact_dir, "encoders.pkl"))
        joblib.dump(self.medians, os.path.join(artifact_dir, "medians.pkl"))
        joblib.dump(self.modes, os.path.join(artifact_dir, "modes.pkl"))
        joblib.dump(
            {
                "categorical_features": self.categorical_features,
                "numeric_features": self.numeric_features,
                "high_missing_threshold": self.high_missing_threshold,
                "suspicious_features": SUSPICIOUS_FEATURES,
                "model_feature_count": len(self.model_features),
            },
            os.path.join(artifact_dir, "preprocessing_config.pkl"),
        )

    def _is_missing(self, value: Any) -> bool:
        if value is None:
            return True
        if isinstance(value, str) and value.strip() == "":
            return True
        if isinstance(value, float) and np.isnan(value):
            return True
        return False

    def _encode_categorical(self, column: str, value: Any) -> int:
        encoder = self.encoders[column]
        mode_value = self.modes[column]

        if self._is_missing(value):
            value = mode_value

        text = str(value).strip()
        classes = set(encoder.classes_.tolist())
        if text not in classes:
            text = mode_value

        return int(encoder.transform([text])[0])

    def _coerce_numeric(self, column: str, value: Any) -> float:
        if self._is_missing(value):
            if column not in self.medians:
                raise PreprocessingError(
                    f"Missing value for numeric feature '{column}' with no training median"
                )
            return float(self.medians[column])

        try:
            return float(value)
        except (TypeError, ValueError) as exc:
            raise PreprocessingError(
                f"Feature '{column}' expects a numeric value, got {value!r}"
            ) from exc

    def transform_row(self, data: dict[str, Any]) -> pd.DataFrame:
        """Transform one raw input dict into a single-row model input DataFrame."""
        if not isinstance(data, dict):
            raise PreprocessingError("Input must be a JSON object")

        row: dict[str, float] = {}

        for column in self.model_features:
            raw_value = data.get(column, np.nan)

            if column in self.categorical_features:
                row[column] = float(self._encode_categorical(column, raw_value))
            else:
                row[column] = self._coerce_numeric(column, raw_value)

        frame = pd.DataFrame([row], columns=self.model_features)
        return frame.astype(float)
