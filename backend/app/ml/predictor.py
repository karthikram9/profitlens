import os
import joblib
import pandas as pd
import numpy as np

# Determine absolute paths for the model and encoders
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "return_risk_model_v5.joblib")
ENCODERS_PATH = os.path.join(CURRENT_DIR, "return_risk_encoders_v5.joblib")

# Load model and encoders once at import time
try:
    model = joblib.load(MODEL_PATH)
    encoders = joblib.load(ENCODERS_PATH)
    
    category_encoder = encoders["Category"]
    ship_state_encoder = encoders["ship-state"]
    
    # Establish fallback modes
    # "Set" was the most frequent Category in the training set
    # "MAHARASHTRA" was the most frequent ship-state in the training set
    CATEGORY_FALLBACK = "Set"
    SHIP_STATE_FALLBACK = "MAHARASHTRA"
    
    # Transform fallback values to get their class indices
    CATEGORY_FALLBACK_VAL = int(category_encoder.transform([CATEGORY_FALLBACK])[0])
    SHIP_STATE_FALLBACK_VAL = int(ship_state_encoder.transform([SHIP_STATE_FALLBACK])[0])
    
    model_loaded = True
    load_error = None
except Exception as e:
    model = None
    encoders = None
    model_loaded = False
    load_error = str(e)

def predict_risk(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies the saved encoders to Category and ship-state, selects features
    in the exact order (Category, Amount, Qty, ship-state, B2B, Month, Day_Of_Week, Price_Per_Unit),
    runs the XGBoost return risk model, and returns riskProbability and usedFallback columns.
    """
    if not model_loaded:
        raise RuntimeError(f"ML Model failed to load: {load_error}")
    
    # Copy DataFrame to avoid modifying original inputs
    input_df = df.copy()
    
    # Handle missing/computed fields if necessary
    if "Price_Per_Unit" not in input_df.columns:
        qty_denom = input_df["Qty"].replace(0, 1) if "Qty" in input_df.columns else 1
        amount_val = input_df["Amount"] if "Amount" in input_df.columns else 0
        input_df["Price_Per_Unit"] = amount_val / qty_denom
        
    if "Month" not in input_df.columns or "Day_Of_Week" not in input_df.columns:
        if "Date" in input_df.columns:
            dates = pd.to_datetime(input_df["Date"])
            input_df["Month"] = dates.dt.month
            input_df["Day_Of_Week"] = dates.dt.dayofweek
        else:
            # Fallback to defaults if no date column
            input_df["Month"] = input_df.get("Month", 1)
            input_df["Day_Of_Week"] = input_df.get("Day_Of_Week", 0)

    # Initialize columns for tracking fallbacks and encoded values
    used_fallback_series = pd.Series(False, index=input_df.index)
    encoded_category = []
    encoded_ship_state = []
    
    # Pre-cache classes for O(1) membership check
    cat_classes_set = set(category_encoder.classes_)
    state_classes_set = set(ship_state_encoder.classes_)
    
    # Process Category
    for idx, val in input_df["Category"].items():
        val_str = str(val).strip() if pd.notna(val) else ""
        if val_str in cat_classes_set:
            encoded_category.append(int(category_encoder.transform([val_str])[0]))
        else:
            encoded_category.append(CATEGORY_FALLBACK_VAL)
            used_fallback_series.at[idx] = True
            
    # Process ship-state
    for idx, val in input_df["ship-state"].items():
        val_str = str(val).strip() if pd.notna(val) else ""
        if val_str in state_classes_set:
            encoded_ship_state.append(int(ship_state_encoder.transform([val_str])[0]))
        else:
            encoded_ship_state.append(SHIP_STATE_FALLBACK_VAL)
            used_fallback_series.at[idx] = True

    # Prepare features matrix for inference
    X = pd.DataFrame(index=input_df.index)
    X["Category"] = encoded_category
    X["Amount"] = input_df["Amount"].fillna(0).astype(float)
    X["Qty"] = input_df["Qty"].fillna(1).astype(int)
    X["ship-state"] = encoded_ship_state
    X["B2B"] = input_df["B2B"].fillna(False).astype(int)
    X["Month"] = input_df["Month"].fillna(1).astype(int)
    X["Day_Of_Week"] = input_df["Day_Of_Week"].fillna(0).astype(int)
    X["Price_Per_Unit"] = input_df["Price_Per_Unit"].fillna(0).astype(float)
    
    # Feature contract check (exact order matters)
    feature_order = [
        "Category", "Amount", "Qty", "ship-state", "B2B", "Month", "Day_Of_Week", "Price_Per_Unit"
    ]
    X = X[feature_order]
    
    # Predict probabilities (Returned = 1 is class index 1)
    probabilities = model.predict_proba(X)[:, 1]
    
    # Append results back to the dataframe
    input_df["riskProbability"] = probabilities
    input_df["usedFallback"] = used_fallback_series
    
    return input_df
