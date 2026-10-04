import pytesseract
from PIL import Image

img = Image.open("sample.png")
print(pytesseract.image_to_string(img))