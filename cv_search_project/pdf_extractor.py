import pdfplumber

def extract_text_from_pdf(pdf_path):
    """
    PDF 파일에서 텍스트를 추출하는 함수
    """
    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = '\n'.join([page.extract_text() for page in pdf.pages if page.extract_text()])
        return text
    except Exception as e:
        return f"Error extracting text: {e}"