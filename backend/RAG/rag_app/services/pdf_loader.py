import fitz

def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text_store = ""

    for page in doc:
        text_in_page = page.get_text()
        if text_in_page:
            text_store += text_in_page + "\n"

    cleaned_text = text_store.strip()
    return cleaned_text