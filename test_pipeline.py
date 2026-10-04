from ocr.preprocess import preprocess
from ocr.extract import extract_text
from ocr.nlp import analyze

processed = preprocess("sample.png")
text, avg, words = extract_text(processed, psm=3)
result = analyze(text)

print("Confidence:", avg)
print("Entities:", result["entities"])
print("Keywords:", result["keywords"])
print("Patterns:", result["patterns"])