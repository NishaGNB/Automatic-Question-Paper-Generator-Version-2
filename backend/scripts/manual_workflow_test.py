"""
Simple manual workflow test for AQPGS backend.
Usage: python manual_workflow_test.py --api http://127.0.0.1:8001

Flow:
 - Signup (unique email)
 - Create a subject
 - Upload a small CSV of questions
 - Generate a paper
 - Get paper details
 - Accept first item
 - Export paper
"""
from __future__ import annotations
import requests
import time
import argparse
import json
import tempfile
import os

parser = argparse.ArgumentParser()
parser.add_argument("--api", default="http://127.0.0.1:8001", help="API base URL")
args = parser.parse_args()
API = args.api.rstrip("/")

def debug(r):
    print(r.status_code, r.url)
    try:
        print(r.json())
    except Exception:
        print(r.text[:500])

# 1. Signup
timestamp = int(time.time())
email = f"test_user_{timestamp}@example.com"
signup_payload = {"name": "Test User", "email": email, "password": "TestPass123", "department": "CS", "contact_number": "000"}
print("Signing up as:", email)
r = requests.post(f"{API}/auth/signup", json=signup_payload)
if r.status_code not in (200,201):
    print("Signup failed, trying to login if user exists")
    # attempt login with same email
    login_payload = {"email": email, "password": "TestPass123"}
    r = requests.post(f"{API}/auth/login", json=login_payload)
    if r.status_code != 200:
        print("Signup/login failed")
        debug(r)
        raise SystemExit(1)
else:
    print("Signup OK")

if r.status_code == 200 and r.headers.get("content-type","").startswith("application/json"):
    token = r.json().get("access_token")
else:
    token = r.json().get("access_token")

headers = {"Authorization": f"Bearer {token}"}

# 2. Create subject
sub_payload = {"name": "Test Subject", "class_name": "BSc CS", "semester": "I"}
print("Creating subject...")
r = requests.post(f"{API}/subjects/", json=sub_payload, headers=headers)
if r.status_code != 200:
    print("Create subject failed")
    debug(r)
    raise SystemExit(1)
subject = r.json()
subject_id = subject["id"] if isinstance(subject, dict) and "id" in subject else subject.get("id")
print("Subject created id:", subject_id)

# 3. Upload small CSV
csv_text = "question_text\nWhat is a compiler?\nExplain the phases of compiler design.\nDefine lexical analysis.\nWhat is parsing?\nDescribe code generation.\n"
with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as tf:
    tf.write(csv_text)
    tmpfname = tf.name
print("Uploading CSV", tmpfname)
with open(tmpfname, "rb") as fh:
    files = {"file": (os.path.basename(tmpfname), fh, "text/csv")}
    data = {"subject_id": str(subject_id)}
    r = requests.post(f"{API}/questions/upload", files=files, data=data, headers=headers)
os.unlink(tmpfname)
if r.status_code != 200:
    print("Upload failed")
    debug(r)
    raise SystemExit(1)
created_qs = r.json()
print("Uploaded questions count:", len(created_qs))

# 4. Generate paper
structure = [
    {"module_no": 1, "subparts": [{"label": "1", "marks": 5, "blooms_level": "Remember"}]},
    {"module_no": 1, "subparts": [{"label": "2", "marks": 10, "blooms_level": "Understand"}]}
]
gen_payload = {"subject_id": subject_id, "class_name": "BSc CS", "exam_type": "Midterm", "semester": "I", "structure": structure, "allow_repeat": False}
print("Generating paper...")
r = requests.post(f"{API}/papers/generate", json=gen_payload, headers=headers)
if r.status_code != 200:
    print("Generate failed")
    debug(r)
    raise SystemExit(1)
paper = r.json()
paper_id = paper.get("paper_id")
print("Paper created id:", paper_id)

# 5. Get paper details
print("Fetching details...")
r = requests.get(f"{API}/papers/{paper_id}/details", headers=headers)
if r.status_code != 200:
    print("Details failed")
    debug(r)
    raise SystemExit(1)
details = r.json()
print(json.dumps(details, indent=2))

# 6. Accept first item (position 1)
print("Accepting first item...")
r = requests.post(f"{API}/papers/{paper_id}/accept?position=1", headers=headers)
if r.status_code != 200:
    print("Accept failed")
    debug(r)
else:
    print("Accept OK", r.json())

# 7. Export
print("Exporting paper...")
r = requests.get(f"{API}/papers/{paper_id}/export", headers=headers)
if r.status_code != 200:
    print("Export failed")
    debug(r)
    raise SystemExit(1)
print("Export result:", r.json().get("filename"))
print("Content:\n", r.json().get("content"))

print("Manual workflow test completed.")
