from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time
import MySQLdb

# ✅ 크롬 드라이버 경로 설정 (절대 경로 사용)
chrome_driver_path = r"C:\Users\jin\Desktop\Capstone\chromedriver.exe"
service = Service(chrome_driver_path)

# ✅ 크롬 옵션 추가 (브라우저 창을 띄우지 않도록 설정 가능)
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # 백그라운드에서 실행 (선택 사항)

# ✅ 크롬 드라이버 실행
driver = webdriver.Chrome(service=service, options=options)

# 크롤링할 URL
url = "https://linkareer.com/list/recruit?filterBy_activityTypeID=5&filterBy_status=OPEN&orderBy_direction=DESC&orderBy_field=RECENT&page=1"
driver.get(url)

# 페이지가 완전히 로드될 때까지 대기
time.sleep(5)

# 페이지 소스 가져오기
soup = BeautifulSoup(driver.page_source, "html.parser")

# 모든 채용 공고 가져오기
job_listings = soup.find_all("tr", class_="activity-table-row")

# 크롤링한 데이터를 저장할 리스트
jobs_data = []

for job in job_listings:
    company_name = job.find("p", class_="company-name").get_text(strip=True) if job.find("p", class_="company-name") else "N/A"
    recruit_name = job.find("p", class_="recruit-name").get_text(strip=True) if job.find("p", class_="recruit-name") else "N/A"
    category = job.find("p", class_="recruit-category").get_text(strip=True) if job.find("p", class_="recruit-category") else "N/A"
    recruit_type = job.find("div", class_="item-recruit-type").find("p", class_="short-info-typo").get_text(strip=True) if job.find("div", class_="item-recruit-type") else "N/A"
    location = job.find("div", class_="item-location").find("p", class_="short-info-typo").get_text(strip=True) if job.find("div", class_="item-location") else "N/A"
    deadline = job.find("div", class_="item-recruit-close").find("p", class_="short-info-typo").get_text(strip=True) if job.find("div", class_="item-recruit-close") else "N/A"

    jobs_data.append((company_name, recruit_name, category, recruit_type, location, deadline))

# 드라이버 종료
driver.quit()

# MySQL 연결
conn = MySQLdb.connect(
    user="root",
    passwd="1302",
    host="localhost",
    db="crawl_data",
    charset="utf8"
)
cursor = conn.cursor()

# 테이블 생성 (없을 경우)
cursor.execute("""
    CREATE TABLE IF NOT EXISTS RECRUIT (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255),
        recruit_name VARCHAR(255),
        recruit_category VARCHAR(255),
        recruit_type VARCHAR(255),
        location VARCHAR(255),
        deadline VARCHAR(255)
    )
""")

# 크롤링한 데이터 삽입
sql = "INSERT INTO RECRUIT (company_name, recruit_name, recruit_category, recruit_type, location, deadline) VALUES (%s, %s, %s, %s, %s, %s)"
cursor.executemany(sql, jobs_data)

# 변경 사항 저장 및 연결 종료
conn.commit()
cursor.close()
conn.close()

print("데이터 저장 완료!")
