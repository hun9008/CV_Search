import MySQLdb

# MySQL 연결
conn = MySQLdb.connect(
    user="root",
    passwd="1302",
    host="localhost",
    db="crawl_data",
    charset="utf8"
)
cursor = conn.cursor()

# 데이터 조회
cursor.execute("SELECT * FROM RECRUIT")
rows = cursor.fetchall()

# 데이터 출력
for row in rows:
    print(row)

# 연결 종료
cursor.close()
conn.close()
