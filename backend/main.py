from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
from catboost import CatBoostClassifier
import shap
import datetime
import numpy as np
import os
from pymongo import MongoClient
from dotenv import load_dotenv

from preprocessing import Preprocessor, PreprocessingError

load_dotenv()

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================
# MONGO DB CLIENT INITIALIZATION
# =================================================
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("WARNING: MONGO_URI environment variable not found. Defaulting to local connection.")
    MONGO_URI = "mongodb://localhost:27017/"

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client["muleshield"]
predictions_col = db["predictions"]


# =================================================
# LOAD MODEL + PREPROCESSING ARTIFACTS
# =================================================
ARTIFACT_DIR = os.path.dirname(os.path.abspath(__file__))

model = CatBoostClassifier()
model.load_model(os.path.join(ARTIFACT_DIR, "model.cbm"))

features = joblib.load(os.path.join(ARTIFACT_DIR, "features.pkl"))
model_features = list(model.feature_names_)

if features != model_features:
    raise RuntimeError(
        "features.pkl does not match model.cbm feature order — cannot start safely"
    )

preprocessor = Preprocessor.from_artifacts(ARTIFACT_DIR)

if len(preprocessor.model_features) != len(model_features):
    raise RuntimeError(
        f"Preprocessor feature count ({len(preprocessor.model_features)}) "
        f"does not match model ({len(model_features)})"
    )

explainer = shap.TreeExplainer(model)


# =================================================
# SAFE TYPE CONVERTER
# =================================================
def convert(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    return obj


# =================================================
# PREPROCESS (training-aligned)
# =================================================
def preprocess(data: dict) -> pd.DataFrame:
    if not isinstance(data, dict):
        raise PreprocessingError("Request body must be a JSON object")

    if len(data) == 0:
        raise PreprocessingError("Request body cannot be empty")

    input_df = preprocessor.transform_row(data)

    if list(input_df.columns) != features:
        raise PreprocessingError("Feature column order mismatch after preprocessing")

    if input_df.shape[1] != len(features):
        raise PreprocessingError(
            f"Expected {len(features)} features, got {input_df.shape[1]}"
        )

    if not np.issubdtype(input_df.dtypes.values[0], np.number):
        raise PreprocessingError("Preprocessed features must be numeric")

    return input_df


# =================================================
# GLOBAL IMPORTANCE
# =================================================
@app.get("/global-importance")
def global_importance():
    importance = model.get_feature_importance()

    df = pd.DataFrame({
        "feature": features,
        "importance": importance
    }).sort_values("importance", ascending=False)

    return df.head(20).to_dict(orient="records")


# =================================================
# HOME
# =================================================
@app.get("/")
def home():
    return {
        "message": "Mule Account Detection API is running",
        "model_features": len(features),
        "categorical_features": preprocessor.categorical_features,
    }


# =================================================
# MAIN PREDICTION
# =================================================
@app.post("/predict")
def predict(data: dict):
    try:
        input_df = preprocess(data)
    except PreprocessingError as exc:
        print("--- 422 ERROR LOG ---")
        print(f"Exception: {exc}")
        print(f"Row 'index' or 'id' if present: {data.get('Unnamed: 0', data.get('id', 'N/A'))}")
        import json
        payload_preview = dict(list(data.items())[:20])
        print(f"Payload preview (first 20): {json.dumps(payload_preview)}")
        
        # Try to extract the complaining feature from Exception
        msg = str(exc)
        if "Feature" in msg:
            print(f"Extracted feature info: {msg}")
            
        print("---------------------")
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request payload: {exc}",
        ) from exc

    try:
        prob = model.predict_proba(input_df)[0][1]
        risk_score = round(float(prob) * 100, 2)

        risk_level = (
            "Low Risk" if risk_score < 30 else
            "Medium Risk" if risk_score < 70 else
            "High Risk"
        )

        # ================= SAFE SHAP =================
        try:
            shap_values = explainer.shap_values(input_df)

            if isinstance(shap_values, list):
                shap_vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
            else:
                shap_vals = shap_values[0]

            feature_imp = pd.DataFrame({
                "Feature": input_df.columns,
                "Value": input_df.iloc[0].values,
                "SHAP": shap_vals
            })

            feature_imp["abs_shap"] = feature_imp["SHAP"].abs()
            feature_imp = feature_imp.sort_values("abs_shap", ascending=False)

            top_features = feature_imp.head(10).to_dict(orient="records")

            for row in top_features:
                row["SHAP"] = convert(row["SHAP"])
                row["Value"] = convert(row["Value"])

            reasons = [
                f"{f['Feature']} influenced risk"
                for f in top_features
                if f.get("SHAP", 0) > 0
            ][:3]

            if not reasons:
                reasons = ["No strong anomaly detected"]

        except Exception:
            top_features = []
            reasons = ["Explanation unavailable (SHAP error)"]

        alert = bool(risk_score > 70)

        features_dict = {
            col: convert(val)
            for col, val in input_df.iloc[0].to_dict().items()
        }

        mongo_doc = {
            "features": features_dict,
            "prediction": "Mule Account" if prob >= 0.5 else "Normal Account",
            "probability": float(prob),
            "risk_score": float(risk_score),
            "risk_level": risk_level,
            "fraud_alert": bool(alert),
            "explanation": top_features,
            "createdAt": datetime.datetime.now(datetime.timezone.utc)
        }

        inserted_id = None
        try:
            result = predictions_col.insert_one(mongo_doc)
            inserted_id = str(result.inserted_id)
        except Exception as mongo_err:
            print(f"Error inserting into MongoDB: {mongo_err}")

        return {
            "id": inserted_id or "",
            "prediction": "Mule Account" if prob >= 0.5 else "Normal Account",
            "probability": float(prob),
            "risk_score": float(risk_score),
            "risk_level": risk_level,
            "fraud_alert": bool(alert),
            "reasons": reasons,
            "explanation": top_features
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}",
        ) from exc


# =================================================
# AUDIT LOGS
# =================================================
@app.get("/audit-logs")
def get_logs():
    try:
        docs = list(predictions_col.find().sort("createdAt", -1).limit(100))
        for doc in docs:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            if isinstance(doc.get("createdAt"), datetime.datetime):
                doc["createdAt"] = doc["createdAt"].isoformat()
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
