import pandas as pd

df = pd.read_csv("data/cleaned_data.csv")

#print("Dataset Loaded Successfully")
#print(df.head())

#print(df["Category"].value_counts())

# Revenue by Category

'''revenue_by_category = df.groupby("Category")["Amount"].sum().sort_values(ascending=False)

print(revenue_by_category)'''

'''average_price = (
    df.groupby("Category")["Amount"]
      .mean()
      .sort_values(ascending=False)
)

print(average_price)'''

'''return_rate = (
    df.groupby("Category")["Status"]
      .apply(lambda x: x.str.contains("Returned|Returning|Rejected", case=False, na=False).mean() * 100)
      .sort_values(ascending=False)
)

print(return_rate)'''