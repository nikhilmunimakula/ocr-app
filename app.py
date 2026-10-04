import os
import uuid

from flask import Flask, jsonify, render_template, request

from ocr.cleaning import clean_for_dataset, extract_symbols, extract_urls
from ocr.extract import extract_text
from ocr.filtering import filter_words
from ocr.preprocess import preprocess

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 40 * 1024 * 1024    # whole request, all images

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED = {"png", "jpg", "jpeg", "bmp", "tiff", "webp"}
MAX_FILES = 20
MIN_CONF = 60


def allowed_file(name):
    return "." in name and name.rsplit(".", 1)[1].lower() in ALLOWED


def process_one(file):
    """OCR one uploaded image and return one labeled record (a dictionary)."""
    ext = file.filename.rsplit(".", 1)[1].lower()
    path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}.{ext}")
    file.save(path)
    try:
        processed = preprocess(path)
        raw_text, confidence, words = extract_text(processed, psm=3)
        clean = clean_for_dataset(filter_words(words, MIN_CONF))
        return {
            "file": file.filename,
            "confidence": confidence,
            "word_count": len(clean.split()),
            "status": "ok" if confidence >= 60 and clean else "needs_review",
            "urls": extract_urls(raw_text),            # searched in the full OCR text
            "symbols": extract_symbols(raw_text),      # searched in the full OCR text
            "raw_text": raw_text.strip(),
            "clean_text": clean,
        }
    finally:
        if os.path.exists(path):
            os.remove(path)                            # always clean up


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    files = [f for f in request.files.getlist("images") if f.filename]
    if not files:
        return jsonify(error="No images received."), 400
    if len(files) > MAX_FILES:
        return jsonify(error=f"Upload at most {MAX_FILES} images at a time."), 400

    results, errors = [], []
    for file in files:                                 # loop over every image
        if not allowed_file(file.filename):
            errors.append({"file": file.filename, "error": "Not a supported image type."})
            continue
        try:
            results.append(process_one(file))
        except Exception as e:                         # one bad file must not stop the rest
            errors.append({"file": file.filename, "error": str(e)})

    return jsonify(results=results, errors=errors)


if __name__ == "__main__":
    app.run(debug=True)