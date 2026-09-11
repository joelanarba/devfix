import json
import sys
import os

sys.path.insert(0, os.path.abspath('app/backend'))
from handler import lambda_handler

def run_tests():
    print("Running Lambda Handler Unit Tests...\n")

    # 1. Empty input -> 400
    res = lambda_handler({"httpMethod": "POST", "body": json.dumps({"input": ""})}, None)
    assert res["statusCode"] == 400, f"Expected 400, got {res['statusCode']}"
    print("PASS: Empty input rejected with 400")

    # 2. Missing input -> 400
    res = lambda_handler({"httpMethod": "POST", "body": json.dumps({})}, None)
    assert res["statusCode"] == 400, f"Expected 400, got {res['statusCode']}"
    print("PASS: Missing input rejected with 400")

    # 3. Oversized input -> 413
    res = lambda_handler({"httpMethod": "POST", "body": json.dumps({"input": "x" * 10001})}, None)
    assert res["statusCode"] == 413, f"Expected 413, got {res['statusCode']}"
    print("PASS: Oversized input rejected with 413")

    # 4. OPTIONS preflight -> 200 + CORS
    res = lambda_handler({"httpMethod": "OPTIONS"}, None)
    assert res["statusCode"] == 200, f"Expected 200, got {res['statusCode']}"
    assert "Access-Control-Allow-Origin" in res["headers"], "Missing CORS header"
    print("PASS: OPTIONS preflight returned 200 with CORS headers")

    # 5. Realistic Test 1: Python ModuleNotFoundError
    res = lambda_handler({"httpMethod": "POST", "body": json.dumps({
        "input": "ModuleNotFoundError: No module named 'requests'",
        "language": "python"
    })}, None)
    assert res["statusCode"] == 200, f"Expected 200, got {res['statusCode']}: {res['body']}"
    body = json.loads(res["body"])
    assert "what_happened" in body
    assert "why_it_happened" in body
    assert len(body["how_to_fix"]) > 0
    assert body["example_fix"] is not None
    print(f"PASS: Test 1 (ModuleNotFoundError) -> {body['summary'][:60]}")

    # 6. Realistic Test 2: JavaScript TypeError
    res = lambda_handler({"httpMethod": "POST", "body": json.dumps({
        "input": "TypeError: Cannot read properties of undefined (reading 'map')",
        "language": "javascript"
    })}, None)
    assert res["statusCode"] == 200, f"Expected 200, got {res['statusCode']}: {res['body']}"
    body = json.loads(res["body"])
    assert "what_happened" in body
    print(f"PASS: Test 2 (TypeError) -> {body['summary'][:60]}")

    # 7. Realistic Test 3: Python NameError
    res = lambda_handler({"httpMethod": "POST", "body": json.dumps({
        "input": "NameError: name 'user' is not defined",
        "language": "python"
    })}, None)
    assert res["statusCode"] == 200, f"Expected 200, got {res['statusCode']}: {res['body']}"
    body = json.loads(res["body"])
    print(f"PASS: Test 3 (NameError) -> {body['summary'][:60]}")

    # 8. Realistic Test 4: Node.js EADDRINUSE
    res = lambda_handler({"httpMethod": "POST", "body": json.dumps({
        "input": "Error: listen EADDRINUSE: address already in use :::3000",
        "language": "javascript"
    })}, None)
    assert res["statusCode"] == 200, f"Expected 200, got {res['statusCode']}: {res['body']}"
    body = json.loads(res["body"])
    print(f"PASS: Test 4 (EADDRINUSE) -> {body['summary'][:60]}")

    print("\nALL 8 LAMBDA HANDLER UNIT TESTS PASSED!")

if __name__ == '__main__':
    run_tests()
