import requests
import json

ELASTICSEARCH_URL = "http://localhost:9200"
CV_INDEX = "cv_data"
JOB_INDEX = "job_postings"

def create_index(index_name):
    """
    Elasticsearch에 인덱스를 생성하는 함수
    """
    index_settings = {
        "settings": {
            "number_of_shards": 3,
            "number_of_replicas": 1
        }
    }
    response = requests.put(f"{ELASTICSEARCH_URL}/{index_name}", json=index_settings)
    return response.json()

def index_cv(cv_id, cv_text):
    """
    CV 데이터를 Elasticsearch에 저장하는 함수
    """
    doc = {"id": cv_id, "content": cv_text}
    response = requests.post(f"{ELASTICSEARCH_URL}/{CV_INDEX}/_doc/{cv_id}", json=doc)
    return response.json()

def index_job(job_id, title, description):
    """
    직무 공고 데이터를 Elasticsearch에 저장하는 함수
    """
    doc = {"id": job_id, "title": title, "description": description}
    response = requests.post(f"{ELASTICSEARCH_URL}/{JOB_INDEX}/_doc/{job_id}", json=doc)
    return response.json()

def search_cv(query):
    """
    CV 데이터에서 특정 키워드를 검색하는 함수
    """
    query_body = {"query": {"match": {"content": query}}}
    response = requests.get(f"{ELASTICSEARCH_URL}/{CV_INDEX}/_search", json=query_body)
    return response.json()

def search_jobs(query):
    """
    직무 공고 데이터에서 특정 키워드를 검색하는 함수
    """
    query_body = {"query": {"match": {"description": query}}}
    response = requests.get(f"{ELASTICSEARCH_URL}/{JOB_INDEX}/_search", json=query_body)
    return response.json()
