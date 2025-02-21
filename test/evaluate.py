import sys
import os

import json
import pytest
import time

import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

from src.CV2DB.pdf_parsing import vila_predict, merge_tokens_to_sentences, load_vila_models

@pytest.fixture(scope="module")
def corpus():
    with open("../data/corpus/cv_info.json", "r", encoding="utf-8") as f:
        corpus_info = json.load(f)
        personal_info = corpus_info["Personal_Info"]
        skill_info = corpus_info["Skillset"]

    print(f"Personal Info : {len(personal_info)} / Skill Info : {len(skill_info)}")

    return {"personal_info": personal_info, "skill_info": skill_info}

def contains_keywords(textblocks, corpus):
    return any(any(keyword in textblock.text for keyword in corpus) for textblock in textblocks)

class TestCases:
    def test_extract_eng_cv(self, corpus):

        pdf_eng_path = "../data/cv/cv_example.pdf"

        start_time = time.time()

        pdf_extractor, vision_model, pdf_predictor = load_vila_models()
        pred_tokens = vila_predict(pdf_eng_path, pdf_extractor, vision_model, pdf_predictor) 
        merge_eng_tokens = merge_tokens_to_sentences(pred_tokens)

        end_time = time.time()

        elapsed_time = end_time - start_time

        print(f"Elapsed Time : {elapsed_time:.2f}s")

        personal_info = contains_keywords(merge_eng_tokens, corpus["personal_info"])
        skill_info = contains_keywords(merge_eng_tokens, corpus["skill_info"])

        print(f"Personal Info : {personal_info}")
        print(f"Skill Info : {skill_info}")

        assert len(merge_eng_tokens) > 0
        assert personal_info
        assert skill_info
        assert elapsed_time < 5
        

    def test_extract_kr_cv(self, corpus):
        
        pdf_kr_path = "../data/cv/cv_kr_example.pdf"

        start_time = time.time()

        pdf_extractor, vision_model, pdf_predictor = load_vila_models()
        pred_tokens = vila_predict(pdf_kr_path, pdf_extractor, vision_model, pdf_predictor)
        merge_kr_tokens = merge_tokens_to_sentences(pred_tokens)

        end_time = time.time()

        elapsed_time = end_time - start_time

        print(f"Elapsed Time : {elapsed_time:.2f}s")

        personal_info = contains_keywords(merge_kr_tokens, corpus["personal_info"])
        skill_info = contains_keywords(merge_kr_tokens, corpus["skill_info"])

        print(f"Personal Info : {personal_info}")
        print(f"Skill Info : {skill_info}")

        assert len(merge_kr_tokens) > 0
        assert personal_info
        assert skill_info
        assert elapsed_time < 5