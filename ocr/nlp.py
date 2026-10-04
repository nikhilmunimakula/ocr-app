import re
from collections import Counter
import spacy

#load once use in entire module
nlp = spacy.load("en_core_web_sm")


#Cleaning
def clean_text(text):
    text = text.replace("\x0c", "")                
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)   
    text = re.sub(r"[ \t]+", " ", text)            
    text = re.sub(r"\n{3,}", "\n\n", text)         
    return text.strip()


# Extraction
PATTERNS = {
    "emails":  r"[\w.+-]+@[\w-]+\.[\w.-]+",
    "phones":  r"\+?\d[\d\s().-]{8,}\d",
    "urls":    r"https?://[^\s]+|www\.[^\s]+",
    "dates":   r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
    "amounts": r"(?:[$€£₹]|Rs\.?)\s?\d[\d,]*\.?\d*",
}

def extract_patterns(text):
    return {name: sorted(set(re.findall(rx, text)))
            for name, rx in PATTERNS.items()}


#Named Entities
BLOCKLIST = {"search", "home", "identify", "digital", "eng"}

def extract_entities(text, ignore=()):
    wanted = {"PERSON", "ORG", "GPE"}
    lines = [ln for ln in text.split("\n") if ln.strip()]
    seen, out = set(), []
    for doc in nlp.pipe(lines):
        for ent in doc.ents:
            if ent.label_ not in wanted:
                continue
            if any(ent.text in item or item in ent.text for item in ignore):
                continue
            if ent[0].is_stop:                          # "Your Learning"
                continue
            if ent.text.lower() in BLOCKLIST:           # known UI labels
                continue
            if ent.label_ == "PERSON" and len(ent) < 2: # single-word "person"
                continue
            key = (ent.text, ent.label_)
            if key not in seen:
                seen.add(key)
                out.append({"text": ent.text, "label": ent.label_})
    return out

#Keywords
def extract_keywords(text, n=8):
    words = [t.lemma_.lower() for t in nlp(text)
             if t.is_alpha and len(t.text)>2 and not t.is_stop and t.pos_ in {"NOUN", "PROPN"}]
    return [w for w, _ in Counter(words).most_common(n)]


#all together
def analyze(text):
    cleaned = clean_text(text)
    patterns = extract_patterns(cleaned)
    found_by_regex = [x for items in patterns.values() for x in items]
    return {
        "cleaned_text": cleaned,
        "patterns": patterns,
        "entities": extract_entities(cleaned, ignore=found_by_regex),
        "keywords": extract_keywords(cleaned),
        "word_count": len(cleaned.split()),
    }