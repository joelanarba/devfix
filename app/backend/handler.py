import json
import logging
import os
import re
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

BEDROCK_REGION = os.environ.get("BEDROCK_REGION", os.environ.get("AWS_REGION", "us-east-1"))
bedrock_cfg = Config(retries={'max_attempts': 1}, connect_timeout=5, read_timeout=15)
bedrock_client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION, config=bedrock_cfg)
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "amazon.nova-lite-v1:0")

SYSTEM_PROMPT = """You are a senior software debugging engineer. Your task is to analyze error messages, stack traces, compiler errors, runtime errors, and problematic code snippets.

For every input, you must:
1. Identify the most likely root cause, distinguishing symptoms from root causes
2. Explain the error clearly and concisely
3. Recommend practical, actionable fixes
4. Provide corrected code when enough context exists
5. Avoid unnecessary verbosity
6. Avoid inventing missing context - explicitly state assumptions
7. Preserve technical correctness
8. If uncertain, explicitly state uncertainty rather than guessing

You MUST respond with valid JSON in this exact structure:
{
  "summary": "One-line summary of the error",
  "what_happened": "Clear explanation of what the error is",
  "why_it_happened": "Explanation of the underlying cause",
  "how_to_fix": ["Step 1", "Step 2"],
  "example_fix": "Corrected code if applicable, or null if not enough context",
  "pitfalls": ["Common related mistakes or edge cases"],
  "confidence": "high|medium|low"
}

Rules:
- Always return valid JSON. Do not wrap in markdown code fences.
- The how_to_fix array must have at least one item.
- If you cannot provide example code, set example_fix to null.
- If there are no pitfalls worth mentioning, use an empty array.
- Be specific to the language/runtime when detected."""

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

def create_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body) if not isinstance(body, str) else body,
    }

def sanitize_log(text):
    if not text:
        return ""
    if len(text) > 200:
        return text[:200] + "... (truncated)"
    return text

def get_diagnostic_fallback(user_input, language='auto'):
    text = user_input.strip()

    # 1. ModuleNotFoundError / ImportError
    match = re.search(r"ModuleNotFoundError:\s*No module named ['\"]([^'\"]+)['\"]", text)
    if not match:
        match = re.search(r"ImportError:\s*cannot import name ['\"]([^'\"]+)['\"]", text)
    if match:
        mod = match.group(1)
        return {
            "summary": f"ModuleNotFoundError: Python cannot locate the '{mod}' module in the active environment.",
            "what_happened": f"Python attempted to import '{mod}', but the package is not installed in the currently active environment or is not present in sys.path.",
            "why_it_happened": f"The package '{mod}' has not been installed via pip/uv, or your shell/IDE is executing with a different Python interpreter than the environment containing dependencies.",
            "how_to_fix": [
                f"Install the missing package in your current environment: pip install {mod}",
                "If using a virtual environment, activate it before running: source .venv/bin/activate (Linux/macOS) or .venv\\Scripts\\activate (Windows)",
                "If using pyproject.toml or requirements.txt, ensure the package is recorded in your project dependencies."
            ],
            "example_fix": f"# Install {mod} in your active environment:\npip install {mod}\n\n# Or with poetry / uv:\nuv add {mod}    # or: poetry add {mod}\n\n# Verify installation:\npython -c \"import {mod}; print('{mod} installed successfully')\"",
            "pitfalls": [
                "Running 'pip install' with a global Python version while your project executes inside a virtual environment.",
                "Confusing distribution package names with import names (e.g., 'pip install pillow' imports as 'PIL')."
            ],
            "confidence": "high"
        }

    # 2. TypeError: Cannot read properties of undefined/null
    match = re.search(r"Cannot read properties of (undefined|null)\s*\(reading ['\"]([^'\"]+)['\"]\)", text, re.IGNORECASE)
    if not match:
        match = re.search(r"TypeError:\s*([a-zA-Z0-9_$.]+)\s*is not a function", text, re.IGNORECASE)
    if match:
        prop = match.group(2) if match.lastindex >= 2 else match.group(1)
        return {
            "summary": f"TypeError: Attempted to access property or method '{prop}' on an undefined or null value.",
            "what_happened": f"JavaScript evaluated an access on '{prop}', but the parent object variable is currently undefined or null at runtime.",
            "why_it_happened": "The target object was not initialized, an asynchronous network request has not completed yet, or an upstream function returned undefined instead of the expected object/array.",
            "how_to_fix": [
                f"Use optional chaining (?.{prop}) to safely access the property without throwing.",
                "Add a nullish coalescing check or fallback value using '?? []' or '?? {}'.",
                "Ensure asynchronous operations (fetch, async/await, useEffect) resolve before attempting to access response properties."
            ],
            "example_fix": f"// Problematic code:\nconst result = data.{prop}();\n\n// Corrected with optional chaining and fallback:\nconst result = data?.{prop}?.() ?? [];\n\n// In React component:\nif (!data) return <div>Loading...</div>;\nreturn <div>{{data.{prop}}}</div>;",
            "pitfalls": [
                "Assuming network payloads will match expected schemas without runtime validation.",
                "Accessing React state in child components before the parent component finishes data fetching."
            ],
            "confidence": "high"
        }

    # 3. NameError: name '...' is not defined
    match = re.search(r"NameError:\s*name ['\"]([^'\"]+)['\"]\s*is not defined", text)
    if match:
        var_name = match.group(1)
        return {
            "summary": f"NameError: Identifier '{var_name}' is referenced before definition or import in scope.",
            "what_happened": f"Python encountered the identifier '{var_name}', which does not exist in local, global, or built-in namespaces.",
            "why_it_happened": f"The variable or function '{var_name}' was referenced before assignment, has a typographical error, was imported inside an unreached conditional, or is scoped inside another function.",
            "how_to_fix": [
                f"Verify the spelling and casing of '{var_name}'.",
                f"Ensure '{var_name}' is initialized or imported before the line where it is accessed.",
                "Check variable scoping if defined inside an 'if' branch or function body."
            ],
            "example_fix": f"# Ensure '{var_name}' is defined or imported before use:\n{var_name} = 'example_value'\n\n# If it is a function or module:\n# import {var_name}\n\nprint({var_name})",
            "pitfalls": [
                "Assigning a variable only inside an 'if' branch that does not execute under certain conditions.",
                "Shadowing built-in names or forgetting 'global' / 'nonlocal' keywords when reassigning in inner scopes."
            ],
            "confidence": "high"
        }

    # 4. EADDRINUSE: address already in use
    if "EADDRINUSE" in text or "address already in use" in text:
        port_match = re.search(r":(\d{2,5})", text)
        port = port_match.group(1) if port_match else "3000"
        return {
            "summary": f"EADDRINUSE: TCP port {port} is already bound by another running process.",
            "what_happened": f"The application attempted to listen on port {port}, but the operating system rejected the bind call because another process is already listening on that port.",
            "why_it_happened": "A previously started instance of your server is still running in the background, or an unrelated application is occupying the same port.",
            "how_to_fix": [
                f"Identify and terminate the existing process listening on port {port}.",
                f"Alternatively, configure the server to bind to an available alternate port via an environment variable (e.g. PORT={int(port)+1}).",
                "Verify that development watch tools (nodemon, vite, live-server) cleanly terminate child processes on reload."
            ],
            "example_fix": f"# On macOS / Linux:\nlsof -i :{port}\nkill -9 <PID>\n\n# On Windows (PowerShell):\nGet-NetTCPConnection -LocalPort {port} | Select-Object OwningProcess\nStop-Process -Id <PID> -Force\n\n# Or configure a different port:\nPORT={int(port)+1} npm start",
            "pitfalls": [
                "Forcefully terminating system services without confirming the PID first.",
                "Orphaned background node processes lingering after closing an IDE or terminal window."
            ],
            "confidence": "high"
        }

    # 5. CORS policy
    if "CORS" in text or "Access-Control-Allow-Origin" in text or "Cross-Origin" in text:
        return {
            "summary": "CORS Error: Browser blocked cross-origin HTTP request due to missing access headers.",
            "what_happened": "The browser's Same-Origin Policy blocked a client-side JavaScript request because the destination server did not return permissible 'Access-Control-Allow-Origin' headers.",
            "why_it_happened": "The API server is hosted on a different domain, port, or protocol than the frontend application, and has not enabled CORS headers for the frontend's origin.",
            "how_to_fix": [
                "Configure CORS middleware on your backend server to allow the frontend origin.",
                "Ensure preflight OPTIONS requests are handled with HTTP 200/204 status and return valid CORS headers.",
                "In local development, use a dev-server proxy (e.g. Vite proxy) to route API calls through the same origin."
            ],
            "example_fix": "// Express.js (Node.js) CORS configuration:\nimport cors from 'cors';\n\napp.use(cors({\n  origin: ['http://localhost:3000', 'https://yourdomain.com'],\n  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],\n  allowedHeaders: ['Content-Type', 'Authorization']\n}));\n\n// In AWS Lambda HTTP API, return headers:\nreturn {\n  statusCode: 200,\n  headers: {\n    'Access-Control-Allow-Origin': '*',\n    'Access-Control-Allow-Headers': 'Content-Type',\n    'Access-Control-Allow-Methods': 'POST,OPTIONS'\n  },\n  body: JSON.stringify(data)\n};",
            "pitfalls": [
                "Attempting to fix CORS from frontend client code -- CORS is enforced by the browser and must be configured on the server.",
                "Using wildcard '*' for Access-Control-Allow-Origin when sending credentials (cookies or Authorization headers)."
            ],
            "confidence": "high"
        }

    # 6. SQL syntax error
    if "SQL" in text or "syntax error" in text.lower() or "ERROR 1064" in text:
        return {
            "summary": "SQL Syntax Error: The database query contains invalid or malformed SQL syntax.",
            "what_happened": "The database query parser encountered a syntax violation near a specified token or clause.",
            "why_it_happened": "Common causes include misspelled SQL keywords (e.g. 'SELCT' vs 'SELECT'), missing commas between column lists, unmatched quotes, or unescaped reserved keywords.",
            "how_to_fix": [
                "Inspect the query syntax immediately before and around the token highlighted in the error message.",
                "Check for misspelled keywords, unclosed quotation marks, and missing commas between column definitions.",
                "Always use parameterized queries or an ORM/query builder to prevent syntax errors and SQL injection."
            ],
            "example_fix": "-- Problematic query:\nSELCT id, username FROM users WHERE id = 1;\n\n-- Corrected query:\nSELECT id, username FROM users WHERE id = 1;\n\n-- Safe parameterized query (Node.js pg):\nawait pool.query('SELECT id, username FROM users WHERE id = $1', [userId]);",
            "pitfalls": [
                "Manually concatenating variables into SQL strings, causing both syntax errors and SQL injection vulnerabilities.",
                "Using database-specific syntax (e.g. LIMIT vs TOP) on an incompatible database engine."
            ],
            "confidence": "high"
        }

    return None

def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod")
        if not http_method:
            request_context = event.get("requestContext", {})
            http_method = request_context.get("http", {}).get("method") or event.get("routeKey", "").split(" ")[0]

        if http_method == "OPTIONS":
            return create_response(200, "")

        if http_method != "POST":
            return create_response(405, {"error": "Method Not Allowed"})

        body = event.get("body", "{}")
        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                return create_response(400, {"error": "Invalid JSON body"})

        user_input = body.get("input")
        language = body.get("language", "auto")

        if not user_input or not isinstance(user_input, str):
            return create_response(400, {"error": "Input is required and must be a string"})

        if not user_input.strip():
            return create_response(400, {"error": "Input cannot be empty"})

        if len(user_input) > 10000:
            return create_response(413, {"error": "Input exceeds maximum length of 10000 characters"})

        logger.info(f"Processing request for language: {language}, input prefix: {sanitize_log(user_input)}")

        user_message_text = user_input
        if language and language != "auto":
            user_message_text = f"[Language: {language}]\n\n{user_input}"

        messages = [
            {
                "role": "user",
                "content": [{"text": user_message_text}]
            }
        ]

        system = [{"text": SYSTEM_PROMPT}]

        try:
            response = bedrock_client.converse(
                modelId=MODEL_ID,
                messages=messages,
                system=system,
                inferenceConfig={
                    "maxTokens": 2048,
                    "temperature": 0.2
                }
            )

            output_message = response['output']['message']
            content = output_message['content'][0]['text']

            try:
                parsed_content = json.loads(content)
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse Bedrock response as JSON. Raw response: {sanitize_log(content)}")
                parsed_content = {
                    "summary": "Analysis completed",
                    "what_happened": content,
                    "why_it_happened": "The model returned an unformatted response.",
                    "how_to_fix": ["Review the text explanation above."],
                    "example_fix": None,
                    "pitfalls": [],
                    "confidence": "low"
                }

            return create_response(200, parsed_content)

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            error_msg = e.response.get("Error", {}).get("Message", "")
            logger.warning(f"Bedrock ClientError ({error_code}): {sanitize_log(error_msg)}")

            # When Bedrock is throttled or hit account daily quota, provide resilient diagnostic fallback
            if error_code in ("ThrottlingException", "ModelNotReadyException", "AccessDeniedException"):
                fallback = get_diagnostic_fallback(user_input, language)
                if fallback:
                    logger.info("Provided resilient structured diagnostic fallback.")
                    return create_response(200, fallback)
                return create_response(429, {"error": "DevFix is temporarily rate-limited by Amazon Bedrock. Please wait a moment and try again."})

            return create_response(502, {"error": "DevFix couldn't reach the analysis service. Try again in a moment."})

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return create_response(500, {"error": "An unexpected error occurred."})
