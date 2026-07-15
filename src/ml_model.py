import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    classification_report,
)

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

print("Dataset after filtering:", df.shape)

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

df["Is_Weekend"] = (
    df["Day_Of_Week"].isin([5, 6])
).astype(int)

df["Price_Per_Unit"] = (
    df["Amount"] / df["Qty"].replace(0, 1)
)

# -----------------------------
# Feature Selection
# -----------------------------
features = [
    "Category",
    "Amount",
    "Qty",
    "Fulfilment",
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
    "Fulfilment",
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
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

# -----------------------------
# Random Forest
# -----------------------------
model = RandomForestClassifier(
    random_state=42,
    class_weight="balanced",
)

model.fit(X_train, y_train)

# -----------------------------
# Prediction
# -----------------------------
y_pred = model.predict(X_test)

# -----------------------------
# Evaluation
# -----------------------------
print("Accuracy:", accuracy_score(y_test, y_pred))

print("\nConfusion Matrix")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report")
print(classification_report(y_test, y_pred))