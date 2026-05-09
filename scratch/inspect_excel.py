import pandas as pd
import json

excel_file = "2026 Kerala Assembly Election - Dashboard.xlsx"
xls = pd.ExcelFile(excel_file)
print(f"Sheets: {xls.sheet_names}")

summary = {}
for sheet in xls.sheet_names:
    df = pd.read_excel(xls, sheet_name=sheet, nrows=5)
    summary[sheet] = df.columns.tolist()

with open('scratch/excel_summary.json', 'w') as f:
    json.dump(summary, f, indent=2)

print("Columns for each sheet saved to scratch/excel_summary.json")
