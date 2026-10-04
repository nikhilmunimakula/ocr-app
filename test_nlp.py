from ocr.nlp import analyze
import json

sample = """Invoice from Google India
Contact John Smith at john@acme.com or +91 98765 43210.
Paid $250 on 12/03/2025.   Visit www.acme.com



Thank you."""

print(json.dumps(analyze(sample), indent=2, ensure_ascii=False))