import layoutparser as lp 
# print(dir(lp))

from vila.pdftools.pdf_extractor import PDFExtractor
from vila.predictors import HierarchicalPDFPredictor
from tqdm import tqdm
import matplotlib.pyplot as plt
import matplotlib.patches as patches

from collections import defaultdict

from src.fetch_RDB_query import fetch_cv_data

import os

import boto3

import json
from sentence_transformers import SentenceTransformer
from elasticsearch import Elasticsearch
import numpy as np

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
CV_INDEX_NAME = "cv_index"
JOBS_INDEX_NAME = "job_index"  

# print("ES_HOST:", ES_HOST)
# print("RDB_HOST:", RDB_HOST)

es = Elasticsearch(ES_HOST)

print(es.info())


def search_cosine_similar_jobs(query_vector, top_k):
    query = {
        "size": top_k,
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

    response = es.search(index=JOBS_INDEX_NAME, body=query)
    return response["hits"]["hits"]

def search_l2_norm_jobs(query_vector, top_k):
    query = {
        "size": top_k,
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
                    "source": "1 / (1 + l2norm(params.query_vector, 'vector'))",  # L2 Norm 거리 범위: [0, 1]
                    "params": {"query_vector": query_vector}
                }
            }
        }
    }

    response = es.search(index=JOBS_INDEX_NAME, body=query)
    return response["hits"]["hits"]

def search_bm25_jobs(query_text, top_k):
    query = {
        "size": top_k,
        "query": {
            "match": {
                "text": query_text
            }
        }
    }
    response = es.search(index=JOBS_INDEX_NAME, body=query)
    return response["hits"]["hits"]

def normalize_scores(scores):
    if not scores:
        return []
    min_score, max_score = min(scores), max(scores)
    if min_score == max_score:
        return [50] * len(scores)  
    return [(s - min_score) / (max_score - min_score) * 100 for s in scores]

def search_combined_jobs(cv_vector, cv_text, top_k, cosine_weight=0.5, bm25_weight=0.5):

    cosine_results = search_cosine_similar_jobs(cv_vector, top_k)  
    bm25_results = search_bm25_jobs(cv_text, top_k)

    cosine_scores = {job['_id']: job['_score'] for job in cosine_results}
    bm25_scores = {job['_id']: job['_score'] for job in bm25_results}
    
    normalized_cosine_scores = normalize_scores(list(cosine_scores.values()))
    normalized_bm25_scores = normalize_scores(list(bm25_scores.values()))
    
    cosine_scores = {doc_id: score for doc_id, score in zip(cosine_scores.keys(), normalized_cosine_scores)}
    bm25_scores = {doc_id: score for doc_id, score in zip(bm25_scores.keys(), normalized_bm25_scores)}
    
    combined_scores = {}
    for doc_id in set(cosine_scores.keys()).union(bm25_scores.keys()):
        combined_scores[doc_id] = (cosine_scores.get(doc_id, 0) * cosine_weight + bm25_scores.get(doc_id, 0) * bm25_weight) / (cosine_weight + bm25_weight)
    
    top_jobs = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
    
    return [(job_id, score, cosine_scores.get(job_id, 0), bm25_scores.get(job_id, 0)) for job_id, score in top_jobs]

def recommandation(u_id, top_k=10):
    
    # u_id에 해당하는 cv_vector와 cv_text를 elasticsearch에서 가져옴.
    query = {
        "query": {
            "match": {
                "u_id": u_id
            }
        }
    }
    response = es.search(index=CV_INDEX_NAME, body=query)
    if not response["hits"]["hits"]:
        print("No CV found for the given u_id.")
        return []
    cv_vector = response["hits"]["hits"][0]["_source"]["vector"]
    cv_text = response["hits"]["hits"][0]["_source"]["text"]
    print("CV Text:", cv_text[:20])
    print("CV Vector:", cv_vector[:20])

    # cv_vector와 cv_text를 이용하여 job을 추천함.
    recommended_jobs = search_combined_jobs(cv_vector, cv_text, top_k)
    
    for job in recommended_jobs:
        job_id, combined_score, cosine_score, bm25_score = job
        src = es.get(index=JOBS_INDEX_NAME, id=job_id)
        text = src["_source"]["text"]
        lines = text.split('\n')
        company_name = lines[0].split(': ')[1].strip('"') if len(lines) > 0 else "Unknown"
        department = lines[1].split(': ')[1].strip('"') if len(lines) > 1 else "Unknown"

        print(f"[{company_name}] {department} | Combined Score: {combined_score:.2f} | Cosine: {cosine_score:.2f} | BM25: {bm25_score:.2f}\n")
        
    return recommended_jobs