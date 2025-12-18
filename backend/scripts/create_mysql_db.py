from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

# Root credentials (password contains @, so percent-encode)
user = 'root'
password = 'Anugraha@2025'
password_enc = quote_plus(password)
host = '127.0.0.1'
port = 3306

db_name = 'aqpgs_db'

root_url = f"mysql+pymysql://{user}:{password_enc}@{host}:{port}/"
print(f"Connecting to MySQL server at {host}:{port} as {user}")
engine = create_engine(root_url)
with engine.connect() as conn:
    print(f"Creating database {db_name} if not exists...")
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"))
    conn.commit()
print('Database creation (if needed) complete.')
