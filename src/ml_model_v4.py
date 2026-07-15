"""
ProfitLens - Return Risk Prediction (V5)

Builds on V4 (XGBoost + scale_pos_weight) and adds ONE new change:
hyperparameter tuning via RandomizedSearchCV.

Why RandomizedSearchCV instead of GridSearchCV: with 5 hyperparameters,
a full grid search over even a modest number of values each becomes
thousands of model fits. RandomizedSearchCV samples a fixed number of
combinations (n_iter below) - much cheaper, and in practice gets close
to the same result as a full grid for this kind of data.

Why we optimize for F1, not accuracy: this dataset is imbalanced (6.6%
positive rate), so accuracy rewards a model for ignoring the minority
class entirely (as V1 showed). F1 forces the search to balance precision
and recall on the class we actually care about (Returned = 1).

Also drops "Is_Weekend" - it scored 0.000 importance in V4 (it's fully
redundant with Day_Of_Week, which already tells the model which day it is).
"""

import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, RandomizedSearchCV, StratifiedKFold
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, f1_score
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
df["Price_Per_Unit"] = df["Amount"] / df["Qty"].replace(0, 1)

# -----------------------------
# Feature Selection
# (Fulfilment dropped - constant after V2b scope fix)
# (ship-service-level dropped - 0.000 importance in V2b/V3)
# (Is_Weekend dropped - 0.000 importance in V4, redundant with Day_Of_Week)
# -----------------------------
features = [
    "Category",
    "Amount",
    "Qty",
    "ship-state",
    "B2B",
    "Month",
    "Day_Of_Week",
    "Price_Per_Unit",
]

X = df[features].copy()
y = df["Return_Flag"]

# -----------------------------
# Label Encoding
# -----------------------------
categorical = ["Category", "ship-state"]
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

scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

# -----------------------------
# V5: Hyperparameter search space
# -----------------------------
param_distributions = {
    "n_estimators": [100, 200, 300, 500],
    "max_depth": [3, 4, 5, 6, 8],
    "learning_rate": [0.01, 0.03, 0.05, 0.1, 0.2],
    "subsample": [0.6, 0.8, 1.0],
    "colsample_bytree": [0.6, 0.8, 1.0],
    "min_child_weight": [1, 3, 5, 7],
}

base_model = XGBClassifier(
    random_state=RANDOM_STATE,
    scale_pos_weight=scale_pos_weight,
    eval_metric="logloss",
)

# 5-fold stratified CV keeps the ~6.6% class ratio consistent across folds
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

search = RandomizedSearchCV(
    estimator=base_model,
    param_distributions=param_distributions,
    n_iter=40,             # number of random combinations to try
    scoring="f1",          # optimize for minority-class F1, not accuracy
    cv=cv,
    random_state=RANDOM_STATE,
    n_jobs=-1,
    verbose=1,
)

print("\nRunning RandomizedSearchCV (this can take a few minutes)...")
search.fit(X_train, y_train)

print("\nBest hyperparameters found:")
print(search.best_params_)
print("\nBest cross-validated F1:", round(search.best_score_, 4))

best_model = search.best_estimator_

# -----------------------------
# Evaluation on the held-out test set
# -----------------------------
y_pred = best_model.predict(X_test)

print("\nAccuracy:", accuracy_score(y_test, y_pred))
print("\nConfusion Matrix")
print(confusion_matrix(y_test, y_pred))
print("\nClassification Report")
print(classification_report(y_test, y_pred, digits=3))

importances = pd.Series(best_model.feature_importances_, index=X.columns).sort_values(ascending=False)
print("\nFeature importances (tuned XGBoost):")
print(importances)

# -----------------------------
# Save the final tuned model (needed for the next stage: persistence/API)
# -----------------------------
import joblib
joblib.dump(best_model, "src/return_risk_model_v5.joblib")
joblib.dump(encoders, "src/return_risk_encoders_v5.joblib")
print("\nSaved tuned model to src/return_risk_model_v5.joblib")
print("Saved encoders to src/return_risk_encoders_v5.joblib")
