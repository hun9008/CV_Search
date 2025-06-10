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

def test_keyword_filter_query(index_name=JOBS_INDEX_NAME, size=10,
                               keyword=None,
                               job_type=None, experience=None,
                               sido=None, sigungu=None):
    try:
        must_clause = []

        if keyword:
            should_clauses = [
                {
                    "multi_match": {
                        "query": keyword,
                        "fields": [
                            "company_name^3",
                            "title^2",
                            "requirements",
                            "job_description",
                            "preferred_qualifications",
                            "ideal_candidate",
                            "experience",
                            "job_type"
                        ],
                        "type": "most_fields"
                    }
                }
            ]

            # match_phrase_prefix로 접두사 부분일치도 함께 지원
            prefix_fields = [
                ("company_name", 2),
                ("title", 2),
                ("requirements", 1),
                ("job_description", 1),
                ("preferred_qualifications", 1),
                ("ideal_candidate", 1),
                ("experience", 1),
                ("job_type", 1)
            ]

            for field, boost in prefix_fields:
                should_clauses.append({
                    "match_phrase_prefix": {
                        field: {
                            "query": keyword,
                            "boost": boost
                        }
                    }
                })

            must_clause.append({
                "bool": {
                    "should": should_clauses
                }
            })

        filters = []
        if job_type:
            filters.append({"terms": {"job_type.keyword": job_type}})
        if experience:
            filters.append({"terms": {"require_experience.keyword": experience}})
        if sido:
            filters.append({"terms": {"sido.keyword": sido}})
        if sigungu:
            filters.append({"terms": {"sigungu.keyword": sigungu}})

        query = {
            "query": {
                "bool": {
                    "must": must_clause,
                    "filter": filters
                }
            },
            "size": size,
            "sort": [
                {"_score": "desc"},
                {"created_at": {"order": "desc"}}
            ]
        }

        print("[DEBUG] ES QUERY =")
        print(json.dumps(query, indent=2, ensure_ascii=False))

        response = es.search(index=index_name, body=query)
        hits = response.get('hits', {}).get('hits', [])

        print(f"[INFO] Retrieved {len(hits)} documents")
        return hits

    except Exception as e:
        print(f"[ERROR] Keyword + Filter ES query failed: {e}")
        return []


def get_similar_jobs_by_id(job_id: str, k: int = 5):
    res = es.search(
        index=JOBS_INDEX_NAME,
        body={
            "_source": ["vector"],
            "query": {
                "term": {
                    "job_id": job_id
                }
            }
        }
    )
    hits = res["hits"]["hits"]
    if not hits:
        raise ValueError("No job found with given job_id")
    
    target_vector = hits[0]["_source"]["vector"]

    res = es.search(
        index=JOBS_INDEX_NAME,
        body={
            "size": k,
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must_not": [
                                {"term": {"job_id": job_id}}  
                            ]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'vector') + 1.0",
                        "params": {
                            "query_vector": target_vector
                        }
                    }
                }
            }
        }
    )

    job_ids = [hit["_source"]["job_id"] for hit in res["hits"]["hits"]]
    return job_ids