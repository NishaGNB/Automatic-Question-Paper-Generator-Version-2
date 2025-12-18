#!/usr/bin/env python3
"""
Manual workflow test for AQPGS system.
Tests: signup → add subject → upload CSV → build structure → generate paper → accept/replace → export.
"""

import requests
import json
import sys
import time
from pathlib import Path

BASE_URL = "http://localhost:8001"

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'
BOLD = '\033[1m'

def log_step(msg):
    print(f"{BOLD}→ {msg}{RESET}")

def log_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def log_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def log_info(msg):
    print(f"{YELLOW}ℹ {msg}{RESET}")

class WorkflowTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.subject_id = None
        self.paper_id = None
        self.questions = []

    def test_signup(self):
        log_step("Step 1: Signup")
        try:
            resp = requests.post(f"{BASE_URL}/auth/signup", json={
                "name": "Dr. Test Faculty",
                "email": f"test-{int(time.time())}@example.com",
                "password": "testpass123",
                "department": "Computer Science",
                "contact_number": "+1234567890"
            })
            if resp.status_code != 200:
                log_error(f"Signup failed: {resp.text}")
                return False
            data = resp.json()
            self.token = data["access_token"]
            log_success("Signup successful")
            return True
        except Exception as e:
            log_error(f"Signup error: {e}")
            return False

    def test_add_subject(self):
        log_step("Step 2: Add Subject")
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            resp = requests.post(f"{BASE_URL}/subjects/", 
                json={"name": "Data Structures", "class_name": "CS-101", "semester": "Sem-1"},
                headers=headers)
            if resp.status_code != 200:
                log_error(f"Add subject failed: {resp.text}")
                return False
            data = resp.json()
            self.subject_id = data["id"]
            log_success(f"Subject added with ID {self.subject_id}")
            return True
        except Exception as e:
            log_error(f"Add subject error: {e}")
            return False

    def test_upload_questions(self):
        log_step("Step 3: Upload Question Bank")
        try:
            # Create a sample CSV
            csv_content = """question_text
Write a program to implement binary search tree insertion.
Explain the concept of time complexity in algorithms.
What is the difference between array and linked list?
Describe the quicksort algorithm with an example.
What is a stack? Give real-world applications."""
            
            headers = {"Authorization": f"Bearer {self.token}"}
            files = {"file": ("questions.csv", csv_content)}
            data = {"subject_id": self.subject_id}
            
            resp = requests.post(f"{BASE_URL}/questions/upload", 
                files=files, data=data, headers=headers)
            if resp.status_code != 200:
                log_error(f"Upload failed: {resp.text}")
                return False
            
            self.questions = resp.json()
            log_success(f"Uploaded {len(self.questions)} questions")
            for q in self.questions[:2]:
                log_info(f"Q{q['id']}: Module={q.get('module_no')}, Marks={q.get('marks')}, Bloom={q.get('blooms_level')}")
            return True
        except Exception as e:
            log_error(f"Upload error: {e}")
            return False

    def test_build_structure(self):
        log_step("Step 4: Build Paper Structure")
        # This is a UI test; we'll simulate the structure that would be created
        self.structure = [
            {
                "position": 1,
                "module_no": 1,
                "subparts": [
                    {"label": "a", "marks": 7, "blooms_level": "CL2"},
                    {"label": "b", "marks": 8, "blooms_level": "CL2"}
                ]
            },
            {
                "position": 2,
                "module_no": 2,
                "subparts": [
                    {"label": "a", "marks": 5, "blooms_level": "CL1"}
                ]
            }
        ]
        log_success("Paper structure built: 2 questions with 3 subparts")
        return True

    def test_generate_paper(self):
        log_step("Step 5: Generate Paper")
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            payload = {
                "subject_id": self.subject_id,
                "class_name": "CS-101",
                "exam_type": "Mid",
                "semester": "Sem-1",
                "structure": self.structure,
                "allow_repeat": False
            }
            
            resp = requests.post(f"{BASE_URL}/papers/generate",
                json=payload, headers=headers)
            if resp.status_code != 200:
                log_error(f"Generate failed: {resp.text}")
                return False
            
            data = resp.json()
            self.paper_id = data["paper_id"]
            items = data["items"]
            log_success(f"Paper generated with ID {self.paper_id}")
            log_info(f"Generated {len(items)} items")
            for item in items[:2]:
                log_info(f"Item pos={item['position']}, marks={item['marks']}, qid={item.get('question_id')}")
            return True
        except Exception as e:
            log_error(f"Generate error: {e}")
            return False

    def test_accept_question(self):
        log_step("Step 6: Accept a Question")
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            # First fetch paper details to get actual item position/subpart
            details = requests.get(f"{BASE_URL}/papers/{self.paper_id}/details", headers=headers)
            if details.status_code != 200:
                log_error(f"Failed to fetch paper details: {details.text}")
                return False
            d = details.json()
            if not d.get('items'):
                log_error("No items found in paper details")
                return False
            first_item = d['items'][0]
            pos = first_item.get('position')
            sub = first_item.get('subpart')
            # Build accept URL with or without subpart
            url = f"{BASE_URL}/papers/{self.paper_id}/accept?position={pos}"
            if sub:
                url += f"&subpart={sub}"
            resp = requests.post(url, headers=headers)
            if resp.status_code != 200:
                log_error(f"Accept failed: {resp.text}")
                return False
            log_success("Question accepted")
            return True
        except Exception as e:
            log_error(f"Accept error: {e}")
            return False

    def test_replace_question(self):
        log_step("Step 7: Replace a Question")
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            resp = requests.post(f"{BASE_URL}/papers/{self.paper_id}/replace",
                json={"position": 2, "subpart": "a"}, headers=headers)
            if resp.status_code != 200:
                log_error(f"Replace failed: {resp.text}")
                return False
            log_success("Question replaced")
            return True
        except Exception as e:
            log_error(f"Replace error: {e}")
            return False

    def test_export_paper(self):
        log_step("Step 8: Export Paper")
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            resp = requests.get(f"{BASE_URL}/papers/{self.paper_id}/export",
                headers=headers)
            if resp.status_code != 200:
                log_error(f"Export failed: {resp.text}")
                return False
            data = resp.json()
            log_success("Paper exported successfully")
            log_info(f"Export filename: {data.get('filename')}")
            content_lines = data.get('content', '').split('\n')[:3]
            for line in content_lines:
                log_info(f"  {line}")
            return True
        except Exception as e:
            log_error(f"Export error: {e}")
            return False

    def run_all(self):
        print(f"\n{BOLD}{'='*60}")
        print("AQPGS Manual Workflow Test")
        print(f"{'='*60}{RESET}\n")
        
        steps = [
            (self.test_signup, "Signup"),
            (self.test_add_subject, "Add Subject"),
            (self.test_upload_questions, "Upload Questions"),
            (self.test_build_structure, "Build Structure"),
            (self.test_generate_paper, "Generate Paper"),
            (self.test_accept_question, "Accept Question"),
            (self.test_replace_question, "Replace Question"),
            (self.test_export_paper, "Export Paper"),
        ]
        
        passed = 0
        failed = 0
        
        for test_fn, name in steps:
            try:
                if test_fn():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                log_error(f"{name} threw exception: {e}")
                failed += 1
        
        print(f"\n{BOLD}{'='*60}")
        print(f"Test Results: {GREEN}{passed} passed{RESET}, {RED}{failed} failed{RESET}")
        print(f"{'='*60}{RESET}\n")
        
        return failed == 0

if __name__ == "__main__":
    tester = WorkflowTester()
    success = tester.run_all()
    sys.exit(0 if success else 1)
