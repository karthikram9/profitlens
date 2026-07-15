import pandas as pd

df = pd.read_csv("data/cleaned_data.csv")

print("Dataset Loaded")

df["Estimated_COGS"] = df["Amount"] * 0.60;

print(df[["Amount", "Estimated_COGS"]].head());

# Platform Fee (10% of Amount)
df["Platform_Fee"] = df["Amount"] * 0.10

print(df[["Amount", "Platform_Fee"]].head())

# Shipping Cost

def shipping_cost(row):
    if row["Status"] == "Cancelled":
        return 0
    elif row["Amount"] < 500:
        return 40
    elif row["Amount"] < 1000:
        return 70
    else:
        return 100

df["Shipping_Cost"] = df.apply(shipping_cost, axis=1)

print(df[["Status", "Shipping_Cost"]].head(15))

# GST (18% of Amount)

df["GST"] = df["Amount"] * 0.18

print(df[["Amount", "GST"]].head())

df["Return_Loss"] = df["Status"].apply(
    lambda status: 140
    if any(keyword in status for keyword in ["Returned", "Returning", "Rejected"])
    else 0
)
print(df[["Amount", "Return_Loss"]].head())

print(
    df[df["Return_Loss"] > 0][
        ["Status", "Amount", "Return_Loss"]
    ].head(10)
)
# Estimated Profit
df["Estimated_Profit"] = (
    df["Amount"]
    - df["Estimated_COGS"]
    - df["Platform_Fee"]
    - df["Shipping_Cost"]
    - df["GST"]
    - df["Return_Loss"]
)

# Save engineered dataset
df.to_csv("data/featured_data.csv", index=False)

# Verify
print(df[[
    "Amount",
    "Estimated_COGS",
    "Platform_Fee",
    "Shipping_Cost",
    "GST",
    "Return_Loss",
    "Estimated_Profit"
]].head())

print("\nFeature engineering completed successfully!")

print(df["Estimated_Profit"].describe())