# MuleShield AI — Model Health Report

**Date:** 2026-06-15  
**Model:** `backend/model.cbm` (CatBoost, 59 features)  
**Preprocessing:** Post-fix training-aligned pipeline

---

## Executive Summary

Prediction clustering was **primarily caused by preprocessing mismatch**, not model degeneration. After restoring LabelEncoder + median/mode imputation, the model produces a wide probability distribution on real `DataSet.csv` rows (0% – 99.99%, 2831 unique scores across 9082 accounts).

---

## 1. Was Clustering Caused by Preprocessing Mismatch?

**Yes.**

| Condition | Old pipeline | New pipeline |
|-----------|--------------|--------------|
| DataSet row with `F3889=G365D` | **Error** — cannot convert to float | **Success** — encoded to `0.0` |
| 200-row sample unique scores | N/A (failed on raw data) | **173** unique values |
| Full dataset unique scores | N/A | **2831** unique values |
| `test_accounts.csv` range | 14.33% – 43.65% | 26.70% – 61.38% |

The old pipeline:
- Passed raw strings to CatBoost (hard failure), or
- Zero-filled missing features (systematic low-risk bias)

The new pipeline places inputs in the same encoded numeric space used during CatBoost training.

---

## 2. Probability Distribution (Full DataSet.csv, N=9082)

| Metric | Value |
|--------|-------|
| Minimum | 0.0000% |
| Maximum | 99.9864% |
| Mean | 1.1023% |
| Median | ~0.02% |
| Std Dev | 9.20% |
| Unique probabilities (6 dp) | 2831 |
| Accounts ≥ 50% (Mule) | 82 (0.90%) |
| Accounts ≥ 70% (High Risk) | 78 (0.86%) |

### Interpretation
- **Base rate is low** (~1% mean), consistent with imbalanced fraud detection data.
- **High-risk tail exists** — 78 accounts score ≥70%, demonstrating the model can strongly flag mule behavior when features align.
- **Variation is meaningful** — 2831 distinct scores vs. the prior audit observation of clustered ~1–8% on OOD/zero-filled inputs.

---

## 3. Sample Predictions (First 5 DataSet Rows)

| Row | F3889 (raw) | F3891 (raw) | F3889 (encoded) | F3891 (encoded) | Risk Score |
|-----|-------------|-------------|-----------------|-----------------|------------|
| 0 | G365D | selfemployed | 0 | 5 | 0.02% |
| 1 | G365D | selfemployed | 0 | 5 | 0.00% |
| 2 | G365D | student | 0 | 6 | **9.44%** |
| 3 | G365D | selfemployed | 0 | 5 | 0.02% |
| 4 | G365D | student | 0 | 6 | 0.15% |

**Observation:** Identical categorical encodings can yield different scores when other numeric features differ — confirming predictions are not collapsed to a single value.

---

## 4. Categorical Encoding Verification

| Raw value | Feature | Encoded value |
|-----------|---------|---------------|
| G365D | F3889 | 0 |
| selfemployed | F3891 | 5 |
| student | F3891 | 6 |

Encoder classes for `F3889`: `G365D`, `L365D`, `L180D`, `L90D`, `L31D`, …  
Encoder classes for `F3891`: `agriculture`, `housewife`, `others`, `pensioner`, `salaried`, `selfemployed`, `student`, …

---

## 5. SHAP Health

- **200/200** sample predictions produced valid SHAP values
- Top-10 feature explanations returned per prediction
- `TreeExplainer` uses the same preprocessed numeric input as `predict_proba`

---

## 6. Observations & Recommendations

1. **Model is healthy** — Responds across full probability range when inputs match training preprocessing.
2. **Prior "flat" predictions** on synthetic grids (all zeros, all 9999) were out-of-distribution artifacts, not evidence of a broken model.
3. **`high_risk_test.csv`** (all 9999) remains a poor test case — those values are OOD relative to training medians/encodings.
4. **Monitor** unknown categorical fallbacks and consider alerting when mode-imputation is used frequently.
5. **Optional:** Recalibrate decision threshold if business requires higher recall on mule accounts (current 0.5 threshold yields ~82 flags in 9082 rows).

---

## 7. Validation Command

```bash
cd backend
python3 validate_pipeline.py
# Output: validation_results.json
```
