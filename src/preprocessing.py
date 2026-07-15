import pandas as pd

# Load dataset
df = pd.read_csv("data/Amazon Sale Report.csv", low_memory=False)

# Remove unwanted column
#df.drop(columns=["Unnamed: 22"], inplace=True)

# Convert Date to datetime
#print(df["Date"].head(10))
#df["Date"] = pd.to_datetime(df["Date"], format="%m-%d-%y")
#print(df["Date"].dtype)
# Standardize category names
#df["Category"] = df["Category"].str.title()

# Save cleaned dataset
#df.to_csv("data/cleaned_data.csv", index=False)

print("Data preprocessing completed successfully!")
#print(df.info())