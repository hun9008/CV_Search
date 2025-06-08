import pytest
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

import fetch_RDB_query

# fetch_job_data_dict()
@patch("fetch_RDB_query.mysql.connector.connect")
def test_fetch_job_data_dict(mock_connect):
    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [{"id": 1, "company_name": "A"}, {"id": 2, "company_name": "B"}]
    
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_connect.return_value = mock_conn

    result = fetch_RDB_query.fetch_job_data_dict()

    assert isinstance(result, dict)
    assert result["1"]["company_name"] == "A"
    assert result["2"]["company_name"] == "B"

# fetch_job_data()
@patch("fetch_RDB_query.mysql.connector.connect")
def test_fetch_job_data(mock_connect):
    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [{
        "id": 1, "company_name": "A", "title": "Dev",
        "department": None, "require_experience": None,
        "job_description": None, "job_type": None,
        "requirements": None, "preferred_qualifications": None,
        "ideal_candidate": None, "raw_jobs_text": None, "region_text": None
    }]

    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_connect.return_value = mock_conn

    texts, ids = fetch_RDB_query.fetch_job_data()

    assert isinstance(texts, list)
    assert isinstance(ids, list)
    assert "company_name" in texts[0]
    assert ids[0] == 1

# fetch_cv_data()
@patch("fetch_RDB_query.mysql.connector.connect")
def test_fetch_cv_data(mock_connect):
    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [{"user_id": "user1", "raw_text": "This is a CV"}]

    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_connect.return_value = mock_conn

    result = fetch_RDB_query.fetch_cv_data("user1")

    assert isinstance(result, list)
    assert '"user_id": "user1"' in result[0]

# fetch_cv_save_data()
@patch("fetch_RDB_query.mysql.connector.connect")
def test_fetch_cv_save_data(mock_connect):
    mock_cursor = MagicMock()
    mock_cursor.rowcount = 1  # Simulate update success

    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_connect.return_value = mock_conn

    fetch_RDB_query.fetch_cv_save_data("url", 1, "sample text")

    mock_cursor.execute.assert_called()
    mock_conn.commit.assert_called()