import pandas as pd

df = pd.read_csv("data/featured_data.csv")

profitability = (
    df.groupby("Category")
    .agg(
        Total_Revenue=("Amount", "sum"),
        Total_Profit=("Estimated_Profit", "sum"),
        Orders=("Order ID", "count")
    )
    .sort_values(by="Total_Profit", ascending=False)
)

print(profitability)

profitability["Profit_Margin_%"] = (
    profitability["Total_Profit"]
    / profitability["Total_Revenue"]
) * 100

print(profitability)