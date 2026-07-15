"""
ProfitLens - Return Risk Prediction (V3)

Builds on V2b (Merchant-only scope, no leaky features) and adds ONE new
change: SMOTE oversampling on the training set, so we can isolate exactly
what SMOTE contributes on top of class_weight="balanced".

Note: SMOTE is applied ONLY to the training set, after the train/test split.
Applying it before the split (or to the test set) would leak synthetic
copies of test-like points into training and inflate the evaluation - a
common mistake worth calling out in your report.
"""

import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from imblearn.over_sampling import SMOTE

RANDOM_STATE = 42

# -----------------------------
# Load Dataset
# -----------------------------
df = pd.read_csv("data/featured_data.csv")
print("Dataset Loaded")

# -----------------------------
# Create Target Variable
# -----------------------------
df["Return_Flag"] = df["Status"].apply(
    lambda status: 1
    if any(keyword in status for keyword in ["Returned", "Returning", "Rejected"])
    else 0
)

# -----------------------------
# Remove Cancelled & Pending Orders
# -----------------------------
exclude_status = [
    "Cancelled",
    "Pending",
    "Pending - Waiting for Pick Up",
]
df = df[~df["Status"].isin(exclude_status)].copy()
print("After removing cancelled/pending:", df.shape)

# -----------------------------
# V2b: Restrict to Merchant-fulfilled orders
# (Amazon-fulfilled orders never get a granular return status in this
# dataset - see the crosstab check we ran earlier - so Return_Flag for them
# is "unknown", not "confirmed non-return". Only Merchant orders have a
# trustworthy label.)
# -----------------------------
df = df[df["Fulfilment"] == "Merchant"].copy()
print("After restricting to Merchant-fulfilled:", df.shape)
print("Return rate:", round(df["Return_Flag"].mean() * 100, 2), "%")

# -----------------------------
# Remove Missing Values
# -----------------------------
df = df.dropna(subset=["Amount", "ship-state"])

# -----------------------------
# Feature Engineering
# -----------------------------
df["Date"] = pd.to_datetime(df["Date"], format="%m-%d-%y")
df["Month"] = df["Date"].dt.month
df["Day_Of_Week"] = df["Date"].dt.dayofweek
df["Is_Weekend"] = (df["Day_Of_Week"].isin([5, 6])).astype(int)
df["Price_Per_Unit"] = df["Amount"] / df["Qty"].replace(0, 1)

# -----------------------------
# Feature Selection
# (Fulfilment dropped - it's constant "Merchant" after the scope fix above)
# -----------------------------
features = [
    "Category",
    "Amount",
    "Qty",
    "ship-service-level",
    "ship-state",
    "B2B",
    "Month",
    "Day_Of_Week",
    "Is_Weekend",
    "Price_Per_Unit",
]

X = df[features].copy()
y = df["Return_Flag"]

# -----------------------------
# Label Encoding
# -----------------------------
categorical = [
    "Category",
    "ship-service-level",
    "ship-state",
]
encoders = {}
for col in categorical:
    encoder = LabelEncoder()
    X[col] = encoder.fit_transform(X[col])
    encoders[col] = encoder

X["B2B"] = X["B2B"].astype(int)

# -----------------------------
# Train-Test Split
# (Always split BEFORE oversampling - SMOTE must never see the test set)
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y,
)

print("\nBefore SMOTE - training class distribution:")
print(y_train.value_counts())

# -----------------------------
# V3: SMOTE Oversampling (training data only)
# -----------------------------
smote = SMOTE(random_state=RANDOM_STATE)
X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)

print("\nAfter SMOTE - training class distribution:")
print(y_train_smote.value_counts())

# -----------------------------
# Random Forest (trained on SMOTE-balanced data)
# Note: class_weight="balanced" is dropped here - the training set is
# already balanced 50/50 by SMOTE, so reweighting on top of that would
# double-correct for imbalance and can overcorrect toward the minority class.
# -----------------------------
model = RandomForestClassifier(random_state=RANDOM_STATE)
model.fit(X_train_smote, y_train_smote)

# -----------------------------
# Prediction (on the untouched, real, imbalanced test set)
# -----------------------------
y_pred = model.predict(X_test)

# -----------------------------
# Evaluation
# -----------------------------
print("\nAccuracy:", accuracy_score(y_test, y_pred))
print("\nConfusion Matrix")
print(confusion_matrix(y_test, y_pred))
print("\nClassification Report")
print(classification_report(y_test, y_pred))

importances = pd.Series(model.feature_importances_, index=X.columns).sort_values(ascending=False)
print("\nFeature importances:")
print(importances)

# -----------------------------
# Quick comparison vs V2b (class_weight="balanced", no SMOTE)
# so you can see exactly what SMOTE changed, isolated from every other
# variable - same split, same features, same random_state.
# -----------------------------
baseline_model = RandomForestClassifier(random_state=RANDOM_STATE, class_weight="balanced")
baseline_model.fit(X_train, y_train)
y_pred_baseline = baseline_model.predict(X_test)

print("\n================ V2b vs V3 comparison ================")
print("\nV2b (class_weight=balanced, no SMOTE):")
print(classification_report(y_test, y_pred_baseline, digits=3))
print("\nV3 (SMOTE, no class_weight):")
print(classification_report(y_test, y_pred, digits=3))