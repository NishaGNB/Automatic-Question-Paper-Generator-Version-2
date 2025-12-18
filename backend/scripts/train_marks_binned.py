"""
Train marks classifier on binned marks (quantile buckets) to reduce class cardinality
and improve generalization.
Saves `marks_model_binned.joblib` to models_store.
"""
from pathlib import Path
import pandas as pd
import joblib
import warnings
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

if not CSV.exists():
    raise SystemExit('questions_train.csv not found.')

df = pd.read_csv(CSV)
if 'marks' not in df.columns or df['marks'].dropna().empty:
    raise SystemExit('No marks column available for training')

mk_df = df.dropna(subset=['question_text','marks']).copy()
mk_df['marks'] = mk_df['marks'].astype(int)

# Create 3 quantile-based buckets: low, mid, high
n_bins = 3
mk_df['marks_bucket'] = pd.qcut(mk_df['marks'], q=n_bins, labels=['low','mid','high'])
print(f"Bucket distribution:\n{mk_df['marks_bucket'].value_counts()}\n")

X = mk_df['question_text'].values
y = mk_df['marks_bucket'].astype(str).values

random_state = 42
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)

# LogisticRegression grid
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000)),
    ('clf', LogisticRegression(max_iter=2000, class_weight='balanced', random_state=random_state))
])
param_grid_lr = {
    'tfidf__ngram_range': [(1,1),(1,2)],
    'clf__C': [0.1, 1, 10]
}

gs_lr = GridSearchCV(pipeline, param_grid_lr, cv=cv, scoring='accuracy', n_jobs=-1)
gs_lr.fit(X, y)
print(f"Best LR CV: {gs_lr.best_score_:.4f} params: {gs_lr.best_params_}")

# RandomForest grid
pipeline_rf = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000)),
    ('clf', RandomForestClassifier(random_state=random_state, class_weight='balanced'))
])
param_grid_rf = {
    'tfidf__ngram_range': [(1,1)],
    'clf__n_estimators': [200, 400],
    'clf__max_depth': [None, 20]
}

gs_rf = GridSearchCV(pipeline_rf, param_grid_rf, cv=cv, scoring='accuracy', n_jobs=-1)
gs_rf.fit(X, y)
print(f"Best RF CV: {gs_rf.best_score_:.4f} params: {gs_rf.best_params_}")

best_gs = gs_lr if gs_lr.best_score_ >= gs_rf.best_score_ else gs_rf
best_est = best_gs.best_estimator_

# Test split evaluation
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=random_state)
y_pred = best_est.predict(X_test)
print(f"Test accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred))

out_path = MODELS_DIR / 'marks_model_binned.joblib'
joblib.dump(best_est, out_path)
print(f"Saved binned marks model to {out_path}")
