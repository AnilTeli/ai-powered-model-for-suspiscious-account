# MuleTrace AI

### AI-Powered Mule Account Detection & Fraud Intelligence Platform

MuleTrace AI is an intelligent fraud detection and investigation platform developed for the **Bank of India CyberShield Hackathon 2026**.

The platform leverages Machine Learning, Explainable AI, and Risk Intelligence to identify suspicious accounts exhibiting mule-account behavior and assist financial institutions in investigating potential fraud cases.

MuleTrace AI transforms complex fraud predictions into actionable insights through a banking-grade dashboard designed for fraud analysts, investigators, and financial intelligence teams.

---

# Problem Statement

Financial frauds often involve mule accounts that act as intermediaries to move stolen funds through the banking system.

Traditional investigations are time-consuming and frequently occur after funds have already moved through multiple accounts.

MuleTrace AI helps institutions:

* Detect suspicious accounts
* Assign dynamic risk scores
* Explain prediction decisions
* Prioritize investigations
* Generate analyst-ready reports

---

# Key Features

## Risk Assessment Engine

Analyze account profiles and generate:

* Risk Score (0–100)
* Risk Classification
* Confidence Score
* Recommended Action

---

## Explainable AI

MuleTrace AI does not operate as a black-box model.

The platform explains predictions using:

* Feature Importance Analysis
* SHAP-Based Explanations
* Risk Driver Identification
* Human-Readable Insights

---

## Fraud Intelligence Dashboard

Professional banking dashboard displaying:

* Risk Score
* Prediction Results
* Confidence Levels
* Top Risk Drivers
* AI Investigation Summary
* Recommended Actions

---

## Demo Profile Analyzer

Users can:

1. Select a sample profile
2. Run AI analysis
3. View risk assessment
4. Review feature contributions
5. Generate investigation reports

---

## Investigation Reports

Generate professional reports containing:

* Executive Summary
* Risk Assessment
* Feature Analysis
* AI Findings
* Investigation Recommendation

---

# System Workflow

```text
Demo Profile
      ↓
Feature Vector
      ↓
ML Risk Engine
      ↓
Risk Score
      ↓
Explainability Layer
      ↓
Fraud Intelligence Dashboard
      ↓
Investigation Recommendation
```

---

# Technology Stack

## Frontend

* React
* Vite
* Tailwind CSS
* Recharts
* Lucide React

## Backend

* Python
* FastAPI

## Machine Learning

* CatBoost Classifier
* SHAP Explainability
* Feature Engineering Pipeline

## Database

* MongoDB

---

# Dashboard Modules

## Profile Analysis

Analyze suspicious account profiles.

---

## Risk Intelligence

Generate risk scores and classifications.

---

## Feature Contribution Analysis

Understand the key drivers behind model predictions.

---

## AI Investigation Summary

Receive analyst-friendly explanations of model outputs.

---

## Reporting Engine

Generate downloadable investigation reports.

---

# Risk Classification Framework

| Risk Score | Classification |
| ---------- | -------------- |
| 0 – 30     | Low Risk       |
| 31 – 60    | Medium Risk    |
| 61 – 80    | High Risk      |
| 81 – 100   | Critical Risk  |

---

# Project Structure

```text
MuleTrace-AI/

├── src/
│
├── components/
│   ├── ProfileSelector
│   ├── RiskGauge
│   ├── FeatureImportance
│   ├── SummaryCard
│   └── LoadingState
│
├── pages/
│   └── Dashboard
│
├── services/
│   └── api.js
│
├── mock/
│   └── demoProfiles.js
│
├── backend/
│   ├── main.py
│   ├── model.cbm
│   ├── features.pkl
│   ├── explainer.pkl
│   └── preprocessing.py
│
└── assets/
```

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
cd MuleTrace-AI
```

Install frontend dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Run backend:

```bash
cd backend
python3 main.py
```

---

# Future Enhancements

* Real-Time Transaction Monitoring
* Fraud Network Visualization
* Alert Management System
* Analyst Collaboration Tools
* Regulatory Feed Integration
* Advanced Anomaly Detection
* Automated Case Management

---

# Hackathon

Developed for:

**Bank of India CyberShield Hackathon 2026**

Problem Statement:

**Developing a solution having AI/ML capabilities for detecting suspicious transactions and mule accounts and preventing circulation of fraudulent proceeds through mule accounts.**

---

# Vision

MuleTrace AI aims to empower financial institutions with intelligent fraud detection, explainable risk assessment, and streamlined investigation workflows, enabling faster identification of suspicious accounts and more effective fraud prevention strategies.

---

# Team MuleTrace AI

### Detect. Trace. Investigate.
