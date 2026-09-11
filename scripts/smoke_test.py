import urllib.request
import urllib.error
import json
import ssl

API_URL = "https://6gs8nfxhv1.execute-api.us-east-1.amazonaws.com"
FRONTEND_URL = "https://dbtty6lm4pzwd.cloudfront.net"

def test_api_call(name, payload, expected_status=200):
    url = f"{API_URL}/api/analyze"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = json.loads(resp.read().decode('utf-8'))
            print(f"[{status}] {name}")
            print(f"  Summary: {body.get('summary', '')[:70]}")
            print(f"  Confidence: {body.get('confidence')}")
            print(f"  Fix steps count: {len(body.get('how_to_fix', []))}")
            assert status == expected_status, f"Expected {expected_status}, got {status}"
            return body
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode('utf-8')
        print(f"[{status}] {name}")
        print(f"  Response: {body}")
        assert status == expected_status, f"Expected {expected_status}, got {status}"
        return body

def main():
    print("==================================================")
    print(" DevFix Live AWS Deployment Verification")
    print("==================================================")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"API URL:      {API_URL}\n")

    # Test 1: Frontend CDN is serving HTML
    print("Testing Frontend CloudFront accessibility...")
    req = urllib.request.Request(FRONTEND_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        assert resp.status == 200, f"Frontend returned {resp.status}"
        assert "<title>DevFix" in html, "Missing DevFix title in index.html"
        assert 'id="root"' in html, "Missing React root element in index.html"
        print(f"  [200] Frontend reachable and serving valid SPA HTML ({len(html)} bytes)")

    print("\nTesting Backend API Endpoints (4 Test Cases from Spec)...\n")

    # Test Case 1: Python ModuleNotFoundError
    test_api_call(
        "Test 1: Python - ModuleNotFoundError",
        {"input": "ModuleNotFoundError: No module named 'requests'", "language": "python"}
    )

    # Test Case 2: JavaScript TypeError
    test_api_call(
        "Test 2: JavaScript - TypeError",
        {"input": "TypeError: Cannot read properties of undefined (reading 'map')", "language": "javascript"}
    )

    # Test Case 3: Python NameError
    test_api_call(
        "Test 3: Python - NameError",
        {"input": "NameError: name 'user' is not defined", "language": "python"}
    )

    # Test Case 4: Node.js EADDRINUSE
    test_api_call(
        "Test 4: Node.js - EADDRINUSE",
        {"input": "Error: listen EADDRINUSE: address already in use :::3000", "language": "javascript"}
    )

    # Test Validation: Empty input -> 400
    print("\nTesting Error Handling & Validation...\n")
    test_api_call("Empty Input Validation", {"input": "  "}, expected_status=400)

    # Test Validation: Oversized input -> 413
    test_api_call("Oversized Input Validation", {"input": "a" * 10005}, expected_status=413)

    print("\n==================================================")
    print(" ALL LIVE INTEGRATION & SMOKE TESTS PASSED!")
    print("==================================================")

if __name__ == '__main__':
    main()
