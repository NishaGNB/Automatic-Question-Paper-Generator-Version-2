"""
Tuned training for Bloom's and Marks classifiers.
- Normalizes Bloom's labels (lowercase/strip)
- Maps very rare labels (count < min_count) to 'other' to reduce noise
- Trains pipelines (TfidfVectorizer + estimator)
- Uses GridSearchCV with StratifiedKFold to tune LogisticRegression and RandomForestClassifier
- Saves best models to backend/models_store
"""

import warnings
from pathlib import Path
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.metrics import accuracy_score, classification_report

warnings.filterwarnings('ignore')

ROOT = Path(__file__).resolve().parents[1]
CSV = Path(__file__).resolve().parent / 'questions_train.csv'
MODELS_DIR = ROOT / 'models_store'
MODELS_DIR.mkdir(parents=True, exist_ok=True)

min_label_count = 3
random_state = 42
cv_splits = 5

if not CSV.exists():
    raise SystemExit('questions_train.csv not found. Run prepare_training_csv.py first.')

df = pd.read_csv(CSV)
print(f"Loaded {len(df)} rows from {CSV}")

# Normalize blooms labels
if 'blooms_level' in df.columns:
    df['blooms_norm'] = df['blooms_level'].fillna('').astype(str).str.strip().str.lower()
    # replace slashes and multiple spaces with single space
    df['blooms_norm'] = df['blooms_norm'].str.replace('/', ' ')
    df['blooms_norm'] = df['blooms_norm'].str.replace('\s+', ' ', regex=True).str.strip()
    # map rare labels to 'other'
    counts = df['blooms_norm'].value_counts()
    rare = counts[counts < min_label_count].index.tolist()
    if rare:
        print(f"Mapping {len(rare)} rare Bloom's labels to 'other' (threshold={min_label_count})")
        df['blooms_norm'] = df['blooms_norm'].apply(lambda x: 'other' if x in rare or x=='' else x)

# Helper to run grid search
def tune_and_save(X, y, model_name, target_col):
    print(f"\nTuning model for: {model_name}  (n_samples={len(y)})")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=random_state)

    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000)),
        ('clf', LogisticRegression(max_iter=2000, random_state=random_state))
    ])

    cv = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=random_state)

    # LogisticRegression grid
    param_grid_lr = {
        'tfidf__ngram_range': [(1,1),(1,2)],
        'clf': [LogisticRegression(max_iter=2000, class_weight='balanced', random_state=random_state)],
        'clf__C': [0.01, 0.1, 1, 10]
    }
    gs_lr = GridSearchCV(pipeline, param_grid_lr, cv=cv, scoring='accuracy', n_jobs=-1, verbose=0)
    gs_lr.fit(X_train, y_train)
    print(f"Best LR CV score: {gs_lr.best_score_:.4f} with params: {gs_lr.best_params_}")

    # RandomForest grid
    pipeline_rf = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000)),
        ('clf', RandomForestClassifier(random_state=random_state))
    ])
    param_grid_rf = {
        'tfidf__ngram_range': [(1,1)],
        'clf': [RandomForestClassifier(random_state=random_state, class_weight='balanced')],
        'clf__n_estimators': [200, 500],
        'clf__max_depth': [None, 20]
    }
    gs_rf = GridSearchCV(pipeline_rf, param_grid_rf, cv=cv, scoring='accuracy', n_jobs=-1, verbose=0)
    gs_rf.fit(X_train, y_train)
    print(f"Best RF CV score: {gs_rf.best_score_:.4f} with params: {gs_rf.best_params_}")

    # Choose best by CV score
    best_gs = gs_lr if gs_lr.best_score_ >= gs_rf.best_score_ else gs_rf
    best_est = best_gs.best_estimator_
    # Evaluate
    y_pred_test = best_est.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred_test)
    print(f"Selected model test accuracy: {test_acc:.4f}")
    print(classification_report(y_test, y_pred_test))

    # Save model
    out_path = MODELS_DIR / f"{model_name}.joblib"
    joblib.dump(best_est, out_path)
    print(f"Saved tuned model to {out_path}")
    return {'cv_best': best_gs.best_score_, 'test_acc': test_acc}

# Train Bloom's model
if 'blooms_norm' in df.columns and df['blooms_norm'].notna().sum() > 0:
    bl_df = df.dropna(subset=['question_text']).copy()
    bl_df = bl_df[bl_df['blooms_norm'] != '']
    X = bl_df['question_text'].values
    y = bl_df['blooms_norm'].values
    if len(set(y)) < 2:
        print('Not enough Bloom classes to train.')
    else:
        res_blooms = tune_and_save(X, y, 'blooms_model_tuned', 'blooms_norm')
else:
    print("No Bloom's labels available; skipping blooms training.")

# Train marks model
if 'marks' in df.columns and df['marks'].notna().sum() > 0:
    mk_df = df.dropna(subset=['question_text','marks']).copy()
    mk_df['marks'] = mk_df['marks'].astype(int)
    # Normalize rare marks into an 'other' class to avoid stratify errors
    counts_marks = mk_df['marks'].value_counts()
    rare_marks = counts_marks[counts_marks < min_label_count].index.tolist()
    if rare_marks:
        print(f"Mapping {len(rare_marks)} rare marks values to 'other' (threshold={min_label_count})")
    # create marks_norm as string labels
    def map_marks(v):
        return 'other' if v in rare_marks else str(v)
    mk_df['marks_norm'] = mk_df['marks'].apply(map_marks)
    X = mk_df['question_text'].values
    y = mk_df['marks_norm'].values
    if len(set(y)) < 2:
        print('Not enough marks classes to train.')
    else:
        res_marks = tune_and_save(X, y, 'marks_model_tuned', 'marks')
else:
    print('No marks labels available; skipping marks training.')

print('\nTuned training complete.')
