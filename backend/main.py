from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
from catboost import CatBoostClassifier
import shap
import datetime
import numpy as np
import os
from pymongo import MongoClient

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

client = MongoClient(MONGO_URI)
db = client["muleshield"]
predictions_col = db["predictions"]


# =================================================
# LOAD MODEL + FEATURES
# =================================================
model = CatBoostClassifier()
model.load_model("model.cbm")

features = joblib.load("features.pkl")

suspicious = ['F3912', 'F2230', 'F3908', 'F270']

explainer = shap.TreeExplainer(model)


# =================================================
# SAFE TYPE CONVERTER (IMPORTANT FIX)
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
# PREPROCESS
# =================================================
def preprocess(data: dict):
    df = pd.DataFrame([data])

    df = df.reindex(columns=features, fill_value=0)
    df = df.drop(columns=suspicious, errors="ignore")

    return df


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
    return {"message": "Mule Account Detection API is running"}


# =================================================
# MAIN PREDICTION (FIXED)
# =================================================
@app.post("/predict")
def predict(data: dict):

    try:
        input_df = preprocess(data)

        # ================= PREDICTION =================
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

            # ✅ FIX: convert SHAP values safely
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

        # ================= ALERT =================
        alert = bool(risk_score > 70)

        # Extract 59 model features only and convert numpy types
        features_dict = {
            col: convert(val)
            for col, val in input_df.iloc[0].to_dict().items()
        }

        # ================= MONGO AUDIT LOG =================
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

        try:
            predictions_col.insert_one(mongo_doc)
        except Exception as mongo_err:
            print(f"Error inserting into MongoDB: {mongo_err}")

        # ================= SAFE RETURN =================
        return {
            "id": str(mongo_doc.get("_id", "")),
            "prediction": "Mule Account" if prob >= 0.5 else "Normal Account",
            "probability": float(prob),
            "risk_score": float(risk_score),
            "risk_level": risk_level,
            "fraud_alert": bool(alert),
            "reasons": reasons,
            "explanation": top_features
        }

    except Exception as e:
        return {
            "error": str(e)
        }


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
        return {"error": str(e)}