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

ES_HOST = es_host_ip
RDB_HOST = RDB_host_ip

def fetch_job_data():
    db_config = {
        "host": RDB_HOST,  
        "port": 3306,            
        "user": "user",           
        "password": "ajoucapstone",  
        "database": "goodjob"     
    }

    query = """
    SELECT 
        id, 
        company_name, 
        title,
        department, 
        experience, 
        job_type, 
        requirements, 
        preferred_qualifications,
        ideal_candidate,
        description,
        raw_jobs_text,
        url
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
"company_name": "{row['company_name'] or ''}"
"title": "{row['title'] or ''}"
"department": "{row['department'] or ''}"
"experience": "{row['experience'] or ''}"
"job_type": "{row['job_type'] or ''}"
"description": "{row['description'] or ''}"
"requirements": "{row['requirements'] or ''}"
"preferred_qualifications": "{row['preferred_qualifications'] or ''}"
"ideal_candidate": "{row['ideal_candidate'] or ''}"
"url": "{row['url'] or ''}"
"raw_jobs_text": "{row['raw_jobs_text'] or ''}"
            '''.strip()
            formatted_texts.append(formatted_text)

        return formatted_texts

    except mysql.connector.Error as err:
        print(f"MySQL 오류 발생: {err}")
        return []

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def fetch_cv_data(user_id):
    db_config = {
        "host": RDB_HOST,  
        "port": 3306,            
        "user": "user",           
        "password": "ajoucapstone",  
        "database": "goodjob" 
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
        if cursor:
            cursor.close()
        if conn:
            conn.close()
