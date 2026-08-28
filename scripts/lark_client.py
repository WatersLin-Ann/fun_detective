"""飞书 API 客户端：通过飞书开放 API 读取 Base 记录。"""
import time
import requests
from typing import List, Dict, Optional


class LarkClient:
    """飞书多维表格 API 客户端。"""

    BASE_URL = "https://open.feishu.cn/open-apis"

    def __init__(self, app_id: str, app_secret: str):
        self.app_id = app_id
        self.app_secret = app_secret
        self._tenant_access_token: Optional[str] = None
        self._token_expire_time: float = 0

    def _get_tenant_access_token(self) -> str:
        """获取 tenant_access_token，带缓存。"""
        if self._tenant_access_token and time.time() < self._token_expire_time:
            return self._tenant_access_token

        url = f"{self.BASE_URL}/auth/v3/tenant_access_token/internal"
        payload = {
            "app_id": self.app_id,
            "app_secret": self.app_secret,
        }
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") != 0:
            raise RuntimeError(f"获取 tenant_access_token 失败: {data.get('msg')}")

        self._tenant_access_token = data["tenant_access_token"]
        self._token_expire_time = time.time() + data.get("expire", 7200) - 60
        return self._tenant_access_token

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._get_tenant_access_token()}",
            "Content-Type": "application/json",
        }

    def get_all_records(self, base_token: str, table_id: str,
                        page_size: int = 100, max_retries: int = 3) -> List[Dict]:
        """
        读取指定数据表的全部记录，自动处理分页。

        Args:
            base_token: 多维表格的 app_token
            table_id: 数据表 ID
            page_size: 每页记录数（最大500）
            max_retries: 失败最大重试次数

        Returns:
            记录列表，每条记录包含 record_id 和 fields
        """
        all_records = []
        page_token = None
        retry_count = 0

        while True:
            url = f"{self.BASE_URL}/bitable/v1/apps/{base_token}/tables/{table_id}/records"
            params = {"page_size": page_size}
            if page_token:
                params["page_token"] = page_token

            try:
                resp = requests.get(url, headers=self._get_headers(),
                                    params=params, timeout=30)
                resp.raise_for_status()
                data = resp.json()

                if data.get("code") != 0:
                    raise RuntimeError(f"读取记录失败: {data.get('msg')}")

                items = data.get("data", {}).get("items", [])
                all_records.extend(items)

                has_more = data.get("data", {}).get("has_more", False)
                page_token = data.get("data", {}).get("page_token")

                if not has_more or not page_token:
                    break
                retry_count = 0  # 重置重试计数

            except Exception as e:
                retry_count += 1
                if retry_count >= max_retries:
                    raise RuntimeError(f"读取记录失败（重试{max_retries}次后）: {e}")
                time.sleep(10 * retry_count)  # 退避重试

        return all_records

    def get_record(self, base_token: str, table_id: str,
                   record_id: str) -> Optional[Dict]:
        """读取单条记录。"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{base_token}/tables/{table_id}/records/{record_id}"
        resp = requests.get(url, headers=self._get_headers(), timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") != 0:
            return None
        return data.get("data", {}).get("record")
