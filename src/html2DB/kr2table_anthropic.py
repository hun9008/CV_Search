import anthropic
import os

# API 키 설정 (환경 변수 또는 직접 입력 가능)
ANTHROPIC_API_KEY = ""

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# 네이버 채용 데이터 파일 경로
naver_data_path = os.path.abspath('../../data/naver')

# 크롤링한 데이터 파일 목록
web_dic2 = {
    "naver_0": "https://recruit.navercorp.com/rcrt/view.do?annoId=30002937",
    "naver_1": "https://recruit.navercorp.com/rcrt/view.do?annoId=30002931",
    "naver_2": "https://recruit.navercorp.com/rcrt/view.do?annoId=30002921",
    "naver_3": "https://recruit.navercorp.com/rcrt/view.do?annoId=30002914",
    "naver_4": "https://recruit.navercorp.com/rcrt/view.do?annoId=30002911",
    "naver_5": "https://recruit.navercorp.com/rcrt/view.do?annoId=30002924",
    "naver_6": "https://recruit.navercorp.com/rcrt/view.do?annoId=30002895",
    "naver_7": "https://recruit.navercorp.com/rcrt/view.do?annoId=30002873",
    "naver_8": "https://recruit.navercorp.com/rcrt/view.do?annoId=30002876",
    "naver_9": "https://recruit.navercorp.com/rcrt/view.do?annoId=30002901",
}

# 각 채용 공고를 처리
for key, value in web_dic2.items():
    file_path = f"{naver_data_path}/{key}_kr.txt"
    
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            file_content = file.read()

        # Anthropic Claude API 호출
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",  # 최신 Claude 모델 사용 가능
            max_tokens=1024,  # 응답 길이 제한
            messages=[
                {
                    "role": "user",
                    "content": f'''아래 데이터를 읽고, 다음의 테이블 형식으로 정리하여 JSON 형식으로 출력해줘.

**모집 부서**:  
**모집 경력**:  
**업무 내용**:  
**근로 조건**:  
**공고 기간**:  
**지원 조건**:  
**우대 사항**:  
**인재상**:  

---
{file_content}
''',
                },
            ],
        )

        print(f"=== {key} ===")
        print(response.content[0].text)  # Claude 응답 출력

    except FileNotFoundError:
        print(f"[Error] 파일을 찾을 수 없음: {file_path}")
    except Exception as e:
        print(f"[Error] {key}: {e}")
    
    break