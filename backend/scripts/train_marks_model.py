import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib
from pathlib import Path

def train(csv_path: str):
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=["question_text", "marks"]).copy()
    df["marks"] = df["marks"].astype(int)
    pipe = Pipeline([("tfidf", TfidfVectorizer(max_features=5000)), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(df["question_text"].values, df["marks"].values)
    out = Path(__file__).resolve().parent.parent / "models_store" / "marks_model.joblib"
    out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, out)

if __name__ == "__main__":
    import sys
    train(sys.argv[1])
