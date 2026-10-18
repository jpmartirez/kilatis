"""
Wake up the deployed KILATIS backend and confirm it is ready for a demonstration.

Steps:
  1. Wait until the API answers (/api/system/health). On a cold start this also loads
     every model and runs a synthetic test analysis before the first answer.
  2. Log in with a real KILATIS account (also wakes up the database).
  3. Run the synthetic test analysis again through both branches and the meta-classifier
     (/api/system/warmup). Nothing is saved to the database and no report is made.
  4. Check /api/system/ready and print the result.

Usage (Git Bash, from the backend folder):
  KILATIS_USERNAME=<your username> uv run python scripts/warmup_modal.py
  The password is asked for (hidden), or read from KILATIS_PASSWORD.

The backend URL comes from --url, KILATIS_API_URL, or NEXT_PUBLIC_API_URL in frontend/.env.
Only the Python standard library is used. Exit code 0 = ready, 1 = not ready.
"""
from __future__ import annotations

import argparse
import getpass
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

FRONTEND_ENV = Path(__file__).resolve().parents[2] / "frontend" / ".env"


def find_url(cli_url: str | None) -> str | None:
    url = cli_url or os.getenv("KILATIS_API_URL")
    if not url and FRONTEND_ENV.is_file():
        for line in FRONTEND_ENV.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("NEXT_PUBLIC_API_URL="):
                url = line.split("=", 1)[1].strip().strip('"').strip("'")
    return url.rstrip("/") if url else None


def request(method: str, url: str, timeout: float, body: dict | None = None,
            token: str | None = None) -> tuple[int, dict]:
    """Send one request. Returns (HTTP status, JSON body); status 0 = no answer."""
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as err:
        try:
            return err.code, json.loads(err.read() or b"{}")
        except ValueError:
            return err.code, {}
    except (urllib.error.URLError, TimeoutError, ConnectionError, ValueError) as err:
        return 0, {"error": str(err)}


def stage(title: str) -> float:
    print(f"\n== {title}")
    return time.time()


def done(started: float, note: str = "") -> float:
    seconds = time.time() - started
    print(f"   done in {seconds:.1f}s {note}".rstrip())
    return seconds


def fail(message: str) -> int:
    print(f"\n[FAIL] {message}\nKILATIS IS NOT READY. Check the Modal logs: uv run modal app logs kilatis-backend")
    return 1


def main() -> int:
    ap = argparse.ArgumentParser(description="Warm up the deployed KILATIS backend before a demonstration.")
    ap.add_argument("--url", help="backend URL (default: KILATIS_API_URL or frontend/.env)")
    ap.add_argument("--username", default=os.getenv("KILATIS_USERNAME"), help="KILATIS account (or KILATIS_USERNAME)")
    ap.add_argument("--attempts", type=int, default=int(os.getenv("WARMUP_ATTEMPTS", "6")),
                    help="how many times to try reaching the API (default 6)")
    ap.add_argument("--interval", type=float, default=float(os.getenv("WARMUP_INTERVAL", "10")),
                    help="seconds between attempts (default 10)")
    ap.add_argument("--timeout", type=float, default=float(os.getenv("WARMUP_TIMEOUT", "300")),
                    help="seconds to wait for one request; a cold start can take minutes (default 300)")
    args = ap.parse_args()

    base = find_url(args.url)
    if not base:
        return fail("No backend URL. Pass --url or set KILATIS_API_URL.")
    if not args.username:
        return fail("No account. Pass --username or set KILATIS_USERNAME.")
    password = os.getenv("KILATIS_PASSWORD") or getpass.getpass(f"Password for {args.username}: ")

    print(f"KILATIS warm-up -> {base}")
    total_started = time.time()

    # 1. Wake the container. A cold start loads the models and runs the self-test before answering.
    t = stage("1/4 Waking the backend (a cold start loads all models first)")
    for attempt in range(1, args.attempts + 1):
        code, _ = request("GET", f"{base}/api/system/health", args.timeout)
        if code == 200:
            break
        print(f"   attempt {attempt}/{args.attempts}: no answer yet (HTTP {code or 'none'})")
        if attempt < args.attempts:
            time.sleep(args.interval)
    else:
        return fail(f"The backend did not answer after {args.attempts} attempts.")
    first_response = done(t)

    code, startup = request("GET", f"{base}/api/system/ready", args.timeout)
    if startup.get("load_seconds"):
        print(f"   model load times (s): {startup['load_seconds']}  device: {startup.get('device')}")
    if (startup.get("self_test") or {}).get("seconds") is not None:
        print(f"   first analysis in this container (self-test): {startup['self_test']['seconds']}s")

    # 2. Log in (also wakes the Neon database).
    t = stage("2/4 Logging in (database check)")
    code, body = request("POST", f"{base}/api/auth/login", args.timeout,
                         body={"username": args.username, "password": password})
    if code != 200 or "access_token" not in body:
        return fail(f"Login failed (HTTP {code}): {body.get('detail', body.get('error', ''))}")
    token = body["access_token"]
    done(t)

    # 3. Exercise the real pipeline with the synthetic test image (nothing is stored).
    t = stage("3/4 Running a test analysis (both branches + meta-classifier)")
    code, body = request("POST", f"{base}/api/system/warmup", args.timeout, body={}, token=token)
    test = body.get("self_test") or {}
    if code != 200 or not test.get("ok"):
        return fail(f"Test analysis failed (HTTP {code}): {test.get('error') or body.get('detail') or body}")
    done(t, f"(analysis itself: {test.get('seconds')}s)")

    # 4. Final readiness check.
    t = stage("4/4 Checking readiness")
    code, body = request("GET", f"{base}/api/system/ready", args.timeout)
    if code != 200 or not body.get("ready"):
        return fail(f"Readiness check failed (HTTP {code}): {body}")
    done(t)
    print(f"   models: {body['models']}  device: {body['device']}")

    print(f"\nFirst response: {first_response:.1f}s | total warm-up: {time.time() - total_started:.1f}s")
    print("\n==============================================")
    print("   KILATIS READY FOR DEMONSTRATION")
    print("==============================================")
    return 0


if __name__ == "__main__":
    sys.exit(main())
