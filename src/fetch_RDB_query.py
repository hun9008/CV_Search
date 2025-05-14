import os

from dotenv import load_dotenv

import mysql.connector

from datetime import datetime

load_dotenv(dotenv_path="./.env")
# load_dotenv(dotenv_path="../../.env")
RDB_host_ip = os.getenv("DB_HOST_IP")
AWS_ACCESS_KEY_ID=os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=os.getenv("AWS_SECRET_ACCESS_KEY")
REGION=os.getenv("AWS_REGION")

RDB_HOST = os.getenv("DB_HOST_IP")
MYSQL_DB = os.getenv("MYSQL_DATABASE")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")

def fetch_job_data_dict():
    db_config = {
        "host": RDB_HOST,
        "port": 3306,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "database": MYSQL_DB
    }

    query = "SELECT * FROM jobs;"

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query)
        results = cursor.fetchall()
        return {str(row["id"]): row for row in results}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def fetch_job_data():
    db_config = {
        "host": RDB_HOST,
        "port": 3306,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "database": MYSQL_DB
    }

    query = "SELECT * FROM jobs;"

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query)
        results = cursor.fetchall()

        formatted_texts = []
        job_ids = []

        for row in results:
            formatted_text = f'''
"id": "{row['id']}"
"company_name": "{row['company_name'] or ''}"
"title": "{row['title'] or ''}"
"department": "{row['department'] or ''}"
"require_experience": "{row['require_experience'] or ''}"
"job_description": "{row['job_description'] or ''}"
"job_type": "{row['job_type'] or ''}"
"requirements": "{row['requirements'] or ''}"
"preferred_qualifications": "{row['preferred_qualifications'] or ''}"
"ideal_candidate": "{row['ideal_candidate'] or ''}"
"raw_jobs_text": "{row['raw_jobs_text'] or ''}"
"region_text": "{row['region_text'] or ''}"
            '''.strip()
            formatted_texts.append(formatted_text)
            job_ids.append(row['id'])

        return formatted_texts, job_ids

    except mysql.connector.Error as err:
        print(f"MySQL 오류 발생: {err}")
        return []

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


def fetch_cv_data(user_id):
    db_config = {
        "host": RDB_HOST,
        "port": 3306,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "database": MYSQL_DB
    }

    query = f"""
    SELECT 
        user_id, 
        raw_text
    FROM cv
    WHERE user_id = '{user_id}';
    """

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query)
        results = cursor.fetchall()

        formatted_texts = []
        for row in results:
            formatted_text = f'''
"user_id": "{row['user_id']}"
"raw_text": "{row['raw_text']}"
            '''.strip()
            formatted_texts.append(formatted_text)

        return formatted_texts

    except mysql.connector.Error as err:
        print(f"MySQL 오류 발생: {err}")
        return []

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def fetch_cv_save_data(s3_url, user_id, raw_text):
    db_config = {
        "host": RDB_HOST,
        "port": 3306,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "database": MYSQL_DB
    }

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        query = """
        UPDATE cv
        SET raw_text = %s,
            last_updated = %s
        WHERE user_id = %s
        """

        now = datetime.now()
        values = (raw_text, now, user_id)

        cursor.execute(query, values)
        conn.commit()

        if cursor.rowcount > 0:
            print(f"[✓] CV 업데이트 완료: user_id={user_id}")
        else:
            print(f"[!] 업데이트된 행이 없습니다: user_id={user_id}")

    except mysql.connector.Error as err:
        print(f"[X] MySQL 오류: {err}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()