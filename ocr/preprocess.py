import cv2

def preprocess(path, save_debug=False):

    #loads the image
    img = cv2.imread(path)
    if img is None:
        raise ValueError("Could not read the image. Check the file name.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    #upscales small images
    h, w = gray.shape
    if w < 1500:
        scale = 1500 / w
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    #removes noise and smooths the image
    denoised = cv2.fastNlMeansDenoising(gray, None, h=10)

    #applies adaptive thresholding to get a binary image
    _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    if save_debug:
        cv2.imwrite("debug_1_gray.png", gray)
        cv2.imwrite("debug_2_denoised.png", denoised)
        cv2.imwrite("debug_3_binary.png", binary)

    return binary