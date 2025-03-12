from bs4 import BeautifulSoup
import os

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
    naver_data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/naver/'))

    htmls = sorted(os.listdir(naver_data_path))
    
    for html in htmls:
        with open(naver_data_path + '/' + html, 'r', encoding='utf-8') as file:
            html_content = file.read()
        
        korean_lines = extract_korean_lines(html_content)
        
        with open(naver_data_path + '/' + html.split('.')[0] + '_kr.txt', 'w', encoding='utf-8') as file:
            for line in korean_lines:
                file.write(line + '\n')

    # print(htmls)
    
    # korean_lines = extract_korean_lines(html_content)
    
    # for line in korean_lines:
    #     print(line)