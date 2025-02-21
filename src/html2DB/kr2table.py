import ollama
import os
ollama.pull("llama3.1")

web_dic2 = {
    "naver_0" : "https://recruit.navercorp.com/rcrt/view.do?annoId=30002937&sw=&subJobCdArr=&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr=",
    "naver_1" : "https://recruit.navercorp.com/rcrt/view.do?annoId=30002931&sw=&subJobCdArr=&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr=",
    "naver_2" : "https://recruit.navercorp.com/rcrt/view.do?annoId=30002921&sw=&subJobCdArr=&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr=",
    "naver_3" : "https://recruit.navercorp.com/rcrt/view.do?annoId=30002914&sw=&subJobCdArr=&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr=",
    "naver_4" : "https://recruit.navercorp.com/rcrt/view.do?annoId=30002911&sw=&subJobCdArr=&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr=",
    "naver_5" : "https://recruit.navercorp.com/rcrt/view.do?annoId=30002924&sw=&subJobCdArr=&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr=",
    "naver_6" : "https://recruit.navercorp.com/rcrt/view.do?annoId=30002895&sw=&subJobCdArr=&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr=",
    "naver_7" : "https://recruit.navercorp.com/rcrt/view.do?annoId=30002873&sw=&subJobCdArr=&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr=",
    "naver_8" : "https://recruit.navercorp.com/rcrt/view.do?annoId=30002876&sw=&subJobCdArr=&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr=",
    "naver_9" : "https://recruit.navercorp.com/rcrt/view.do?annoId=30002901&sw=&subJobCdArr=&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr=",
}

naver_data_path = os.path.abspath('../../data/naver')

for key, value in web_dic2.items():
    file_path = f"{naver_data_path}/{key}_kr.txt"
    with open(file_path, "r", encoding="utf-8") as file:
        file_content = file.read()

response = ollama.chat(
    model="llama3.1",
    messages=[
        {
            "role": "user",
            "content": '''밑에 있는 데이터 읽고 다음의 테이블에 채우고 마크다운형식의 테이블로 출력해줘.
                        모집 부서 :
                        모집 경력 :
                        업무 내용 :
                        근로 조건 :
                        공고 기간 :
                        지원 조건 :
                        우대 사항 :
                        인재상
                        ''' + file_content,
        },
    ],
)
print(response['message']['content'])