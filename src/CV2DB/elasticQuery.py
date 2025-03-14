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

def get_cv_list(size=5):
    """
    여러 개의 CV 벡터와 텍스트를 가져오는 함수
    """
    query = {
        "size": size,
        "_source": ["vector", "text"]  
    }
    response = es.search(index=CV_INDEX_NAME, body=query)
    
    if not response["hits"]["hits"]:  # 데이터가 없을 경우 예외 처리
        print("cv_index에 데이터가 없습니다.")
        return [], []
    
    vectors = [hit["_source"]["vector"] for hit in response["hits"]["hits"]]
    texts = [hit["_source"]["text"] for hit in response["hits"]["hits"]]
    return vectors, texts

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

def normalize_scores(scores):
    if not scores:
        return []
    min_score, max_score = min(scores), max(scores)
    if min_score == max_score:
        return [50] * len(scores)  
    return [(s - min_score) / (max_score - min_score) * 100 for s in scores]

def search_combined_jobs(cv_vector, cv_text, top_k=3, cosine_weight=0.5, bm25_weight=0.5):

    cosine_results = search_cosine_similar_jobs(cv_vector, top_k=10)  
    bm25_results = search_bm25_jobs(cv_text, top_k=10)

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


if __name__ == "__main__":
    # cv_vector, cv_text = get_cv()

    # print("CV Text:", cv_text[:20])

    cv_vectors, cv_texts = get_cv_list(2)

    print("CV Text:", cv_texts[0][:20])
    print("CV Text:", cv_texts[1][:20])

    cv_vector = cv_vectors[1]
    cv_text = cv_texts[1]
    
    if cv_vector:
        
        combine_jobs = search_combined_jobs(cv_vector, cv_text, top_k=10, cosine_weight=0.5, bm25_weight=0.5)

        print("Combined Similar 10 Job Posting:")
        for job in combine_jobs:
                job_id, combined_score, cosine_score, bm25_score = job
                src = es.get(index=JOBS_INDEX_NAME, id=job_id)["_source"]
                company_name = src["text"].split('\n')[0].split(': ')[1].strip('"')
                department = src["text"].split('\n')[1].split(': ')[1].strip('"')

                print(f"[{company_name}] {department} | Combined Score: {combined_score:.2f} | Cosine: {cosine_score:.2f} | BM25: {bm25_score:.2f}\n")

        # cosine_similar_jobs = search_cosine_similar_jobs(cv_vector, top_k=3)

        # print("Cosine Similar 10 Job Posting:")
        # for job in cosine_similar_jobs:
        #     print(f"Job ID: {job['_id']}, Score: {job['_score']}")
        #     text = job['_source']['text']
        #     lines = text.split('\n')
        #     for line in lines:
        #         if line.startswith('[') and len(line) < 100:
        #             print(f"Text: {line}\n")

        # print("\n ----------------- \n")

        # l2_norm_jobs = search_l2_norm_jobs(cv_vector, top_k=3)

        # print("L2 Norm Similar 10 Job Posting:")

        # for job in l2_norm_jobs:
        #     print(f"Job ID: {job['_id']}, Score: {job['_score']}")
        #     text = job['_source']['text']
        #     lines = text.split('\n')
        #     for line in lines:
        #         if line.startswith('[') and len(line) < 100:
        #             print(f"Text: {line}\n")

        # print("\n ----------------- \n")

        # bm25_jobs = search_bm25_jobs(cv_text, top_k=3)

        # print("BM25 Similar 10 Job Posting:")

        # for job in bm25_jobs:
        #     print(f"Job ID: {job['_id']}, Score: {job['_score']}")
        #     text = job['_source']['text']
        #     lines = text.split('\n')
        #     for line in lines:
        #         if line.startswith('[') and len(line) < 100:
        #             print(f"Text: {line}\n")
        
    else:
        print("Error.")