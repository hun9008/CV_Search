from bs4 import BeautifulSoup

def extract_korean_lines(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    korean_lines = []

    data = soup.get_text().split('\n')

    for idx, line in enumerate(data):
        if any('\uac00' <= char <= '\ud7a3' for char in line):
            korean_lines.append(data[idx])
            korean_lines.append(data[idx+1])
            korean_lines.append(data[idx+2])

            

    return korean_lines

if __name__ == "__main__":
    with open('./NAVER Careers.html', 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    korean_lines = extract_korean_lines(html_content)
    
    for line in korean_lines:
        print(line)