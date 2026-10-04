import os
import uuid
from flask import Flask, request, jsonify, render_template

from ocr.preprocess import preprocess
from ocr.extract import extract_text
from ocr.filtering import filter_words
from ocr.nlp import analyze, clean_text

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024   # reject files over 8 MB

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED = {"png", "jpg", "jpeg", "bmp", "tiff", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    #Validate the request
    file = request.files.get("image")
    if file is None or file.filename == "":
        return jsonify(error="No file received."), 400
    if not allowed_file(file.filename):
        return jsonify(error="Use a PNG, JPG, BMP, TIFF or WEBP image."), 400

    #Save under a random name
    ext = file.filename.rsplit(".", 1)[1].lower()
    path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}.{ext}")
    file.save(path)

    try:
        psm = int(request.form.get("psm", 3))
        min_conf = int(request.form.get("min_conf", 60))

        #Run the pipeline
        processed = preprocess(path)
        raw_text, confidence, words = extract_text(processed, psm)

        # NLP runs on the filtered text (junk removed)
        filtered = filter_words(words, min_conf)
        result = analyze(filtered)

        #The user sees the full text
        shown = clean_text(raw_text)
        result["cleaned_text"] = shown
        result["word_count"] = len(shown.split())
        result["confidence"] = confidence
        result["raw_text"] = raw_text
        return jsonify(result)
    except Exception as e:
        return jsonify(error=f"Processing failed: {e}"), 500
    finally:
        #Always deletes the uploaded file, even if processing crashed
        if os.path.exists(path):
            os.remove(path)


if __name__ == "__main__":
    app.run(debug=True)