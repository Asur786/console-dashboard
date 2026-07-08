"""
Reusable Databricks REST API client.

Handles:
  - Authentication (PAT or OAuth M2M token)
  - Base URL construction from DATABRICKS_HOST
  - HTTP requests with timeout and retry for transient failures
  - Structured error logging

All Databricks REST API interactions (Genie, Jobs, etc.) should route
through this client rather than making raw requests.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from config.settings import settings

logger = logging.getLogger(__name__)

# =========================================================================== #
#  OAuth token cache (reuses the same pattern from databricks_service.py)      #
# =========================================================================== #

_oauth_cache: dict[str, Any] = {}


def _get_access_token() -> str:
    """
    Resolve an access token for Databricks REST API calls.

    Priority:
      1. DATABRICKS_TOKEN (personal access token — local dev)
      2. DATABRICKS_CLIENT_ID + DATABRICKS_CLIENT_SECRET (OAuth M2M —
         auto-injected by Databricks Apps)

    Returns:
        A valid Bearer token string.

    Raises:
        RuntimeError: If neither auth method is configured.
    """
    # PAT takes priority
    if settings.DATABRICKS_TOKEN:
        return settings.DATABRICKS_TOKEN

    # OAuth M2M
    if settings.DATABRICKS_CLIENT_ID and settings.DATABRICKS_CLIENT_SECRET:
        now = time.time()
        if _oauth_cache.get("token") and _oauth_cache.get("expires_at", 0) - 60 > now:
            return _oauth_cache["token"]  # type: ignore[return-value]

        host   = settings.DATABRICKS_HOST
        c_id   = settings.DATABRICKS_CLIENT_ID
        c_sec  = settings.DATABRICKS_CLIENT_SECRET

        resp = requests.post(
            f"https://{host}/oidc/v1/token",
            data={"grant_type": "client_credentials", "scope": "all-apis"},
            auth=(c_id, c_sec),
            timeout=30,
        )
        resp.raise_for_status()
        payload = resp.json()

        _oauth_cache["token"]      = payload["access_token"]
        _oauth_cache["expires_at"] = now + int(payload.get("expires_in", 3600))
        logger.info("OAuth M2M token acquired for REST client (expires_in=%ss)", payload.get("expires_in"))
        return _oauth_cache["token"]  # type: ignore[return-value]

    raise RuntimeError(
        "No Databricks credentials configured. "
        "Set DATABRICKS_TOKEN or (DATABRICKS_CLIENT_ID + DATABRICKS_CLIENT_SECRET)."
    )


# =========================================================================== #
#  DatabricksClient                                                            #
# =========================================================================== #

class DatabricksClient:
    """
    Reusable HTTP client for the Databricks REST API.

    Features:
      - Automatic Bearer token injection
      - Configurable timeout (default 120s for Genie, which can be slow)
      - Retry on 429 / 500 / 502 / 503 / 504 with exponential backoff
      - Structured logging for debugging

    Usage:
        client = DatabricksClient()
        resp = client.post("/api/2.0/some-endpoint", json={"key": "value"})
    """

    def __init__(
        self,
        timeout: int = 120,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
    ) -> None:
        self._timeout = timeout
        self._base_url = f"https://{settings.DATABRICKS_HOST}"

        # Session with retry adapter
        self._session = requests.Session()
        retry = Retry(
            total=max_retries,
            backoff_factor=backoff_factor,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"],
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retry)
        self._session.mount("https://", adapter)
        self._session.mount("http://", adapter)

    def _headers(self) -> dict[str, str]:
        """Build request headers with fresh auth token."""
        return {
            "Authorization": f"Bearer {_get_access_token()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def get(
        self,
        path: str,
        params: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """
        Send a GET request to the Databricks REST API.

        Args:
            path:   API path (e.g. '/api/2.0/genie/spaces/...')
            params: Optional query parameters.

        Returns:
            Parsed JSON response as a dict.

        Raises:
            requests.HTTPError: On 4xx/5xx responses after retries.
        """
        url = f"{self._base_url}{path}"
        logger.debug("GET %s", url)

        resp = self._session.get(
            url,
            headers=self._headers(),
            params=params,
            timeout=self._timeout,
        )
        resp.raise_for_status()
        return resp.json()

    def post(
        self,
        path: str,
        json: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """
        Send a POST request to the Databricks REST API.

        Args:
            path: API path.
            json: Request body as a dict (will be JSON-serialised).

        Returns:
            Parsed JSON response as a dict.

        Raises:
            requests.HTTPError: On 4xx/5xx responses after retries.
        """
        url = f"{self._base_url}{path}"
        logger.debug("POST %s | body keys: %s", url, list((json or {}).keys()))

        resp = self._session.post(
            url,
            headers=self._headers(),
            json=json,
            timeout=self._timeout,
        )
        resp.raise_for_status()
        return resp.json()


# Module-level singleton
databricks_client = DatabricksClient()
