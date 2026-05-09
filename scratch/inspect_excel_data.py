import pandas as pd
import json

excel_file = "2026 Kerala Assembly Election - Dashboard.xlsx"
xls = pd.ExcelFile(excel_file)

output = ""
for sheet in xls.sheet_names:
    df = pd.read_excel(xls, sheet_name=sheet, header=None, nrows=15)
    output += f"\n--- Sheet: {sheet} ---\n"
    output += df.to_csv(index=False)

with open('scratch/excel_head.txt', 'w', encoding='utf-8') as f:
    f.write(output)

print("Head of each sheet saved to scratch/excel_head.txt")
