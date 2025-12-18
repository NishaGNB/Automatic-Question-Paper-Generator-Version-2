import sys
import pandas as pd
from sqlalchemy import create_engine

if len(sys.argv) < 2:
    print('Usage: inspect_sqlite_table.py <table_name>')
    sys.exit(1)

table = sys.argv[1]
engine = create_engine('sqlite:///aqpgs.db')
df = pd.read_sql_table(table, engine)
print('Table:', table)
print('Rows:', len(df))
print(df.dtypes)
print('\nSample value types:')
for col in df.columns:
    vals = df[col].dropna().head(5).tolist()
    types = [type(v) for v in vals]
    print(f" - {col}: types={types} sample={vals}")
