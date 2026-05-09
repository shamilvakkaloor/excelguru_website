import pandas as pd
import json
import math

excel_file = 'KLA 2026 Result with Historic Data.xlsx'
xls = pd.ExcelFile(excel_file)

def clean_nan(val):
    if pd.isna(val) or (isinstance(val, float) and math.isnan(val)):
        return None
    return val

data = {
    "districts": [],
    "constituencies": {},
    "results": {},
    "vote_history": {},
    "candidates_meta": {} # To store candidate photo and other details if needed
}

def find_header_row(df, expected_cols):
    for idx, row in df.iterrows():
        row_str = str(row.values)
        if any(col in row_str for col in expected_cols):
            return idx
    return 0

# 1. Constituencies
df_raw = pd.read_excel(xls, sheet_name='Constituencies', header=None)
h_idx = find_header_row(df_raw, ['Number'])
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
        "name_ml": str(row['Constituency_Ml']) if 'Constituency_Ml' in row else "",
        "district": dist,
        "parliament": str(row['Loksabha']) if 'Loksabha' in row else "",
        "reservation": str(row['Reservation']) if 'Reservation' in row and not pd.isna(row['Reservation']) else "GEN",
        "male_voters": int(row['Male_Voters']) if 'Male_Voters' in row and not pd.isna(row['Male_Voters']) else 0,
        "female_voters": int(row['Femal_Voters']) if 'Femal_Voters' in row and not pd.isna(row['Femal_Voters']) else 0,
        "total_voters": int(row['Total_Voters']) if 'Total_Voters' in row and not pd.isna(row['Total_Voters']) else 0,
    }

# 2. Candidates Meta (for photos and names)
df_raw = pd.read_excel(xls, sheet_name='Candidates', header=None)
h_idx = find_header_row(df_raw, ['number'])
df_cand = pd.read_excel(xls, sheet_name='Candidates', header=h_idx)
df_cand['number'] = df_cand['number'].ffill()

for _, row in df_cand.iterrows():
    cand_ref = str(row.get('candidates__reference', ''))
    if not pd.isna(cand_ref) and cand_ref != 'nan':
        photo = str(row.get('candidates__photo', ''))
        if photo.lower() == 'nan': photo = ''
        data['candidates_meta'][cand_ref] = {
            "name_ml": str(row.get('candidates__malayalam', '')),
            "photo": photo
        }

# 3. Results 2026
df_res = pd.read_excel(xls, sheet_name='Result2026')
df_res = df_res.dropna(subset=['Number'])

for _, row in df_res.iterrows():
    try:
        const_id = str(int(row['Number']))
    except ValueError:
        continue
    if const_id not in data['results']:
        data['results'][const_id] = []
        
    cand_ref = str(row.get('Candidate_Ref', ''))
    meta = data['candidates_meta'].get(cand_ref, {})
    
    pos = row.get('Position')
    # If position is NaN, it might be NOTA or independent with few votes
    
    data['results'][const_id].append({
        "candidate_name": str(row['Candidate_Name']),
        "candidate_name_ml": meta.get('name_ml', ''),
        "alliance": str(row['Alliance']) if not pd.isna(row['Alliance']) else "Others",
        "party": str(row['Party']) if not pd.isna(row['Party']) else "Independent",
        "votes": int(row['Votes']) if not pd.isna(row['Votes']) else 0,
        "position": int(pos) if not pd.isna(pos) else 999,
        "photo": meta.get('photo', '')
    })

# Sort results by votes descending
for const_id in data['results']:
    data['results'][const_id] = sorted(data['results'][const_id], key=lambda x: x['votes'], reverse=True)
    # Calculate vote share and margin
    total_votes = sum([c['votes'] for c in data['results'][const_id]])
    for i, c in enumerate(data['results'][const_id]):
        c['vote_share'] = round((c['votes'] / total_votes * 100), 2) if total_votes > 0 else 0
        c['position'] = i + 1
        if i == 0 and len(data['results'][const_id]) > 1:
            c['margin'] = c['votes'] - data['results'][const_id][1]['votes']
        else:
            c['margin'] = 0

# 4. Vote History (to reuse charts)
df_raw = pd.read_excel(xls, sheet_name='Vote History', header=None)
h_idx = find_header_row(df_raw, ['Number'])
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
        "ldf_votes": int(row['AllianceVotes__LDF']) if not pd.isna(row['AllianceVotes__LDF']) else 0,
        "udf_votes": int(row['AllianceVotes__UDF']) if not pd.isna(row['AllianceVotes__UDF']) else 0,
        "nda_votes": int(row['AllianceVotes__NDA']) if not pd.isna(row['AllianceVotes__NDA']) else 0,
        "others_votes": int(row['AllianceVotes__Others']) if not pd.isna(row['AllianceVotes__Others']) else 0,
        "total_votes": int(row['TotalVotes']) if not pd.isna(row['TotalVotes']) else 0
    })

js_content = f"const klaResultsData = {json.dumps(data, indent=2)};\n"
js_content += "if (typeof module !== 'undefined' && module.exports) { module.exports = klaResultsData; }\n"

with open('kla2026-results-data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Data successfully exported to kla2026-results-data.js")
