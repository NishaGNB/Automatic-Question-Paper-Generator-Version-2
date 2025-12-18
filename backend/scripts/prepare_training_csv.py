import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Try common locations for the source CSV: backend/questions.csv, workspace root questions.csv
candidate_paths = [
    ROOT / 'questions.csv',
    ROOT.parent / 'questions.csv',
    Path.cwd() / 'questions.csv'
]
SRC = None
for p in candidate_paths:
    if p.exists():
        SRC = p
        break
if SRC is None:
    SRC = ROOT / 'questions.csv'
OUT = Path(__file__).resolve().parent / 'questions_train.csv'

print(f"Reading {SRC}")
if not SRC.exists():
    raise SystemExit(f"Source CSV not found: {SRC}")

df = pd.read_csv(SRC)
# Normalize column names to lowercase stripped
cols = {c.strip().lower(): c for c in df.columns}

# Expected source columns in this dataset: 'modules', 'questions', 'marks', 'blooms_level'
if 'questions' not in cols or 'modules' not in cols:
    raise SystemExit('Expected columns not found in source CSV')

# Build output frame
out = pd.DataFrame()
out['question_text'] = df[cols['questions']].astype(str)
# module number
if 'modules' in cols:
    out['module_no'] = pd.to_numeric(df[cols['modules']], errors='coerce')
else:
    out['module_no'] = None
# marks
if 'marks' in cols:
    out['marks'] = pd.to_numeric(df[cols['marks']], errors='coerce')
else:
    out['marks'] = None
# blooms level
if 'blooms_level' in cols:
    out['blooms_level'] = df[cols['blooms_level']].astype(str)
else:
    out['blooms_level'] = None

# Drop rows that have no question text
out = out.dropna(subset=['question_text']).copy()

out.to_csv(OUT, index=False)
print(f"Wrote training CSV to {OUT}")
