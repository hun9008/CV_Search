import os

from dotenv import load_dotenv

import mysql.connector

load_dotenv(dotenv_path="./.env")
# load_dotenv(dotenv_path="../../.env")
es_host_ip = os.getenv("ELASTIC_HOST")
RDB_host_ip = os.getenv("DB_HOST_IP")
AWS_ACCESS_KEY_ID=os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=os.getenv("AWS_SECRET_ACCESS_KEY")
REGION=os.getenv("AWS_REGION")

RDB_HOST = os.getenv("DB_HOST_IP")
MYSQL_DB = os.getenv("MYSQL_DATABASE")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")

ES_HOST = es_host_ip

def fetch_job_data():
    db_config = {
        "host": RDB_HOST,
        "port": 3306,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "database": MYSQL_DB
    }

    query = """
    SELECT 
        id, 
        company_name, 
        title,
        region_id,
        department, 
        require_experience,
        job_description,
        job_type,
        requirements,
        preferred_qualifications,
        ideal_candidate,
        apply_start_date,
        apply_end_date,
        is_public,
        created_at,
        updated_at,
        expired_at,
        archived_at,
        raw_jobs_text,
        url,
        description,
        favicon,
        domain,
        region_text,
        last_updated_at
    FROM jobs;
    """

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query)
        results = cursor.fetchall()

        formatted_texts = []
        for row in results:
            formatted_text = f'''
"id": "{row['id']}"
"company_name": "{row['company_name'] or ''}"
"title": "{row['title'] or ''}"
"region_id": "{row['region_id'] or ''}"
"department": "{row['department'] or ''}"
"require_experience": "{row['require_experience'] or ''}"
"job_description": "{row['job_description'] or ''}"
"job_type": "{row['job_type'] or ''}"
"requirements": "{row['requirements'] or ''}"
"preferred_qualifications": "{row['preferred_qualifications'] or ''}"
"ideal_candidate": "{row['ideal_candidate'] or ''}"
"apply_start_date": "{row['apply_start_date'] or ''}"
"apply_end_date": "{row['apply_end_date'] or ''}"
"is_public": "{row['is_public'] or ''}"
"created_at": "{row['created_at'] or ''}"
"updated_at": "{row['updated_at'] or ''}"
"expired_at": "{row['expired_at'] or ''}"
"archived_at": "{row['archived_at'] or ''}"
"raw_jobs_text": "{row['raw_jobs_text'] or ''}"
"url": "{row['url'] or ''}"
"description": "{row['description'] or ''}"
"favicon": "{row['favicon'] or ''}"
"domain": "{row['domain'] or ''}"
"region_text": "{row['region_text'] or ''}"
"last_updated_at": "{row['last_updated_at'] or ''}"
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
