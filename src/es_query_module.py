import layoutparser as lp 
# print(dir(lp))

from vila.pdftools.pdf_extractor import PDFExtractor
from vila.predictors import HierarchicalPDFPredictor
from tqdm import tqdm
import matplotlib.pyplot as plt
import matplotlib.patches as patches

from collections import defaultdict

from src.fetch_RDB_query import fetch_job_data_dict

import os

import boto3

import json
from sentence_transformers import SentenceTransformer
from elasticsearch import Elasticsearch
import numpy as np

from dotenv import load_dotenv

import mysql.connector

import time
import logging
import asyncio
import httpx

logger = logging.getLogger(__name__)

load_dotenv(dotenv_path="./.env")
# load_dotenv(dotenv_path="../../.env")
es_host_ip = os.getenv("ELASTIC_HOST")
RDB_host_ip = os.getenv("DB_HOST_IP")
AWS_ACCESS_KEY_ID=os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=os.getenv("AWS_SECRET_ACCESS_KEY")
REGION=os.getenv("AWS_REGION")
es_username = os.getenv("ELASTIC_USER")        
es_password = os.getenv("ELASTIC_PASSWORD")

ES_HOST = es_host_ip
RDB_HOST = RDB_host_ip
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


async def search_cosine_similar_jobs(query_vector, top_k):
    query = {
        "size": 10000,
        "query": {
            "script_score": {
                "query": {
                    "bool": {
                        "filter": [  # "must" 대신 "filter" 사용하여 불필요한 문서 제거
                            {"exists": {"field": "vector"}}
                        ]
                    }
                },
                "script": {
                    "source": "cosineSimilarity(params.query_vector, 'vector') + 1.0",  # 코사인 유사도 범위: [0, 2]
                    "params": {"query_vector": query_vector}
                }
            }
        }
    }

    # response = es.search(index=JOBS_INDEX_NAME, body=query)
    # return response["hits"]["hits"]
    async with httpx.AsyncClient(auth=(es_username, es_password)) as client:
        response = await client.post(f"{ES_HOST}/{JOBS_INDEX_NAME}/_search", json=query)
        response.raise_for_status() 
        return response.json()["hits"]["hits"]

async def search_bm25_jobs(query_text, top_k):
    query = {
        "size": 10000,
        "query": {
            "match": {
                "text": query_text
            }
        }
    }
    # response = es.search(index=JOBS_INDEX_NAME, body=query)
    # return response["hits"]["hits"]
    async with httpx.AsyncClient(auth=(es_username, es_password)) as client:
        response = await client.post(f"{ES_HOST}/{JOBS_INDEX_NAME}/_search", json=query)
        response.raise_for_status() 
        return response.json()["hits"]["hits"]

def normalize_scores(scores):
    if not scores:
        return []
    min_score, max_score = min(scores), max(scores)
    if min_score == max_score:
        return [50] * len(scores)  
    return [(s - min_score) / (max_score - min_score) * 100 for s in scores]

async def search_combined_jobs(cv_vector, cv_text, top_k, cosine_weight=0.5, bm25_weight=0.5):
    start = time.perf_counter()

    # cosine_results = search_cosine_similar_jobs(cv_vector, top_k)
    # t_cosine = time.perf_counter()
    # logger.debug(f"[Search] Cosine search 완료: {(t_cosine - start)*1000:.2f}ms")

    # bm25_results = search_bm25_jobs(cv_text, top_k)
    # t_bm25 = time.perf_counter()
    # logger.debug(f"[Search] BM25 search 완료: {(t_bm25 - t_cosine)*1000:.2f}ms")

    cosine_task = asyncio.create_task(search_cosine_similar_jobs(cv_vector, top_k))
    bm25_task = asyncio.create_task(search_bm25_jobs(cv_text, top_k))

    cosine_results, bm25_results = await asyncio.gather(cosine_task, bm25_task)

    t_thread = time.perf_counter()
    logger.debug(f"[Search] cosine, bm25 소요 시간: {(t_thread - start) * 1000:.2f}ms")

    cosine_scores = {job['_id']: job['_score'] for job in cosine_results}
    bm25_scores = {job['_id']: job['_score'] for job in bm25_results}

    raw_cosine_score = cosine_scores
    raw_bm25_score = bm25_scores

    normalized_cosine_scores = normalize_scores(list(cosine_scores.values()))
    normalized_bm25_scores = normalize_scores(list(bm25_scores.values()))
    t_normalize = time.perf_counter()
    logger.debug(f"[Search] 정규화 완료: {(t_normalize - t_thread)*1000:.2f}ms")

    cosine_scores = {doc_id: score for doc_id, score in zip(cosine_scores.keys(), normalized_cosine_scores)}
    bm25_scores = {doc_id: score for doc_id, score in zip(bm25_scores.keys(), normalized_bm25_scores)}

    combined_scores = {}
    for doc_id in set(cosine_scores.keys()).union(bm25_scores.keys()):
        combined_scores[doc_id] = (
            (cosine_scores.get(doc_id, 0) * cosine_weight + bm25_scores.get(doc_id, 0) * bm25_weight)
            / (cosine_weight + bm25_weight)
        )
    t_combined = time.perf_counter()
    logger.debug(f"[Search] Combined score 계산 완료: {(t_combined - t_normalize)*1000:.2f}ms")

    top_jobs = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
    top_job_ids = [job_id for job_id, _ in top_jobs]

    mget_response = es.mget(index=JOBS_INDEX_NAME, body={"ids": top_job_ids})
    id_to_job_id_map = {
        doc["_id"]: doc["_source"]["job_id"]
        for doc in mget_response["docs"]
        if doc.get("found")
    }
    t_mget = time.perf_counter()
    logger.debug(f"[Search] mget 완료: {(t_mget - t_combined)*1000:.2f}ms")

    result = [
        (
            job_id,
            score,
            cosine_scores.get(job_id, 0),
            bm25_scores.get(job_id, 0),
            raw_cosine_score.get(job_id, 0),
            raw_bm25_score.get(job_id, 0),
            id_to_job_id_map.get(job_id)
        )
        for job_id, score in top_jobs
        if job_id in id_to_job_id_map
    ]
    t_end = time.perf_counter()
    logger.debug(f"[Search] 전체 수행 시간: {(t_end - start)*1000:.2f}ms")

    return result

async def recommandation(cv_id, top_k=10):
    start = time.time()

    # [1] Elasticsearch에서 CV 벡터 및 텍스트 가져오기
    t0 = time.time()
    query = {
        "query": {
            "match": {
                "cv_id": cv_id
            }
        }
    }

    response = es.search(index=CV_INDEX_NAME, body=query)

    if not response["hits"]["hits"]:
        logger.debug("[Recommend] No CV found for user_id=%s", cv_id)
        return []

    cv_vector = response["hits"]["hits"][0]["_source"]["vector"]
    cv_text = response["hits"]["hits"][0]["_source"]["text"]
    logger.debug("[Recommend] CV 검색 완료: %.2fms", (time.time() - t0) * 1000)

    # [2] 추천 검색
    t1 = time.time()
    recommended_jobs = await search_combined_jobs(cv_vector, cv_text, top_k)
    logger.debug("[Recommend] search_combined_jobs 완료: %.2fms", (time.time() - t1) * 1000)

    # [4] 결과 조립
    t3 = time.time()
    results = []
    for es_id, combined_score, cosine_score, bm25_score, raw_cosine_score, raw_bm25_score, db_job_id in recommended_jobs:
        # job_info = job_dict.get(db_job_id)
        # if not job_info:
        #     continue

        result = {
            "job_id": db_job_id,
            "combined_score": round(combined_score, 4),
            "cosine_score": round(cosine_score, 4),
            "bm25_score": round(bm25_score, 4),
            "raw_cosine_score": round(raw_cosine_score, 4),
            "raw_bm25_score": round(raw_bm25_score, 4),
        }
        results.append(result)
    logger.debug("[Recommend] 결과 조립 완료: %.2fms", (time.time() - t3) * 1000)

    logger.debug("[Recommend] recommandation 전체 수행 시간: %.2fms", (time.time() - start) * 1000)
    return results