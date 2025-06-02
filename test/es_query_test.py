from collections import defaultdict

import os
import requests
import base64

import io

import json
import numpy as np

from dotenv import load_dotenv

from elasticsearch import Elasticsearch

from datetime import datetime, timedelta, timezone
import hashlib

KST = timezone(timedelta(hours=9))

load_dotenv(dotenv_path="./.env")
# load_dotenv(dotenv_path="../../.env")
es_host_ip = os.getenv("ELASTIC_HOST")
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
)

print(es.info())

def test_es_query(index_name=CV_INDEX_NAME, size=5):
    try:
        query = {
            "query": {
                "match_all": {}
            },
            "size": size,
            "sort": [
                {
                    "created_at": {
                        "order": "desc"
                    }
                }
            ]
        }

        response = es.search(index=index_name, body=query)
        hits = response.get('hits', {}).get('hits', [])

        print(f"[INFO] Retrieved {len(hits)} documents from '{index_name}':")
        for i, hit in enumerate(hits):
            print(f"\nDocument {i+1}:")
            print(json.dumps(hit['_source'], indent=2, ensure_ascii=False))

        return hits

    except Exception as e:
        print(f"[ERROR] Failed to query Elasticsearch: {e}")
        return []

if __name__ == "__main__":

    print("Testing Elasticsearch query...")
    hits = test_es_query(index_name=JOB_INDEX_NAME, size=5)
    if hits:
        print(f"Successfully retrieved {len(hits)} documents.")
    else:
        print("No documents found or query failed.")
    print("Test completed.")