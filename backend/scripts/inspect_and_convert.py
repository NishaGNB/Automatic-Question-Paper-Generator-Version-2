import sys
import pandas as pd
import json
from sqlalchemy import create_engine

if len(sys.argv) < 2:
    print('Usage: inspect_and_convert.py <table_name>')
    sys.exit(1)

table = sys.argv[1]
engine = create_engine('sqlite:///aqpgs.db')
df = pd.read_sql_table(table, engine)
print('Before conversion dtypes:')
print(df.dtypes)

obj_cols = df.select_dtypes(include=['object']).columns.tolist()
for col in obj_cols:
    print('\nColumn', col)
    sample = df[col].head(5).tolist()
    print(' sample types:', [type(x) for x in sample])

# perform conversion like migration script
for col in obj_cols:
    def _maybe_serialize(v):
        if v is None:
            return v
        try:
            if isinstance(v, (dict, list)):
                return json.dumps(v)
            if isinstance(v, (str, int, float, bool)):
                return v
            return json.dumps(v)
        except Exception:
            try:
                return str(v)
            except Exception:
                return v
    df[col] = df[col].apply(_maybe_serialize)

print('\nAfter conversion sample types:')
for col in obj_cols:
    sample = df[col].head(5).tolist()
    print(col, [type(x) for x in sample], sample[0])

# detect remaining problematic types
problem_cols = []
for col in df.columns:
    if df[col].apply(lambda x: isinstance(x, (dict, list))).any():
        problem_cols.append(col)

print('\nProblem columns remaining:', problem_cols)
if problem_cols:
    for col in problem_cols:
        print('Examples from', col, df[col].apply(lambda x: type(x)).value_counts().to_dict())
else:
    print('No remaining dict/list types; conversion OK')
