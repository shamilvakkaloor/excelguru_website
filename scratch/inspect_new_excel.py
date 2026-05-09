import pandas as pd
import json

excel_file = 'KLA 2026 Result with Historic Data.xlsx'
xls = pd.ExcelFile(excel_file)

data = {}

def extract_head(sheet_name):
    try:
        # Find header
        df_raw = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        h_idx = 0
        for idx, row in df_raw.iterrows():
            if 'Number' in str(row.values) or 'number' in str(row.values) or 'Constituency_Name' in str(row.values) or 'candidates__ref' in str(row.values):
                h_idx = idx
                break
                
        df = pd.read_excel(xls, sheet_name=sheet_name, header=h_idx, nrows=5)
        # Convert NaN to None
        df = df.where(pd.notnull(df), None)
        data[sheet_name] = df.to_dict(orient='records')
    except Exception as e:
        data[sheet_name] = str(e)

for sheet in ['Result2026', 'Constituencies', 'Vote History', 'Candidates']:
    extract_head(sheet)

with open('scratch/excel_preview.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
