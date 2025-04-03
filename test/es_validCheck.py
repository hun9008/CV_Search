import os
import json
from sentence_transformers import SentenceTransformer
from elasticsearch import Elasticsearch
import numpy as np

from dotenv import load_dotenv

load_dotenv(dotenv_path="../../.env")
host_ip = os.getenv("ELASTIC_HOST")

CV_DATA_DIR = "../../data/cv"
JOBS_DATA_DIR = "../../data/naver" 
ES_HOST = host_ip
CV_INDEX_NAME = "cv_index"
JOBS_INDEX_NAME = "job_index"  

es = Elasticsearch(ES_HOST)

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

text_samples = [
    "네이버에서 AI 연구를 하고 있습니다.",
    "백엔드 개발자를 모집하고 있습니다.",
    "이것은 테스트 문장입니다."
]

vectors = model.encode(text_samples).tolist()

for i, vec in enumerate(vectors):
    print(f"Sample {i+1} first 3 values: {vec[:3]}")

def process_and_store_documents(DATA_DIR):
    
    vectors = []

    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".txt"):
            file_path = os.path.join(DATA_DIR, filename)
            
            with open(file_path, "r", encoding="utf-8") as file:
                text = file.read().strip()
            
            print(f"Processing {filename}: {len(text)} characters")

            vector = encode_long_text(text)
            vectors.append(vector)

    for i, vec in enumerate(vectors):
        print(f"Sample {i+1} first 3 values: {vec[:3]}")

process_and_store_documents(CV_DATA_DIR)
process_and_store_documents(JOBS_DATA_DIR)