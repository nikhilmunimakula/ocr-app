import pytesseract
from PIL import Image
from ocr.preprocess import preprocess

FILE = "sample.png"

print("Original Image:")
print(pytesseract.image_to_string(Image.open(FILE)))

print("After Preprocessing:")
processed = preprocess(FILE, save_debug=True)
print(pytesseract.image_to_string(processed))
