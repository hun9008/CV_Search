import layoutparser as lp 
# print(dir(lp))

from vila.pdftools.pdf_extractor import PDFExtractor
from vila.predictors import HierarchicalPDFPredictor
from tqdm import tqdm
import matplotlib.pyplot as plt
import matplotlib.patches as patches

from src.fetch_RDB_query import fetch_job_data, fetch_cv_save_data

from collections import defaultdict

import os

import boto3

import json
from sentence_transformers import SentenceTransformer
from elasticsearch import Elasticsearch
import numpy as np

from dotenv import load_dotenv

import mysql.connector
from datetime import datetime
from urllib.parse import urlparse, unquote

from datetime import datetime, timedelta, timezone
import hashlib

KST = timezone(timedelta(hours=9))

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
    }
)

print(es.info())

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def vila_predict(pdf_path, pdf_extractor, vision_model, layout_model):
    print(f"[DEBUG] Loading tokens and images from: {pdf_path}")
    page_tokens, page_images = pdf_extractor.load_tokens_and_image(pdf_path)
    print(f"[DEBUG] Total pages loaded: {len(page_tokens)}")

    pred_tokens = []
    for i, (page_token, page_image) in enumerate(tqdm(zip(page_tokens, page_images), total=len(page_tokens), desc="Processing Pages", unit="page")):
        print(f"[DEBUG] Processing page {i + 1}/{len(page_tokens)}")

        # Layout Detection
        blocks = vision_model.detect(page_image)
        print(f"[DEBUG] Detected {len(blocks)} layout blocks on page {i + 1}")

        page_token.annotate(blocks=blocks)

        # Convert to prediction input
        pdf_data = page_token.to_pagedata().to_dict()
        print(f"[DEBUG] PDF data keys for page {i + 1}: {pdf_data}")
        if pdf_data is None:
            print(f"[DEBUG] No PDF data found for page {i + 1}")
            continue

        # Prediction
        predicted = layout_model.predict(pdf_data, page_token.page_size)
        print(f"[DEBUG] Predicted {len(predicted)} tokens on page {i + 1}")

        pred_tokens += predicted

    print(f"[DEBUG] Total predicted tokens: {len(pred_tokens)}")
    return pred_tokens

def construct_token_groups(pred_tokens):
    groups, group, group_type, prev_bbox = [], [], None, None
    
    for token in pred_tokens:
        if group_type is None:
            is_continued = True
            
        elif token.type == group_type:
            if group_type == 'section':
                is_continued = abs(prev_bbox[3] - token.coordinates[3]) < 1.
            else:
                is_continued = True

        else:
            is_continued = False

        
        # print(token.text, token.type, is_continued)
        group_type = token.type
        prev_bbox = token.coordinates
        if is_continued:
            group.append(token)
        
        else:
            groups.append(group)
            group = [token]
    
    if group:
        groups.append(group)

    return groups

def join_group_text(group):
    text = ''
    prev_bbox = None
    for token in group:
        if not text:
            text += token.text
    
        else:        
            if abs(prev_bbox[2] - token.coordinates[0]) > 2:
                text += ' ' + token.text
    
            else:
                text += token.text
    
        prev_bbox = token.coordinates
    return text

def construct_section_groups(token_groups):
    section_groups = defaultdict(list)

    section = None
    for group in token_groups:
        group_type = group[0].type
        group_text = join_group_text(group)
        
        if group_type == 'section':
            section = group_text
            section_groups[section]
    
        elif group_type == 'paragraph' and section is not None:
            section_groups[section].append(group_text)

    section_groups = {k: ' '.join(v) for k,v in section_groups.items()}
    return section_groups

class MergedTextBlock:
    def __init__(self, text, type, coordinates):
        self.text = text
        self.type = type
        self.coordinates = coordinates

def merge_tokens_to_sentences(pred_tokens):
    sentences = []
    sentence = []
    prev_bbox = None
    
    for token in pred_tokens:
        token_text = token.text
        token_type = token.type
        token_coordinates = token.coordinates

        if not sentence:
            sentence.append(token)
        else:
            if prev_bbox and abs(prev_bbox[2] - token_coordinates[0]) > 10:
                sentences.append(sentence)
                sentence = [token]
            else:
                sentence.append(token)

        prev_bbox = token_coordinates
    
    if sentence:
        sentences.append(sentence)

    return [MergedTextBlock(
                text=" ".join([t.text for t in sentence]), 
                type=sentence[0].type, 
                coordinates=sentence[0].coordinates) 
            for sentence in sentences]

def visualize_predictions(pdf_path, pdf_extractor, vision_model, layout_model):
    page_tokens, page_images = pdf_extractor.load_tokens_and_image(pdf_path)
    pred_tokens = vila_predict(pdf_path, pdf_extractor, vision_model, layout_model)

    for idx, (page_image, page_token) in enumerate(zip(page_images, page_tokens)):
        fig, ax = plt.subplots(1, figsize=(10, 14))
        ax.imshow(page_image) 
        
  
        for token in pred_tokens:
            if token.block:
                rect = patches.Rectangle(
                    (token.block.x_1, token.block.y_1),  
                    token.block.x_2 - token.block.x_1, 
                    token.block.y_2 - token.block.y_1, 
                    linewidth=1.5, edgecolor='red', facecolor='none'
                )
                ax.add_patch(rect)
        
        plt.title(f'Page {idx + 1}')
        plt.axis('off')
        plt.show()

def save_text(pred_tokens, txt_path):
    with open(txt_path, 'w', encoding='utf-8') as f:
        for token in pred_tokens:
            if token.text:
                f.write(token.text + '\n')
    print(f'Text saved to {txt_path}')


# pdf_path = os.path.join(data_path, 'cv_kr_example.pdf')
# txt_path = os.path.join(data_path, 'cv_kr_example_vila.txt')

def load_vila_models():
    pdf_extractor = PDFExtractor(pdf_extractor_name="pdfplumber")
    print("pdf_extractor loaded")
    vision_model = lp.EfficientDetLayoutModel("lp://PubLayNet")
    print("vision_model loaded")
    pdf_predictor = HierarchicalPDFPredictor.from_pretrained("allenai/hvila-block-layoutlm-finetuned-docbank")
    print("pdf_predictor loaded")

    return pdf_extractor, vision_model, pdf_predictor


# print("====== ViLA Prediction ======")

def download_pdf_from_s3(s3_url, local_path):
    s3 = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=REGION
    )

    if s3_url.startswith("https://"):
        parts = s3_url.replace("https://", "").split("/", 1)
        domain = parts[0]  
        key = unquote(parts[1])
        bucket = domain.split('.')[0] 

    elif s3_url.startswith("s3://"):
        s3_url = s3_url[5:]
        bucket, *key_parts = s3_url.split('/')
        key = unquote('/'.join(key_parts))

    else:
        raise ValueError("지원되지 않는 S3 URL 형식입니다.")

    print(f"Bucket : {bucket}", f"Key : {key}")
    s3.download_file(bucket, key, local_path)
    print(f"Downloaded {s3_url} to {local_path}")

def extract_cv_info(pdf_path):
    pdf_extractor, vision_model, pdf_predictor = load_vila_models()

    pred_tokens = vila_predict(pdf_path, pdf_extractor, vision_model, pdf_predictor)
    print("ViLA prediction completed")
    merge_tokens = merge_tokens_to_sentences(pred_tokens)
    print("Token merging completed")

    return merge_tokens

def run_vila(s3_url):

    local_pdf_path = "/tmp/temp_cv.pdf"  
    local_txt_path = "/tmp/temp_cv.txt"

    download_pdf_from_s3(s3_url, local_pdf_path)

    pdf_path = local_pdf_path

    merge_tokens = extract_cv_info(pdf_path)

    save_text(merge_tokens, local_txt_path)

############## ^ ViLA Part ############## ES Part v ##############

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


def es_save_cv(s3_url, u_id):

    if not es.indices.exists(index=CV_INDEX_NAME):
        es.indices.create(
            index=CV_INDEX_NAME,
            body={
                "mappings": {
                    "properties": {
                        "text": {"type": "text"},
                        "text_hash": {"type": "keyword"},
                        "vector": {"type": "dense_vector", "dims": 384},
                        "u_id": {"type": "keyword"},
                        "created_at": {"type": "date"} 
                    }
                }
            }
        )

    run_vila(s3_url)

    raw_text = open("/tmp/temp_cv.txt", "r", encoding="utf-8").read()
    vector = encode_long_text(raw_text)

    text_hash = hashlib.sha256(raw_text.encode('utf-8')).hexdigest()

    doc = {
        "text": raw_text,
        "text_hash": text_hash,
        "vector": vector,
        "u_id": u_id,
        "created_at": datetime.now(KST).isoformat()
    }

    # doc
    print(f"Document to be indexed: {doc}")

    try:
        # 정확한 term match를 위해 .keyword 사용 (u_id가 keyword 매핑되었다면 생략 가능)
        query = {
            "query": {
                "term": {
                    "u_id.keyword": u_id
                }
            }
        }

        same_user_result = es.get(index=CV_INDEX_NAME, id=str(u_id), ignore=[404])

        if same_user_result.get("found"):
            # 이미 저장된 문서가 있을 경우
            existing_hash = same_user_result["_source"].get("text_hash")

            if existing_hash == text_hash:
                print(f"[SKIP] u_id={u_id} 동일한 text_hash 존재 → ES 저장 생략")
            else:
                # 해시가 다르면 덮어쓰기
                response = es.index(index=CV_INDEX_NAME, id=str(u_id), body=doc)
                print(f"[UPDATE] u_id={u_id} CV Updated in ES. Document ID: {response['_id']}")
        else:
            # 문서가 없을 경우 신규 저장
            response = es.index(index=CV_INDEX_NAME, id=str(u_id), body=doc)
            print(f"[NEW] u_id={u_id} CV Saved in ES. Document ID: {response['_id']}")

    except Exception as e:
        print(f"[X] Elasticsearch 저장 실패: {e}")
        raise

    try:
        fetch_cv_save_data(s3_url, u_id, raw_text)
        print(f"[✓] CV RDB 저장 완료: user_id={u_id}")
    except mysql.connector.Error as err:
        print(f"[X] MySQL 오류: {err}")
    except Exception as e:
        print(f"[X] 오류 발생: {e}")

####################### ^ save cv function #######################

def es_save_jobs():
    
    if not es.indices.exists(index=JOBS_INDEX_NAME):
        es.indices.create(
            index=JOBS_INDEX_NAME,
            body={
                "mappings": {
                    "properties": {
                        "text": {"type": "text"},
                        "text_hash": {"type": "keyword"},
                        "vector": {"type": "dense_vector", "dims": 384},
                        "job_id": {"type": "keyword"},
                        "created_at": {"type": "date"} 
                    }
                }
            }
        )
        
    jobs, job_ids = fetch_job_data()

    print(f"[DEBUG] jobs: {len(jobs)}")
    print(f"[DEBUG] job_ids: {len(job_ids)}")

    # jobs가 비어있을 경우 예외처리
    if not jobs:
        print("No jobs found.")
        return

    try:
        for job_text, job_id in tqdm(zip(jobs, job_ids), total=len(jobs), desc="Indexing jobs to ES"):
            text_hash = hashlib.sha256(job_text.encode('utf-8')).hexdigest()

            query = {
                "query": {
                    "term": {
                        "job_id": str(job_id)
                    }
                }
            }

            same_job_result = es.get(index=JOBS_INDEX_NAME, id=str(job_id), ignore=[404])

            if same_job_result.get("found"):
                # 이미 저장된 문서가 있을 경우
                existing_hash = same_job_result["_source"].get("text_hash")

                if existing_hash == text_hash:
                    # print(f"[SKIP] job  _id={job_id} 동일한 text_hash 존재 → ES 저장 생략")
                    continue
                else:
                    # 해시가 다르면 덮어쓰기
                    response = es.index(index=JOBS_INDEX_NAME, id=str(job_id), body=doc)
                    print(f"[UPDATE] job_id={job_id} Job Updated in ES. Document ID: {response['_id']}")
                    continue
            else:
                # 문서가 없을 경우 신규 저장
                # print(f"Processing job_id={job_id}, {len(job_text)} characters")
                vector = encode_long_text(job_text)

                doc = {
                    "text": job_text,
                    "text_hash": text_hash,
                    "vector": vector,
                    "job_id": str(job_id),
                    "created_at": datetime.now(KST).isoformat()
                }

                response = es.index(index=JOBS_INDEX_NAME, id=str(job_id), body=doc)
                print(f"[NEW] job_id={job_id} Job Saved in ES. Document ID: {response['_id']}")
    except Exception as e:
        print(f"[X] Elasticsearch 저장 실패: {e}")
        raise

# es_save_cv("https://goodjobucket.s3.ap-northeast-2.amazonaws.com/cv/cv_example.pdf", 1)
# es_save_jobs(1)