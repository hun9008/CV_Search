# test/es_query_search_test.py

import pytest
import sys
import os
from unittest.mock import MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))
import es_query_search


def test_keyword_filter_query_basic():
    mock_es = MagicMock()
    mock_es.search.return_value = {
        "hits": {
            "hits": [
                {"_id": "1", "_source": {"title": "백엔드 개발자"}},
                {"_id": "2", "_source": {"title": "프론트엔드 개발자"}}
            ]
        }
    }

    # es_query_search 모듈의 전역 변수 `es`를 mock으로 교체
    es_query_search.es = mock_es

    results = es_query_search.test_keyword_filter_query(
        keyword="개발자",
        job_type=["정규직"],
        experience=["신입", "1년 이상"],
        sido=["서울특별시"],
        sigungu=["강남구"],
        size=2
    )

    assert isinstance(results, list)
    assert len(results) == 2
    assert results[0]["_source"]["title"] == "백엔드 개발자"
    mock_es.search.assert_called_once()
    assert "query" in mock_es.search.call_args.kwargs["body"]


def test_keyword_filter_query_no_results():
    mock_es = MagicMock()
    mock_es.search.return_value = {"hits": {"hits": []}}

    es_query_search.es = mock_es

    results = es_query_search.test_keyword_filter_query(keyword="비존재직무", size=5)
    assert isinstance(results, list)
    assert results == []


def test_keyword_filter_query_handles_exception():
    mock_es = MagicMock()
    mock_es.search.side_effect = Exception("ES 연결 오류")

    es_query_search.es = mock_es

    results = es_query_search.test_keyword_filter_query(keyword="에러유발", size=1)
    assert isinstance(results, list)
    assert results == []