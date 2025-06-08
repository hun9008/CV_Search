from src.fetch_RDB_query import fetch_job_data, fetch_cv_save_data

from collections import defaultdict

import os

import boto3

import json
from sentence_transformers import SentenceTransformer
from elasticsearch import Elasticsearch
import numpy as np

from dotenv import load_dotenv

import mysql.connector
from datetime import datetime
from urllib.parse import urlparse, unquote

from datetime import datetime, timedelta, timezone
import hashlib

KST = timezone(timedelta(hours=9))

load_dotenv(dotenv_path="./.env")
# load_dotenv(dotenv_path="../../.env")
es_host_ip = os.getenv("ELASTIC_HOST")
AWS_ACCESS_KEY_ID=os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=os.getenv("AWS_SECRET_ACCESS_KEY")
REGION=os.getenv("AWS_REGION")

RDB_HOST = os.getenv("DB_HOST_IP")
MYSQL_DB = os.getenv("MYSQL_DATABASE")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
es_username = os.getenv("ELASTIC_USER")        
es_password = os.getenv("ELASTIC_PASSWORD")

ES_HOST = es_host_ip
CV_INDEX_NAME = "cv_index"
JOBS_INDEX_NAME = "job_index"  

# print("ES_HOST:", ES_HOST)
# print("RDB_HOST:", RDB_HOST)

es = Elasticsearch(
    ES_HOST,
    basic_auth=(es_username, es_password),
    headers={
        "Accept": "application/json",
        "Content-Type": "application/json"
    },
    timeout=30,  
    max_retries=3,
    retry_on_timeout=True
)

print(es.info())

def delete_all_cv():
    try:
        response = es.delete_by_query(
            index=CV_INDEX_NAME,
            body={
                "query": {
                    "match_all": {}
                }
            }
        )
        print(f"[✓] CV index 전체 삭제 완료: 삭제된 문서 수 = {response['deleted']}")
    except Exception as e:
        print(f"[X] CV index 삭제 실패: {e}")


def delete_all_job():
    try:
        response = es.delete_by_query(
            index=JOBS_INDEX_NAME,
            body={
                "query": {
                    "match_all": {}
                }
            }
        )
        print(f"[✓] JOB index 전체 삭제 완료: 삭제된 문서 수 = {response['deleted']}")
    except Exception as e:
        print(f"[X] JOB index 삭제 실패: {e}")

def update_is_public(job_id, is_public=0):
    db_config = {
        "host": RDB_HOST,
        "port": 3306,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "database": MYSQL_DB
    }

    query = "UPDATE jobs SET is_public = %s WHERE id = %s"

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute(query, (is_public, job_id))
        conn.commit()

        if cursor.rowcount == 0:
            print(f"[!] job_id={job_id} 에 해당하는 레코드가 존재하지 않음.")
            return False

        print(f"[✓] MySQL JOB 업데이트 완료: job_id={job_id}, is_public={is_public}")
        return True

    except mysql.connector.Error as err:
        print(f"[X] MySQL 에러 발생: {err}")
        return False

    except Exception as e:
        print(f"[X] 기타 에러 발생: {e}")
        return False

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()
        return True

def delete_cv_RDB(cv_id):
    db_config = {
        "host": RDB_HOST,
        "port": 3306,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "database": MYSQL_DB
    }

    query = "DELETE FROM cv WHERE id = %s"

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute(query, (cv_id,))
        conn.commit()

        if cursor.rowcount == 0:
            print(f"[!] cv_id={cv_id} 에 해당하는 레코드가 존재하지 않음.")
            return False
        print(f"[✓] MySQL CV 삭제 완료: cv_id={cv_id}")
        return True

    except mysql.connector.Error as err:
        print(f"[X] MySQL 에러 발생: {err}")
        return False
    except Exception as e:
        print(f"[X] 기타 에러 발생: {e}")
        return False

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()
        return True

def delete_job(job_id):
    try:
        rdb_result = update_is_public(job_id, 0)
    except Exception as e:
        print(f"[!] RDB 업데이트 실패: {e}")
        return False

    try:
        response = es.delete(index=JOBS_INDEX_NAME, id=str(job_id))
        print(f"[✓] ES JOB 삭제 완료: job_id={job_id}")
        return response
    except Exception as es_error:
        print(f"[X] ES 삭제 실패: {es_error}")
        update_is_public(job_id, 1)
        print("is_public rollback to 1")
        return False

def delete_cv(cv_id):
    try:
        query = {
            "query": {
                "term": {
                    "cv_id": cv_id
                }
            }
        }
        search_result = es.search(index=CV_INDEX_NAME, body=query)
        if not search_result["hits"]["hits"]:
            print(f"[!] 해당 cv_id를 가진 문서를 찾을 수 없습니다: cv_id={cv_id}")
            return False

        doc_id = search_result["hits"]["hits"][0]["_id"]

        response = es.delete(index=CV_INDEX_NAME, id=doc_id)
        print(f"[✓] ES CV 삭제 완료: cv_id={cv_id} (doc_id={doc_id})")
        return response
    except Exception as e:
        print(f"[!] ES CV 삭제 실패: {e}")
        return False