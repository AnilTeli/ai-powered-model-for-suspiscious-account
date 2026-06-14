# MuleShield AI — Production Fix Report

**Date:** 2026-06-15  
**Scope:** Training/inference preprocessing parity, artifact persistence, inference hardening, DataSet.csv validation

---

## 1. Root Causes Fixed

### RC-1: Missing LabelEncoder at inference (CRITICAL)
**Problem:** Training applied `LabelEncoder` to all object columns (`F3889`, `F3891`, and others). Inference passed raw strings like `G365D` and `selfemployed` directly to CatBoost, causing `Cannot convert 'G365D' to float`.

**Fix:** Rebuilt encoders from `DataSet.csv` using the same training logic. Inference now encodes categorical model features before prediction.

### RC-2: Imputation mismatch (HIGH)
**Problem:** Training used median (numeric) and mode (categorical) imputation. Inference used `reindex(..., fill_value=0)`.

**Fix:** Persisted per-feature medians and modes from training data. Missing model features now impute with the same statistics used during training.

### RC-3: No persisted preprocessing artifacts (CRITICAL)
**Problem:** Encoders and imputation statistics were created in the notebook loop and discarded.

**Fix:** Created reusable `Preprocessor` class and artifact builder. Saved `encoders.pkl`, `medians.pkl`, `modes.pkl`, `preprocessing_config.pkl`.

### RC-4: Weak error handling (MEDIUM)
**Problem:** Prediction failures returned HTTP 200 with `{ "error": "..." }`.

**Fix:** Preprocessing validation raises `HTTPException` 422/400. Prediction failures raise HTTP 500. Empty payloads rejected with 422.

### RC-5: Prediction clustering from wrong feature space (HIGH)
**Problem:** Zero-fill and unencoded categoricals pushed inputs into incorrect regions of feature space, producing narrow/low probabilities.

**Fix:** Training-aligned preprocessing restores meaningful score variation (173 unique scores in 200-row sample; 2831 unique across full dataset).

---

## 2. Files Changed

| File | Change |
|------|--------|
| `backend/preprocessing.py` | **NEW** — Training-aligned `Preprocessor` (fit, transform, artifact I/O) |
| `backend/build_preprocessing_artifacts.py` | **NEW** — Rebuilds artifacts from `DataSet.csv` |
| `backend/validate_pipeline.py` | **NEW** — DataSet.csv + SHAP validation script |
| `backend/main.py` | Replaced `reindex/fill_value=0` with `Preprocessor`; HTTPException errors; startup artifact validation; MongoDB fast-fail timeout |
| `backend/DataSet.csv` | **ADDED** (copied from local Downloads for artifact rebuild + validation; not in original repo) |

### Unchanged (per requirements)
- `backend/model.cbm` — not modified
- `backend/features.pkl` — not modified
- MongoDB integration — preserved
- SHAP explainability — preserved
- Audit History endpoint — preserved
- CSV Upload frontend — unchanged (works with fixed backend)

---

## 3. Artifacts Created

| Artifact | Description |
|----------|-------------|
| `backend/encoders.pkl` | `LabelEncoder` objects for 2 categorical model features: `F3889`, `F3891` |
| `backend/medians.pkl` | Median imputation values for 57 numeric model features |
| `backend/modes.pkl` | Mode imputation values for 2 categorical model features |
| `backend/preprocessing_config.pkl` | Feature type metadata, thresholds, suspicious feature list |
| `backend/feature_consistency_report.json` | Feature count/order audit across artifacts |
| `backend/validation_results.json` | Post-fix validation metrics |

### Feature consistency (Phase 4)

| Artifact | Feature count | Matches `model.cbm`? |
|----------|---------------|----------------------|
| `features.pkl` | 59 | **Yes** (names + order) |
| `model.cbm` | 59 | — |
| `selected_features.pkl` | 63 | **No** — stale; includes removed suspicious columns `F3912`, `F2230`, `F3908`, `F270` |

**Inference uses only `features.pkl` / `model.cbm` (59 features).** `selected_features.pkl` is documented as stale and not loaded by the backend.

---

## 4. Training Pipeline Reconstructed (Phase 1)

From `backend/model.ipynb`:

1. Load `DataSet.csv`
2. Drop columns with **>80%** missing
3. Median impute numeric (`int64`/`float64`)
4. Mode impute categorical (`object`)
5. `LabelEncoder` on all object columns
6. Drop `Unnamed: 0`
7. Feature selection → 63 features → remove 4 suspicious → **59 features**
8. SMOTE + CatBoost training (unchanged; no retraining performed)

`Preprocessor.fit_from_dataframe()` reproduces steps 2–5 for artifact generation. Inference applies steps 3–5 on the 59 model features only.

### Categorical model features identified

| Feature | Example raw values |
|---------|-------------------|
| `F3889` | `G365D`, `L365D`, `L90D`, `L31D` |
| `F3891` | `selfemployed`, `student`, `salaried`, `agriculture`, `housewife` |

Other audit-mentioned values (`Savings`, `M`, `RETAIL`) exist in non-model columns (`F3886`, `F3890`, `F3892`, `F3893`) and are correctly ignored at inference.

---

## 5. Validation Results (Phases 6–8)

### DataSet.csv (200-row random sample)
- **200/200** predictions succeeded
- **0** categorical conversion errors
- **200/200** SHAP explanations generated
- **173** unique probability values in sample

### Full DataSet.csv (9082 rows)
- **9082/9082** predictions succeeded
- Probability range: **0.00% – 99.99%**
- **2831** unique probability values
- **82** accounts ≥ 50% (Mule), **78** ≥ 70% (High Risk)

### Regression checks
| Feature | Status |
|---------|--------|
| CSV Upload | ✓ Frontend unchanged; backend accepts raw DataSet rows |
| Dashboard | ✓ Predictions return varied risk scores |
| SHAP Explanations | ✓ 10 top features returned per prediction |
| Audit History | ✓ `/audit-logs` endpoint preserved |
| MongoDB Logging | ✓ `insert_one` preserved; graceful fallback if DB unavailable |
| Risk Score | ✓ `probability * 100` |
| Fraud Alert | ✓ `risk_score > 70` |

### API error handling
| Request | HTTP status |
|---------|-------------|
| Valid DataSet row | 200 |
| Empty `{}` | 422 |
| Preprocessing failure | 422 |

---

## 6. Remaining Risks

1. **`selected_features.pkl` drift** — Still contains 63 pre-drop features. Not used by backend but may confuse retraining workflows. Regenerate from notebook if retraining.
2. **Unknown categorical values** — Unseen categories fall back to training mode (safe default). Consider logging warnings in production.
3. **`DataSet.csv` not in git** — Artifacts must be rebuilt via `python build_preprocessing_artifacts.py` if preprocessing artifacts are missing.
4. **MongoDB timeout** — Added 5s `serverSelectionTimeoutMS`; Atlas connectivity still required for audit persistence in production.
5. **Class imbalance** — Mean mule probability ~1.1% on full dataset reflects training distribution; high scores exist but are rare.

---

## 7. Production Readiness Assessment

| Criterion | Before | After |
|-----------|--------|-------|
| Raw DataSet.csv prediction | **FAIL** | **PASS** |
| Training = inference preprocessing | **FAIL** | **PASS** |
| Persisted encoders/imputers | **FAIL** | **PASS** |
| Meaningful score variation | **FAIL** | **PASS** |
| HTTP error semantics | **FAIL** | **PASS** |
| SHAP / MongoDB / Audit | PASS | PASS |

**Verdict:** Ready for production inference on raw banking CSV data **after deploying new artifacts** (`encoders.pkl`, `medians.pkl`, `modes.pkl`, `preprocessing_config.pkl`). No model retraining required.

---

## 8. Deployment Steps

```bash
cd backend

# Ensure DataSet.csv is present, then rebuild artifacts if needed:
python3 build_preprocessing_artifacts.py

# Validate:
python3 validate_pipeline.py

# Start API:
uvicorn main:app --reload --port 8001
```

Ensure `MONGO_URI` is set in `.env` for audit logging.
