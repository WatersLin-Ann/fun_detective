"""飞书客户端单元测试（使用 mock，不调用真实 API）。"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from unittest.mock import patch, MagicMock
from scripts.lark_client import LarkClient


@pytest.fixture
def client():
    return LarkClient("test_app_id", "test_app_secret")


def test_get_tenant_access_token_success(client):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "code": 0,
        "tenant_access_token": "test_token_123",
        "expire": 7200
    }
    mock_response.raise_for_status = MagicMock()

    with patch("scripts.lark_client.requests.post", return_value=mock_response):
        token = client._get_tenant_access_token()
        assert token == "test_token_123"


def test_get_tenant_access_token_failure(client):
    mock_response = MagicMock()
    mock_response.json.return_value = {"code": 9999, "msg": "invalid app"}
    mock_response.raise_for_status = MagicMock()

    with patch("scripts.lark_client.requests.post", return_value=mock_response):
        with pytest.raises(RuntimeError, match="获取 tenant_access_token 失败"):
            client._get_tenant_access_token()


def test_get_all_records_pagination(client):
    """测试分页读取：模拟两页数据。"""
    client._tenant_access_token = "fake_token"
    client._token_expire_time = 9999999999

    page1 = MagicMock()
    page1.json.return_value = {
        "code": 0,
        "data": {
            "items": [{"record_id": "rec1", "fields": {"name": "A"}}],
            "has_more": True,
            "page_token": "token_next"
        }
    }
    page1.raise_for_status = MagicMock()

    page2 = MagicMock()
    page2.json.return_value = {
        "code": 0,
        "data": {
            "items": [{"record_id": "rec2", "fields": {"name": "B"}}],
            "has_more": False,
            "page_token": None
        }
    }
    page2.raise_for_status = MagicMock()

    with patch("scripts.lark_client.requests.get", side_effect=[page1, page2]):
        records = client.get_all_records("base_token", "table_id")
        assert len(records) == 2
        assert records[0]["record_id"] == "rec1"
        assert records[1]["record_id"] == "rec2"


def test_get_all_records_api_error(client):
    """测试 API 返回错误时抛出异常。"""
    client._tenant_access_token = "fake_token"
    client._token_expire_time = 9999999999

    mock_response = MagicMock()
    mock_response.json.return_value = {"code": 1234, "msg": "permission denied"}
    mock_response.raise_for_status = MagicMock()

    with patch("scripts.lark_client.requests.get", return_value=mock_response):
        with pytest.raises(RuntimeError, match="读取记录失败"):
            client.get_all_records("base_token", "table_id", max_retries=1)
