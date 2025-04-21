import layoutparser as lp 
# print(dir(lp))

from vila.pdftools.pdf_extractor import PDFExtractor
from vila.predictors import HierarchicalPDFPredictor
from tqdm import tqdm
import matplotlib.pyplot as plt
import matplotlib.patches as patches

from src.fetch_RDB_query import fetch_job_data

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
from urllib.parse import urlparse

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

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def vila_predict(pdf_path, pdf_extractor, vision_model, layout_model):
    page_tokens, page_images = pdf_extractor.load_tokens_and_image(pdf_path)

    pred_tokens = []
    for page_token, page_image in tqdm(zip(page_tokens, page_images), total=len(page_tokens), desc="Processing Pages", unit="page"):
        blocks = vision_model.detect(page_image)
        page_token.annotate(blocks=blocks)
        pdf_data = page_token.to_pagedata().to_dict()
        pred_tokens += layout_model.predict(pdf_data, page_token.page_size)

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
    vision_model = lp.EfficientDetLayoutModel("lp://PubLayNet")
    pdf_predictor = HierarchicalPDFPredictor.from_pretrained("allenai/hvila-block-layoutlm-finetuned-docbank")

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
        key = parts[1]    
        bucket = domain.split('.')[0] 

    elif s3_url.startswith("s3://"):
        s3_url = s3_url[5:]
        bucket, *key_parts = s3_url.split('/')
        key = '/'.join(key_parts)

    else:
        raise ValueError("지원되지 않는 S3 URL 형식입니다.")

    print(f"Bucket : {bucket}", f"Key : {key}")
    s3.download_file(bucket, key, local_path)
    print(f"Downloaded {s3_url} to {local_path}")

def extract_cv_info(pdf_path):
    pdf_extractor, vision_model, pdf_predictor = load_vila_models()

    pred_tokens = vila_predict(pdf_path, pdf_extractor, vision_model, pdf_predictor)

    merge_tokens = merge_tokens_to_sentences(pred_tokens)

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

def rdb_save_cv(s3_url, user_id):
    with open("/tmp/temp_cv.txt", "r", encoding="utf-8") as f:
        raw_text = f.read()

    path = urlparse(s3_url).path 
    file_name = os.path.basename(path)  

    db_config = {
        "host": RDB_HOST,
        "port": 3306,
        "user": "user",
        "password": "ajoucapstone",
        "database": "goodjob"
    }

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        query = """
        INSERT INTO cv (user_id, file_name, file_url, raw_text, uploaded_at, last_updated)
        VALUES (%s, %s, %s, %s, %s, %s)
        """

        now = datetime.now()
        values = (user_id, file_name, s3_url, raw_text, now, now)

        cursor.execute(query, values)
        conn.commit()
        print(f"[✓] CV 저장 완료: user_id={user_id}, file_name={file_name}")

    except mysql.connector.Error as err:
        print(f"[X] MySQL 오류: {err}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def es_save_cv(s3_url, u_id):

    if not es.indices.exists(index=CV_INDEX_NAME):
        es.indices.create(
            index=CV_INDEX_NAME,
            body={
                "mappings": {
                    "properties": {
                        "text": {"type": "text"},
                        "vector": {"type": "dense_vector", "dims": 384},
                        "u_id": {"type": "keyword"}
                    }
                }
            }
        )

    run_vila(s3_url)

    raw_text = open("/tmp/temp_cv.txt", "r", encoding="utf-8").read()
    vector = encode_long_text(raw_text)

    doc = {
        "text": raw_text,
        "vector": vector,
        "u_id": u_id,
    }

    response = es.index(index=CV_INDEX_NAME, body=doc)
    print(f"{u_id} CV Saved. Document ID: {response['_id']}")

    try:
        rdb_save_cv(s3_url, u_id)
    except mysql.connector.Error as err:
        print(f"[X] MySQL 오류: {err}")
    except Exception as e:
        print(f"[X] 오류 발생: {e}")
    print(f"CV RDB 저장 완료: user_id={u_id}")

####################### ^ save cv function #######################

def es_save_jobs():
    
    if not es.indices.exists(index=JOBS_INDEX_NAME):
        es.indices.create(
            index=JOBS_INDEX_NAME,
            body={
                "mappings": {
                    "properties": {
                        "text": {"type": "text"},
                        "vector": {"type": "dense_vector", "dims": 384}
                    }
                }
            }
        )
        
    jobs = fetch_job_data()

    # jobs가 비어있을 경우 예외처리
    if not jobs:
        print("No jobs found.")
        return

    texts = []
    vectors = []

    for job in jobs:
        texts.append(job)
        print(f"Processing job: {len(job)} characters")

        vector = encode_long_text(job)
        vectors.append(vector)

    # all_equal = all(v == vectors[0] for v in vectors)
    # print("All vectors are the same:", all_equal)

    # if all_equal:
    #     for i, vector in enumerate(vectors):
    #         print(f"Vector {i} first 3 values: {vector[:3]}")

    for text, vector in zip(texts, vectors):
        doc = {
            "text": text,
            "vector": vector,
            # "u_id": u_id,
        }

        response = es.index(index=JOBS_INDEX_NAME, body=doc)
        print(f"Saved. Document ID: {response['_id']}")

# es_save_cv("https://goodjobucket.s3.ap-northeast-2.amazonaws.com/cv/cv_example.pdf", 1)
# es_save_jobs(1)