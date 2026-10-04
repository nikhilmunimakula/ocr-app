import re
from collections import Counter

URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
JUNK_RE = re.compile(r"[^A-Za-z0-9\s.,:;!?@'/$%-]")

def extract_urls(text):
    """Return every URL found, without duplicates, in the order they appear."""
    urls = [u.rstrip(".,;:!?") for u in URL_RE.findall(text)]
    return list(dict.fromkeys(urls))

def extract_symbols(text):
    """Return the junk symbols found, with how many times each appears."""
    text = URL_RE.sub(" ", text.replace("\u2019", "'"))
    counts = Counter(JUNK_RE.findall(text))
    return [{"symbol": s, "count": n} for s, n in counts.most_common()]

def clean_for_dataset(text):
    """Standardize OCR text: lowercase, remove junk, tidy spacing."""
    text = text.lower()                                      #lowercase
    text = text.replace("\u2019","'")                        #curly to straigh apostrope
    text = URL_RE.sub(" ", text)                             #URLS
    text = JUNK_RE.sub(" ",text)                             #JUNK SYMBOLS

    lines = []
    for line in text.splitlines():
        #icons read as letters
        words = [w for w in line.split()
                 if len(w) > 1 or w in {"a", "i"} or w.isdigit()]

        if words:
            lines.append(" ".join(words))
    return "\n".join(lines)