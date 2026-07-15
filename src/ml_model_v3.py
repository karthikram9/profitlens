"""
ProfitLens - Return Risk Prediction (V4)

Builds on V2b (Merchant-only scope, no leaky features) and adds ONE new
change: swaps the algorithm to XGBoost with scale_pos_weight, so we can
isolate what the algorithm change contributes on top of V2b/V3.

Also drops "ship-service-level" - it scored 0.000 feature importance in
both V2b and V3, so it's pure noise for this problem. Removing dead
features makes trees a little faster and easier to interpret, without
changing what the model can learn.
"""

import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier

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
# dataset, so Return_Flag for them is "unknown", not "confirmed non-return".
# Only Merchant orders have a trustworthy label.)
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
# (Fulfilment dropped - constant "Merchant" after the scope fix above)
# (ship-service-level dropped - 0.000 importance in V2b and V3)
# -----------------------------
features = [
    "Category",
    "Amount",
    "Qty",
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
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y,
)

# -----------------------------
# V4: XGBoost with scale_pos_weight
# scale_pos_weight tells XGBoost how much more to weight the minority
# (Returned) class - the standard formula is (# negatives / # positives),
# calculated from the TRAINING set only.
# -----------------------------
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
print("\nscale_pos_weight:", round(scale_pos_weight, 2))

xgb_model = XGBClassifier(
    random_state=RANDOM_STATE,
    scale_pos_weight=scale_pos_weight,
    eval_metric="logloss",
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
)
xgb_model.fit(X_train, y_train)
y_pred_xgb = xgb_model.predict(X_test)

# -----------------------------
# Evaluation - XGBoost
# -----------------------------
print("\nAccuracy:", accuracy_score(y_test, y_pred_xgb))
print("\nConfusion Matrix")
print(confusion_matrix(y_test, y_pred_xgb))
print("\nClassification Report")
print(classification_report(y_test, y_pred_xgb))

importances = pd.Series(xgb_model.feature_importances_, index=X.columns).sort_values(ascending=False)
print("\nFeature importances (XGBoost):")
print(importances)

# -----------------------------
# Comparison vs V2b and V3
# Same split, same random_state, same trimmed feature set - only the
# algorithm/technique changes across the three rows below.
# -----------------------------
rf_balanced = RandomForestClassifier(random_state=RANDOM_STATE, class_weight="balanced")
rf_balanced.fit(X_train, y_train)
y_pred_rf_balanced = rf_balanced.predict(X_test)

smote = SMOTE(random_state=RANDOM_STATE)
X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
rf_smote = RandomForestClassifier(random_state=RANDOM_STATE)
rf_smote.fit(X_train_smote, y_train_smote)
y_pred_rf_smote = rf_smote.predict(X_test)

print("\n================ V2b vs V3 vs V4 comparison ================")
print("\nV2b (RandomForest, class_weight=balanced):")
print(classification_report(y_test, y_pred_rf_balanced, digits=3))
print("\nV3 (RandomForest + SMOTE):")
print(classification_report(y_test, y_pred_rf_smote, digits=3))
print("\nV4 (XGBoost, scale_pos_weight):")
print(classification_report(y_test, y_pred_xgb, digits=3))