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

def test_keyword_filter_query(index_name=JOBS_INDEX_NAME, size=10,
                               keyword=None,
                               job_type=None, experience=None,
                               sido=None, sigungu=None):
    try:
        must_clause = []
        if keyword:
            must_clause.append({
                "multi_match": {
                    "query": keyword,
                    "fields": [
                        "companyName^3",
                        "title^2",
                        "requirements",
                        "jobDescription",
                        "preferredQualifications",
                        "idealCandidate",
                        "experience",
                        "jobType"
                    ]
                }
            })

        filters = []
        if job_type:
            filters.append({"terms": {"jobType": job_type}})
        if experience:
            filters.append({"terms": {"experience": experience}})
        if sido:
            filters.append({"terms": {"sido": sido}})
        if sigungu:
            filters.append({"terms": {"sigungu": sigungu}})

        query = {
            "query": {
                "bool": {
                    "must": must_clause,
                    "filter": filters
                }
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

        print(f"[INFO] Retrieved {len(hits)} documents (keyword + filters):")
        for i, hit in enumerate(hits):
            print(f"\nDocument {i+1}:")
            print(json.dumps(hit['_source'], indent=2, ensure_ascii=False))

        return hits

    except Exception as e:
        print(f"[ERROR] Keyword + Filter ES query failed: {e}")
        return []
