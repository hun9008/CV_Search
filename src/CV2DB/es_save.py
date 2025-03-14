import os
import json
from sentence_transformers import SentenceTransformer
from elasticsearch import Elasticsearch
import numpy as np

from sqlQuery import fetch_job_data

CV_DATA_DIR = "../../data/cv"
JOBS_DATA_DIR = "../../data/naver" 
ES_HOST = "http://127.0.0.1:9200"
CV_INDEX_NAME = "cv_index"
JOBS_INDEX_NAME = "job_index"  

es = Elasticsearch(ES_HOST)

print(es.info())

# print(es.indices.exists(index=CV_INDEX_NAME))
# print(es.indices.exists(index=JOBS_INDEX_NAME))

# es.indices.create(index=CV_INDEX_NAME, ignore=400)
# es.indices.create(index=JOBS_INDEX_NAME, ignore=400)

# print(es.indices.exists(index=CV_INDEX_NAME))
# print(es.indices.exists(index=JOBS_INDEX_NAME))

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def split_sentences(text, max_length=256):

    sentences = text.split(". ")  
    sentences = [sent.strip() for sent in sentences if len(sent) > 3] 
    return sentences

def encode_long_text(text):

    sentences = split_sentences(text)
    
    if not sentences:  
        return np.zeros(384).tolist()
    
    sentence_vectors = model.encode(sentences)  
    avg_vector = np.mean(sentence_vectors, axis=0)  
    return avg_vector.tolist()

def process_and_store_documents(DATA_DIR, INDEX_NAME):

    texts = []
    vectors = []

    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".txt"):
            file_path = os.path.join(DATA_DIR, filename)
            
            with open(file_path, "r", encoding="utf-8") as file:
                text = file.read().strip()
                texts.append(text)
            
            print(f"Processing {filename}: {len(text)} characters")

            vector = encode_long_text(text)
            vectors.append(vector)

    all_equal = all(v == vectors[0] for v in vectors)
    print("All vectors are the same:", all_equal)
    
    if all_equal:
        for i, vector in enumerate(vectors):
            print(f"Vector {i} first 3 values: {vector[:3]}")
    
    for filename, text, vector in zip(os.listdir(DATA_DIR), texts, vectors):
        doc = {
            "text": text,
            "vector": vector
        }

        response = es.index(index=INDEX_NAME, body=doc)
        print(f"{filename} Saved. Document ID: {response['_id']}")

def process_and_store_jobs(INDEX_NAME):
    texts = []
    vectors = []

    jobs = fetch_job_data()

    for job in jobs:
        texts.append(job)
        print(f"Processing job: {len(job)} characters")

        vector = encode_long_text(job)
        vectors.append(vector)

    all_equal = all(v == vectors[0] for v in vectors)
    print("All vectors are the same:", all_equal)
    
    if all_equal:
        for i, vector in enumerate(vectors):
            print(f"Vector {i} first 3 values: {vector[:3]}")
    
    for text, vector in zip(texts, vectors):
        doc = {
            "text": text,
            "vector": vector
        }

        response = es.index(index=INDEX_NAME, body=doc)
        print(f"Saved. Document ID: {response['_id']}")

def create_index(INDEX_NAME):
    if es.indices.exists(index=INDEX_NAME):
        es.indices.delete(index=INDEX_NAME)
        print(f"기존 인덱스 `{INDEX_NAME}` 삭제 완료")

    index_settings = {
        "mappings": {
            "properties": {
                "vector": {
                    "type": "dense_vector",
                    "dims": 384,  # MiniLM 모델의 차원
                    "index": True,
                    "similarity": "cosine"
                },
                "text": {
                    "type": "text"
                }
            }
        }
    }
    
    es.indices.create(index=INDEX_NAME, body=index_settings)
    print(f"새로운 인덱스 `{INDEX_NAME}` 생성 완료")

def valid_check(INDEX_NAME):
    query = {
        "size": 10,
        "_source": ["vector"]
    }
    response = es.search(index=INDEX_NAME, body=query)

    vectors = [hit['_source']['vector'] for hit in response['hits']['hits']]
    all_equal = all(v == vectors[0] for v in vectors)

    print("[valid check] All vectors are the same:", all_equal)       

if __name__ == "__main__":
    create_index(CV_INDEX_NAME)
    create_index(JOBS_INDEX_NAME)
    process_and_store_documents(CV_DATA_DIR, CV_INDEX_NAME)
    # process_and_store_documents(JOBS_DATA_DIR, JOBS_INDEX_NAME)
    process_and_store_jobs(JOBS_INDEX_NAME)
    valid_check(CV_INDEX_NAME)
    valid_check(JOBS_INDEX_NAME)