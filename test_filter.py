from ocr.preprocess import preprocess
from ocr.extract import extract_text
from ocr.filtering import filter_words
from ocr.nlp import analyze

processed = preprocess("sample.png")
text, avg, words = extract_text(processed, psm=3)

for min_conf in (0, 60, 80):
    cleaned = filter_words(words, min_conf)
    result = analyze(cleaned)
    print(f"\n min_conf = {min_conf} ")
    print("Words kept:", result["word_count"])
    print("Entities:", [e["text"] for e in result["entities"]])
    print("Keywords:", result["keywords"])