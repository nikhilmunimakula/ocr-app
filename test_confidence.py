from ocr.preprocess import preprocess
from ocr.extract import extract_text

processed = preprocess("sample.png")

#compare layouts
for psm in (3, 6, 11):
    text, avg, words = extract_text(processed, psm)
    print(f"psm {psm}: {len(words)} words, average confidence {avg}%")

text, avg, words = extract_text(processed, psm=3)
doubtful = [w["text"] for w in words if w["conf"] < 60]
print("\nDoubtful words:", doubtful)