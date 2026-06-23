# MuleShield AI

### AI-Powered Mule Account Detection & Fraud Intelligence Platform

MuleShield AI is an intelligent fraud detection platform developed for the **Bank of India CyberShield Hackathon 2026**. The system leverages Machine Learning and Explainable AI to identify suspicious accounts exhibiting mule-account behavior and provides actionable intelligence for fraud analysts.

The platform transforms complex risk predictions into clear investigation workflows through an intuitive banking-grade dashboard, helping institutions prioritize high-risk accounts and accelerate fraud investigations.

---

## Problem Statement

Financial institutions face increasing challenges in identifying mule accounts used to move fraudulent funds through the banking system.

MuleShield AI addresses this challenge by:

* Detecting potentially suspicious accounts using AI/ML
* Assigning dynamic risk scores
* Explaining predictions using feature-level insights
* Providing investigation-ready summaries
* Supporting analyst decision-making through actionable recommendations

---

## Key Features

### Risk Assessment Engine

Analyze customer account profiles and generate:

* Risk Score (0–100)
* Risk Classification
* Confidence Score
* Recommended Action

---

### Explainable AI

Instead of providing a black-box prediction, MuleShield AI highlights:

* Top contributing features
* Feature impact scores
* Model reasoning
* Investigation insights

---

### Fraud Investigation Dashboard

A professional banking dashboard displaying:

* Risk Score
* Prediction Results
* Confidence Levels
* Feature Importance
* AI Investigation Summary
* Recommended Actions

---

### Demo Profile Analyzer

The platform includes curated demo profiles representing different risk categories.

Users can:

1. Select a profile
2. Run AI analysis
3. Review risk assessment
4. Examine contributing factors
5. Download investigation reports

---

### Investigation Reports

Generate analyst-friendly reports containing:

* Executive Summary
* Risk Assessment
* Contributing Risk Factors
* AI Findings
* Recommended Actions

---

## System Workflow

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
Investigation Dashboard
      ↓
Recommended Action
```

---

## Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Recharts
* Lucide React

### Backend

* Python
* FastAPI / Flask

### Machine Learning

* CatBoost
* SHAP
* Feature Engineering Pipeline

### Database

* MongoDB

---

## Dashboard Modules

### Profile Analysis

Select and analyze account profiles.

### Risk Intelligence

View risk scores and classifications.

### Feature Analysis

Understand key risk-driving features.

### AI Investigation Summary

Receive human-readable explanations of model predictions.

### Reporting

Generate investigation-ready reports.

---

## Risk Classification

| Risk Score | Classification |
| ---------- | -------------- |
| 0 – 30     | Low Risk       |
| 31 – 60    | Medium Risk    |
| 61 – 80    | High Risk      |
| 81 – 100   | Critical Risk  |

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd MuleShield-AI-Fresh
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
``
---

## Future Enhancements

* Real-time transaction monitoring
* Fraud network visualization
* Alert management system
* Analyst collaboration tools
* Regulatory feed integration
* Advanced anomaly detection

---

## Hackathon

Developed for:

**Bank of India CyberShield Hackathon 2026**

Theme:

**AI/ML-Based Detection of Suspicious Transactions and Mule Accounts**

---

## Team

MuleShield AI Team

Building intelligent solutions for next-generation financial fraud prevention.
