import os
import json
from sentence_transformers import SentenceTransformer
from elasticsearch import Elasticsearch

CV_DATA_DIR = "../../data/cv"
JOBS_DATA_DIR = "../../data/naver" 
ES_HOST = "http://127.0.0.1:9200"
CV_INDEX_NAME = "cv_index"
JOBS_INDEX_NAME = "job_index"  

es = Elasticsearch(ES_HOST)

print(es.info())

def get_cv():
    query = {
        "size": 1,
        "_source": ["vector", "text"]  
    }
    response = es.search(index=CV_INDEX_NAME, body=query)
    
    if not response["hits"]["hits"]:  # 데이터가 없을 경우 예외 처리
        print("cv_index에 데이터가 없습니다.")
        return None, None
    
    vector = response["hits"]["hits"][0]["_source"]["vector"]
    text = response["hits"]["hits"][0]["_source"]["text"] 
    return vector, text

def search_cosine_similar_jobs(query_vector, top_k=3):
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

def search_l2_norm_jobs(query_vector, top_k=3):
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

def search_bm25_jobs(query_text, top_k=3):
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


if __name__ == "__main__":
    cv_vector, cv_text = get_cv()

    print("CV Text:", cv_text[:20])
    
    if cv_vector:
        cosine_similar_jobs = search_cosine_similar_jobs(cv_vector, top_k=3)

        print("Cosine Similar 10 Job Posting:")
        for job in cosine_similar_jobs:
            print(f"Job ID: {job['_id']}, Score: {job['_score']}")
            text = job['_source']['text']
            lines = text.split('\n')
            for line in lines:
                if line.startswith('[') and len(line) < 100:
                    print(f"Text: {line}\n")

        print("\n ----------------- \n")

        l2_norm_jobs = search_l2_norm_jobs(cv_vector, top_k=3)

        print("L2 Norm Similar 10 Job Posting:")

        for job in l2_norm_jobs:
            print(f"Job ID: {job['_id']}, Score: {job['_score']}")
            text = job['_source']['text']
            lines = text.split('\n')
            for line in lines:
                if line.startswith('[') and len(line) < 100:
                    print(f"Text: {line}\n")

        print("\n ----------------- \n")

        bm25_jobs = search_bm25_jobs(cv_text, top_k=3)

        print("BM25 Similar 10 Job Posting:")

        for job in bm25_jobs:
            print(f"Job ID: {job['_id']}, Score: {job['_score']}")
            text = job['_source']['text']
            lines = text.split('\n')
            for line in lines:
                if line.startswith('[') and len(line) < 100:
                    print(f"Text: {line}\n")
        
    else:
        print("Error.")