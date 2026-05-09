import pandas as pd
import json
import math

excel_file = "2026 Kerala Assembly Election - Dashboard.xlsx"
xls = pd.ExcelFile(excel_file)

def clean_nan(val):
    if isinstance(val, float) and math.isnan(val):
        return None
    return val

data = {
    "districts": [],
    "constituencies": {},
    "candidates": {},
    "vote_history": {},
    "current_mla": {}
}

def find_header_row(df, expected_col):
    for idx, row in df.iterrows():
        if expected_col in str(row.values):
            return idx
    return 0

# 1. Constituencies
df_raw = pd.read_excel(xls, sheet_name='Constituencies', header=None)
h_idx = find_header_row(df_raw, 'Number')
df_const = pd.read_excel(xls, sheet_name='Constituencies', header=h_idx)
df_const = df_const.dropna(subset=['Number'])

for _, row in df_const.iterrows():
    try:
        const_id = str(int(row['Number']))
    except ValueError:
        continue
    dist = str(row['District']).strip()
    if dist not in data['districts']:
        data['districts'].append(dist)
    
    data['constituencies'][const_id] = {
        "id": const_id,
        "name": str(row['Constituency']),
        "name_ml": str(row['Constituency_Ml']),
        "district": dist,
        "parliament": str(row['Loksabha']),
        "reservation": str(row['Reservation']) if not pd.isna(row['Reservation']) else "GEN",
        "male_voters": int(row['Male_Voters']) if not pd.isna(row['Male_Voters']) else 0,
        "female_voters": int(row['Femal_Voters']) if not pd.isna(row['Femal_Voters']) else 0,
        "total_voters": int(row['Total_Voters']) if not pd.isna(row['Total_Voters']) else 0,
    }

# 2. Current MLA
df_raw = pd.read_excel(xls, sheet_name='Current MLA', header=None)
h_idx = find_header_row(df_raw, 'Number')
df_mla = pd.read_excel(xls, sheet_name='Current MLA', header=h_idx)
df_mla = df_mla.dropna(subset=['Number'])
for _, row in df_mla.iterrows():
    try:
        const_id = str(int(row['Number']))
    except ValueError:
        continue
    data['current_mla'][const_id] = {
        "member": str(row['Member']),
        "party": str(row['Party']),
        "alliance": str(row['Alliance']),
        "age": clean_nan(row['Age']),
        "total_votes": int(row['Total Voters']) if not pd.isna(row['Total Voters']) else 0,
        "valid_votes": int(row['Valid Votes']) if not pd.isna(row['Valid Votes']) else 0,
        "valid_vote_percentage": clean_nan(row['Valid_Vote_Percentage']),
        "member_votes": int(row['Member_Votes']) if not pd.isna(row['Member_Votes']) else 0,
        "member_perc": clean_nan(row['Member_Perc']),
        "margin": int(row['Margin']) if not pd.isna(row['Margin']) else 0
    }

# 3. Candidates
df_raw = pd.read_excel(xls, sheet_name='Candidates', header=None)
h_idx = find_header_row(df_raw, 'number')
df_cand = pd.read_excel(xls, sheet_name='Candidates', header=h_idx)
df_cand['number'] = df_cand['number'].ffill()
df_cand = df_cand.dropna(subset=['candidates__name'])

for _, row in df_cand.iterrows():
    try:
        const_id = str(int(row['number']))
    except ValueError:
        continue
    if const_id not in data['candidates']:
        data['candidates'][const_id] = []
    
    photo = str(row['candidates__photo'])
    if pd.isna(row['candidates__photo']) or photo.lower() == 'nan':
        photo = ""
        
    data['candidates'][const_id].append({
        "alliance": str(row['candidates__alliance']) if not pd.isna(row['candidates__alliance']) else "Others",
        "party": str(row['candidates__party']) if not pd.isna(row['candidates__party']) else "",
        "name": str(row['candidates__name']),
        "name_ml": str(row['candidates__malayalam']) if not pd.isna(row['candidates__malayalam']) else "",
        "age": clean_nan(row['candidates__age']),
        "gender": str(row['candidates__gender']),
        "photo": photo,
        "symbol": str(row['candidates__symbol']) if not pd.isna(row['candidates__symbol']) else ""
    })

# 4. Vote History
df_raw = pd.read_excel(xls, sheet_name='Vote History', header=None)
h_idx = find_header_row(df_raw, 'Number')
df_hist = pd.read_excel(xls, sheet_name='Vote History', header=h_idx)
df_hist = df_hist.dropna(subset=['Number'])

for _, row in df_hist.iterrows():
    try:
        const_id = str(int(row['Number']))
    except ValueError:
        continue
    if const_id not in data['vote_history']:
        data['vote_history'][const_id] = []
        
    data['vote_history'][const_id].append({
        "election": str(row['Election']),
        "year": int(row['Year']),
        "winner_name": str(row['Winner_Name']),
        "winner_party": str(row['Winner_Party']),
        "winner_alliance": str(row['Winner__Alliance']),
        "winner_votes": int(row['Winner_Votes']) if not pd.isna(row['Winner_Votes']) else 0,
        "runnerup_name": str(row['RunnerUp__Name']),
        "runnerup_party": str(row['RunnerUp_Party']),
        "runnerup_alliance": str(row['RunnerUp__Alliance']),
        "runnerup_votes": int(row['RunnerUp_Votes']) if not pd.isna(row['RunnerUp_Votes']) else 0,
        "margin": int(row['Margin']) if not pd.isna(row['Margin']) else 0,
        "ldf_votes": int(row['AllianceVotes__LDF']) if not pd.isna(row['AllianceVotes__LDF']) else 0,
        "udf_votes": int(row['AllianceVotes__UDF']) if not pd.isna(row['AllianceVotes__UDF']) else 0,
        "nda_votes": int(row['AllianceVotes__NDA']) if not pd.isna(row['AllianceVotes__NDA']) else 0,
        "others_votes": int(row['AllianceVotes__Others']) if not pd.isna(row['AllianceVotes__Others']) else 0,
        "total_votes": int(row['TotalVotes']) if not pd.isna(row['TotalVotes']) else 0
    })

js_content = f"const klaData = {json.dumps(data, indent=2)};\n"
js_content += "if (typeof module !== 'undefined' && module.exports) { module.exports = klaData; }\n"
with open('kla2026-data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Data exported to kla2026-data.js")
