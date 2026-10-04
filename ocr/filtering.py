def filter_words(words, min_conf=60, min_len=2):
    """Keep only words Tesseract is confident about, then rebuild the text."""
    kept = [w for w in words
            if w["conf"] >= min_conf and len(w["text"].strip()) >= min_len]

    lines = {}
    for w in kept:
        key = (w["block"], w["par"], w["line"])
        lines.setdefault(key, []).append(w["text"])

    return "\n".join(" ".join(ws) for ws in lines.values())