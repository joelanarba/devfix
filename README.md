# DevFix

Understand errors. Fix them faster.

Paste an error message, stack trace, or code snippet and get a concise technical diagnosis with practical next steps.

---

## Features

- Paste any error message, stack trace, compiler error, or code snippet
- Receive structured analysis: what happened, why, how to fix, and example code
- Supports auto-detection and 10+ languages/runtimes
- Syntax-highlighted code blocks with copy functionality
- Keyboard shortcuts (Ctrl+Enter to analyze)
- Responsive design for desktop, tablet, and mobile
- Built-in example errors to try immediately
- Stateless -- no data stored, no accounts required

## Architecture

```
User Browser
    |
    v
CloudFront (CDN)
    |
    v
S3 (Static Frontend)

User Browser --> API Gateway (HTTP API)
                    |
                    v
                Lambda (Python)
                    |
                    v
            Amazon Bedrock (Nova Lite)
```

### AWS Services

| Service | Purpose |
|---------|---------|
| Amazon S3 | Frontend static file hosting |
| Amazon CloudFront | CDN and HTTPS termination |
| Amazon API Gateway v2 | HTTP API for backend |
| AWS Lambda | Serverless compute for analysis |
| Amazon Bedrock | AI inference (Nova Lite model) |
| AWS IAM | Least-privilege access control |

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite, highlight.js
- **Backend**: Python 3.12, boto3, AWS Lambda
- **Infrastructure**: AWS SAM (Serverless Application Model)
- **AI Model**: Amazon Nova Lite (via Bedrock Converse API)

## Project Structure

```
DevFix/
  app/
    frontend/          # React + TypeScript SPA
      src/
        components/    # UI components
        api.ts         # API client
        types.ts       # TypeScript types
        index.css      # Styles
    backend/
      handler.py       # Lambda handler
      requirements.txt # Python dependencies
  infra/
    template.yaml      # SAM infrastructure template
  scripts/
    deploy.sh          # Automated deployment script
  docs/
    architecture.md    # Architecture documentation
    deployment.md      # Deployment documentation
  README.md
```

## Prerequisites

- **AWS CLI v2** configured with valid credentials
- **AWS SAM CLI** (v1.x+)
- **Node.js** (v18+) and npm
- **Python** (3.12+)
- AWS account with Bedrock access enabled for Amazon Nova models

## AWS Authentication

DevFix uses the standard AWS credential chain. No credentials are hardcoded or committed.

- Local development: uses `~/.aws/credentials` and `~/.aws/config`
- Lambda execution: uses IAM execution role
- No API keys, secrets, or tokens are stored in the application

Verify your authentication:

```bash
aws sts get-caller-identity
aws configure get region
```

## Local Development

### Frontend

```bash
cd app/frontend
npm install
npm run dev
```

The development server starts at `http://localhost:5173`.

Set `VITE_API_URL` to point to a deployed API endpoint:

```bash
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com npm run dev
```

### Backend

Test the Lambda handler locally with SAM:

```bash
sam build --template-file infra/template.yaml
sam local invoke DevFixAnalyzeFunction -e test-event.json
```

## Deployment

Deploy everything with one command:

```bash
bash scripts/deploy.sh
```

The script will:
1. Verify AWS authentication
2. Identify the AWS account and region
3. Verify required tools
4. Build the frontend
5. Build and package the Lambda
6. Deploy infrastructure via SAM
7. Retrieve the API URL
8. Rebuild frontend with the API URL
9. Sync frontend to S3
10. Invalidate CloudFront cache
11. Run a smoke test
12. Print final URLs

### Destroying the Stack

```bash
sam delete --stack-name devfix --region us-east-1
```

You may also need to empty and delete the S3 bucket manually:

```bash
aws s3 rm s3://devfix-frontend-ACCOUNT_ID-REGION --recursive
```

## Environment Variables

### Frontend (build-time)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `""` (relative) |

### Backend (runtime, set via SAM template)

| Variable | Description | Default |
|----------|-------------|---------|
| `BEDROCK_MODEL_ID` | Bedrock model identifier | `amazon.nova-lite-v1:0` |

## Bedrock Model Configuration

The default model is `amazon.nova-lite-v1:0`. To use a different model:

1. Update `BEDROCK_MODEL_ID` in `infra/template.yaml`
2. Update the IAM policy resource ARN if using a non-Nova model
3. Redeploy with `bash scripts/deploy.sh`

Verify available models:

```bash
aws bedrock list-foundation-models --region us-east-1 \
  --by-provider amazon \
  --query "modelSummaries[?contains(modelId, 'nova')].{id:modelId,status:modelLifecycle.status}" \
  --output table
```

## Testing

### Backend Validation

| Test Case | Expected |
|-----------|----------|
| Valid error input | 200, structured JSON response |
| Empty input | 400, error message |
| Input > 10,000 chars | 413, error message |
| Missing `input` field | 400, error message |
| Bedrock service error | 502, safe error message |

### Frontend Checks

- Production build succeeds without errors
- Responsive layout works at all breakpoints
- Keyboard shortcut (Ctrl+Enter) triggers analysis
- Example errors load correctly
- Copy functionality works
- Error states display correctly

### Integration Tests

```bash
# Test the deployed API
curl -X POST https://YOUR_API_URL/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"input":"ModuleNotFoundError: No module named '\''requests'\''","language":"python"}'
```

## Security

- All user input is treated as untrusted
- Request size limits enforced (10,000 characters)
- No credentials exposed to the browser
- No user data stored
- Lambda uses least-privilege IAM
- CloudFront enforces HTTPS
- CORS configured for API Gateway
- Error messages sanitized before returning to client

## Cost Considerations

This application uses a serverless architecture with pay-per-use pricing:

- **Lambda**: Free tier includes 1M requests/month
- **API Gateway**: Free tier includes 1M requests/month
- **S3**: Minimal storage cost for static files
- **CloudFront**: Free tier includes 1TB/month
- **Bedrock (Nova Lite)**: Pay per input/output token

Conservative Bedrock settings (maxTokens: 2048, temperature: 0.2) help control costs.

## Troubleshooting

### "Access Denied" on Bedrock

Ensure the Amazon Nova model is enabled in your AWS account:
1. Go to Amazon Bedrock console
2. Navigate to Model Access
3. Enable Amazon Nova Lite

### SAM deployment fails

```bash
# Check your AWS identity
aws sts get-caller-identity

# Verify SAM CLI version
sam --version

# Try with verbose logging
sam deploy --debug ...
```

### Frontend not updating

Invalidate CloudFront cache:

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

Built with AWS Serverless and Amazon Bedrock.
