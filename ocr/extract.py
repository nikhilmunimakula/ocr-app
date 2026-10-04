import pytesseract
from pytesseract import Output

def extract_text(image, psm=3):
    config = f"--oem 3 --psm {psm}"

    #plain text
    text = pytesseract.image_to_string(image, config=config)

    #detailed data
    data = pytesseract.image_to_data(image, config=config, output_type=Output.DICT)

    words = []
    for i, word in enumerate(data["text"]):
        conf = float(data["conf"][i])
        if word.strip() and conf > 0:
            words.append({
                "text": word,
                "conf": conf,
                "x": data["left"][i],
                "y": data["top"][i],
                "w": data["width"][i],
                "h": data["height"][i],
                "block": data["block_num"][i],
                "par": data["par_num"][i],
                "line": data["line_num"][i],
            })
    avg = round(sum(w["conf"] for w in words) / len(words), 1) if words else 0.0
    return text, avg, words
