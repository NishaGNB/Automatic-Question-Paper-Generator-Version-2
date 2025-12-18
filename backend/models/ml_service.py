from pathlib import Path
import joblib
from typing import Optional, Tuple

BASE = Path(__file__).resolve().parent.parent / "models_store"
# Prefer tuned/binned model filenames if present, else fall back to originals
MODULE_MODEL = BASE / "module_model.joblib"
BLOOMS_MODEL_PRIMARY = BASE / "blooms_model_tuned.joblib"
BLOOMS_MODEL_FALLBACK = BASE / "blooms_model.joblib"
MARKS_MODEL_PRIMARY = BASE / "marks_model_binned.joblib"
MARKS_MODEL_FALLBACK = BASE / "marks_model_tuned.joblib"

def choose_model(primary: Path, fallback: Path):
    if primary.exists():
        return primary
    if fallback.exists():
        return fallback
    return None

def load_model(path: Path):
    if path is None:
        return None
    if path.exists():
        try:
            return joblib.load(path)
        except Exception:
            return None
    return None

def predict_labels(text: str) -> Tuple[Optional[int], Optional[str], Optional[int]]:
    module_model = load_model(MODULE_MODEL)
    blooms_model_path = choose_model(BLOOMS_MODEL_PRIMARY, BLOOMS_MODEL_FALLBACK)
    blooms_model = load_model(blooms_model_path)
    marks_model_path = choose_model(MARKS_MODEL_PRIMARY, MARKS_MODEL_FALLBACK)
    marks_model = load_model(marks_model_path)
    m = None
    b = None
    mk = None
    if module_model:
        m = int(module_model.predict([text])[0])
    if blooms_model:
        b = str(blooms_model.predict([text])[0])
    if marks_model:
        # marks models may output bucket labels (e.g., 'low','mid','high') or numeric strings
        pred = marks_model.predict([text])[0]
        try:
            mk = int(pred)
        except Exception:
            # if prediction is a bucket label, map to representative numeric values
            p = str(pred).lower()
            bucket_map = {
                'low': 5,
                'mid': 8,
                'high': 10,
                'low ' : 5,
                ' mid': 8,
                ' high': 10
            }
            mk = bucket_map.get(p, None)
    return m, b, mk
