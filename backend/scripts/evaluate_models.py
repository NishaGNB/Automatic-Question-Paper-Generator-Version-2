import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV = Path(__file__).resolve().parent / 'questions_train.csv'
MODELS_DIR = ROOT / 'models_store'

print(f"Loading data from {CSV}")
if not CSV.exists():
    raise SystemExit("Training CSV not found. Run prepare_training_csv.py first.")

df = pd.read_csv(CSV)
print(f"Total rows: {len(df)}")

results = {}

# Evaluate module_no model
if 'module_no' in df.columns and df['module_no'].notna().sum() > 0:
    mod_df = df.dropna(subset=['module_no']).copy()
    X = mod_df['question_text'].values
    y = mod_df['module_no'].astype(int).values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model_path = MODELS_DIR / 'module_model.joblib'
    if model_path.exists():
        print('\nEvaluating module model...')
        model = joblib.load(model_path)
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        print(f"Module model accuracy: {acc:.4f}")
        print(classification_report(y_test, y_pred))
        results['module'] = {'accuracy': acc}
    else:
        print('Module model file not found.')

# Evaluate blooms_level model
if 'blooms_level' in df.columns and df['blooms_level'].notna().sum() > 0:
    bl_df = df.dropna(subset=['blooms_level']).copy()
    X = bl_df['question_text'].values
    y = bl_df['blooms_level'].astype(str).str.strip().values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model_path = MODELS_DIR / 'blooms_model.joblib'
    if model_path.exists():
        print('\nEvaluating blooms model...')
        model = joblib.load(model_path)
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        print(f"Blooms model accuracy: {acc:.4f}")
        print(classification_report(y_test, y_pred))
        results['blooms'] = {'accuracy': acc}
    else:
        print('Blooms model file not found.')

# Evaluate marks model
if 'marks' in df.columns and df['marks'].notna().sum() > 0:
    mk_df = df.dropna(subset=['marks']).copy()
    X = mk_df['question_text'].values
    y = mk_df['marks'].astype(int).values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model_path = MODELS_DIR / 'marks_model.joblib'
    if model_path.exists():
        print('\nEvaluating marks model...')
        model = joblib.load(model_path)
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        print(f"Marks model accuracy: {acc:.4f}")
        print(classification_report(y_test, y_pred))
        results['marks'] = {'accuracy': acc}
    else:
        print('Marks model file not found.')

print('\nEvaluation complete.')
