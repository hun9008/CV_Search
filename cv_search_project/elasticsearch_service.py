import requests
import json

ELASTICSEARCH_URL = "http://localhost:9200"
CV_INDEX = "cv_data"
JOB_INDEX = "job_postings"

def create_index(index_name, mappings=None):
    """
    Elasticsearch에 인덱스를 생성하는 함수
    """
    index_settings = {
        "settings": {
            "number_of_shards": 3,
            "number_of_replicas": 1
        },
        "mappings": mappings if mappings else {}
    }
    response = requests.put(f"{ELASTICSEARCH_URL}/{index_name}", json=index_settings)
    return response.json()

def save_cv_to_elasticsearch(cv_id, cv_text):
    """
    PDF CV 데이터를 Elasticsearch에 저장하는 함수
    """
    doc = {"id": cv_id, "content": cv_text}
    response = requests.post(f"{ELASTICSEARCH_URL}/{CV_INDEX}/_doc/{cv_id}", json=doc)
    return response.json()

def save_job_posting(job_data):
    """
    크롤링된 채용 공고 데이터를 Elasticsearch에 저장하는 함수
    """
    response = requests.post(f"{ELASTICSEARCH_URL}/{JOB_INDEX}/_doc/", json=job_data)
    return response.json()

def search_jobs(query):
    """
    직무 공고 데이터에서 특정 키워드를 검색하는 함수
    """
    query_body = {"query": {"match": {"description": query}}}
    response = requests.get(f"{ELASTICSEARCH_URL}/{JOB_INDEX}/_search", json=query_body)
    return response.json()
