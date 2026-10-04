# Image to Text (OCR + NLP)
A Flask web app that extracts text from images using Tesseract OCR, then uses spaCy and regex to find names, organizations, keywords,emails, phone numbers, dates and amounts.

## Requirements
- Python 3.9+
- Tesseract OCR installed (Windows: `winget install UB-Mannheim.TesseractOCR`)

## Run it
```
git clone https://github.com/nikhilmunimakula/ocr-app.git
cd ocr-app
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py
```
Open http://127.0.0.1:5000

## How it works
Image → OpenCV preprocessing → Tesseract OCR → confidence filter → NLP → browser