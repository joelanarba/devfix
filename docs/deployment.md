# DevFix Deployment Guide

## Prerequisites

Before deploying, ensure you have:

- **AWS CLI v2** installed and configured
- **AWS SAM CLI** v1.x or later
- **Node.js** v18+ and npm
- **Python** 3.12+
- An AWS account with Amazon Bedrock model access enabled

## Verify Environment

```bash
# Check AWS identity
aws sts get-caller-identity

# Check region
aws configure get region

# Check required tools
node --version
npm --version
python3 --version
sam --version
```

## Verify Bedrock Access

```bash
# List available Nova models
aws bedrock list-foundation-models \
  --region us-east-1 \
  --by-provider amazon \
  --query "modelSummaries[?contains(modelId, 'nova')].{id:modelId,status:modelLifecycle.status}" \
  --output table
```

If Nova models are not listed, enable them in the Bedrock console under Model Access.

## Deploy

### Automated (Recommended)

```bash
bash scripts/deploy.sh
```

This single command handles everything: build, deploy, configure, and verify.

### Manual Steps

If you need to deploy manually:

#### 1. Build the backend

```bash
sam build --template-file infra/template.yaml
```

#### 2. Deploy infrastructure

```bash
sam deploy \
  --stack-name devfix \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

#### 3. Get the API URL

```bash
aws cloudformation describe-stacks \
  --stack-name devfix \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text
```

#### 4. Build the frontend

```bash
cd app/frontend
VITE_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com npm run build
```

#### 5. Deploy frontend to S3

```bash
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name devfix \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

aws s3 sync app/frontend/dist "s3://$BUCKET" --delete
```

#### 6. Invalidate CloudFront

```bash
CF_ID=$(aws cloudformation describe-stacks \
  --stack-name devfix \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id "$CF_ID" \
  --paths "/*"
```

## Smoke Test

```bash
# Test the API
API_URL=$(aws cloudformation describe-stacks \
  --stack-name devfix \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

curl -X POST "$API_URL/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{"input":"ModuleNotFoundError: No module named '\''requests'\''","language":"python"}'
```

## Destroying the Stack

```bash
# Empty the S3 bucket first
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name devfix \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

aws s3 rm "s3://$BUCKET" --recursive

# Delete the stack
sam delete --stack-name devfix --region us-east-1
```

## Updating

To update after code changes:

```bash
# Re-run the deployment script
bash scripts/deploy.sh
```

Or update individual components:

```bash
# Backend only
sam build --template-file infra/template.yaml
sam deploy --stack-name devfix --resolve-s3 --capabilities CAPABILITY_IAM --no-confirm-changeset

# Frontend only
cd app/frontend
VITE_API_URL=https://YOUR_API_URL npm run build
cd -
aws s3 sync app/frontend/dist s3://YOUR_BUCKET --delete
aws cloudfront create-invalidation --distribution-id YOUR_CF_ID --paths "/*"
```

## Troubleshooting

### SAM deploy fails with "Unable to upload artifact"

Ensure your AWS credentials have S3 write permissions for the SAM deployment bucket.

### Lambda timeout

The default timeout is 30 seconds. If Bedrock responses are slow:
1. Increase the `Timeout` in `infra/template.yaml`
2. Redeploy

### CloudFront returns old content

Invalidate the cache:
```bash
aws cloudfront create-invalidation --distribution-id YOUR_CF_ID --paths "/*"
```

### CORS errors

The API Gateway CORS configuration is set in the SAM template Globals section. Verify the `AllowOrigins` includes your frontend domain.
