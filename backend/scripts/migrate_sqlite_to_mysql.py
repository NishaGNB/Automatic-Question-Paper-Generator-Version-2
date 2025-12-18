"""
Migrate data from local SQLite `aqpgs.db` to a MySQL database.
Usage:
  1) Ensure MySQL server is running and you have DATABASE_URL like:
     mysql+pymysql://user:password@host:3306/aqpgs_db
  2) Activate your project's virtualenv (if any) and install requirements
  3) Run:
     python migrate_sqlite_to_mysql.py --sqlite sqlite:///aqpgs.db --mysql "mysql+pymysql://user:pass@127.0.0.1:3306/aqpgs_db"

Notes:
- This script uses pandas.to_sql which will CREATE TABLES in MySQL; indexes/constraints may be lost and should be re-applied if necessary.
- Use on a copy/backup of your data first.
"""

import argparse
from sqlalchemy import create_engine, text
import pandas as pd
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--sqlite', required=True, help='SQLite SQLAlchemy URL, e.g. sqlite:///aqpgs.db')
parser.add_argument('--mysql', required=True, help='MySQL SQLAlchemy URL, e.g. mysql+pymysql://user:pass@host:3306/db')
args = parser.parse_args()

sqlite_url = args.sqlite
mysql_url = args.mysql

print('Connecting to SQLite:', sqlite_url)
print('Connecting to MySQL:', mysql_url)

# Create engines
sqlite_eng = create_engine(sqlite_url)
mysql_eng = create_engine(mysql_url)

# Inspect tables in sqlite
with sqlite_eng.connect() as conn:
    res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"))
    tables = [r[0] for r in res]

if not tables:
    print('No tables found in SQLite database. Aborting.')
    raise SystemExit(1)

print('Found tables:', tables)

# Copy each table
for t in tables:
    print(f"Reading table {t} from SQLite")
    df = pd.read_sql_table(t, sqlite_eng)
    # Convert any object-typed columns that contain dict/list objects to JSON strings
    import json
    obj_cols = df.select_dtypes(include=['object']).columns.tolist()
    for col in obj_cols:
        def _maybe_serialize(v):
            if v is None:
                return v
            # pandas.isna can be ambiguous for lists/arrays, avoid using it here
            try:
                # If it's a dict or list, JSON-serialize
                if isinstance(v, (dict, list)):
                    return json.dumps(v)
                # If scalar types, keep as-is
                if isinstance(v, (str, int, float, bool)):
                    return v
                # Otherwise, attempt to JSON-serialize fallback
                return json.dumps(v)
            except Exception:
                # As a last resort, convert to string
                try:
                    return str(v)
                except Exception:
                    return v
        try:
            df[col] = df[col].apply(_maybe_serialize)
        except Exception:
            # skip problematic column
            pass
    print(f"  rows: {len(df)} — writing to MySQL")
    # Write to MySQL, replace if exists
    df.to_sql(t, mysql_eng, if_exists='replace', index=False)
    print('  done')

print('Migration finished. Please verify constraints and indexes in MySQL Workbench.')
