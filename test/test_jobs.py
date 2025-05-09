import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime
import hashlib

# 테스트용 상수
MOCK_INDEX_NAME = "test_jobs_index"
MOCK_JOB_TEXT = "테스트 직무 내용입니다."
MOCK_JOB_ID = "1234"
MOCK_VECTOR = [0.1] * 384
MOCK_HASH = hashlib.sha256(MOCK_JOB_TEXT.encode('utf-8')).hexdigest()

@patch("src.es_save_module.es")  # es 객체 mock
@patch("src.es_save_module.fetch_job_data")
@patch("src.es_save_module.encode_long_text")
def test_es_save_jobs_inserts_new_job(mock_encode, mock_fetch, mock_es):
    # mock return values
    mock_fetch.return_value = ([MOCK_JOB_TEXT], [MOCK_JOB_ID])
    mock_encode.return_value = MOCK_VECTOR
    mock_es.indices.exists.return_value = False
    mock_es.search.return_value = {"hits": {"hits": []}}  # no existing document
    mock_es.index.return_value = {"_id": "abcd1234"}

    # 모듈에서 직접 호출하는 es_save_jobs() 실행
    from src.es_save_module import es_save_jobs, JOBS_INDEX_NAME
    es_save_jobs()

    # 검증
    mock_es.indices.create.assert_called_once()
    mock_es.index.assert_called_once()
    index_call_args = mock_es.index.call_args[1]  # kwargs
    assert index_call_args["index"] == JOBS_INDEX_NAME
    assert index_call_args["body"]["text"] == MOCK_JOB_TEXT
    assert index_call_args["body"]["text_hash"] == MOCK_HASH
    assert index_call_args["body"]["job_id"] == MOCK_JOB_ID

@patch("src.es_save_module.es")
@patch("src.es_save_module.fetch_job_data")
@patch("src.es_save_module.encode_long_text")
def test_es_save_jobs_skips_duplicate(mock_encode, mock_fetch, mock_es):
    mock_fetch.return_value = ([MOCK_JOB_TEXT], [MOCK_JOB_ID])
    mock_encode.return_value = MOCK_VECTOR
    mock_es.indices.exists.return_value = True
    mock_es.search.return_value = {
        "hits": {
            "hits": [{
                "_source": {
                    "text_hash": MOCK_HASH
                }
            }]
        }
    }

    from src.es_save_module import es_save_jobs
    es_save_jobs()

    # 저장 동작은 없어야 함
    mock_es.index.assert_not_called()