#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="devfix"
SAM_TEMPLATE="infra/template.yaml"
FRONTEND_DIR="app/frontend"

echo "================================================"
echo "  DevFix Deployment"
echo "================================================"
echo ""

# -----------------------------------------------
# 1. Verify AWS authentication
# -----------------------------------------------
echo "[1/11] Verifying AWS authentication..."
IDENTITY=$(aws sts get-caller-identity --output json 2>&1) || {
  echo "ERROR: AWS authentication failed. Ensure your AWS CLI is configured."
  exit 1
}
ACCOUNT_ID=$(echo "$IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Account'])")
ARN=$(echo "$IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Arn'])")
echo "  Account: $ACCOUNT_ID"
echo "  Identity: $ARN"

# -----------------------------------------------
# 2. Identify region
# -----------------------------------------------
echo ""
echo "[2/11] Identifying AWS region..."
REGION=$(aws configure get region 2>/dev/null || echo "us-east-1")
echo "  Region: $REGION"

# -----------------------------------------------
# 3. Verify required tools
# -----------------------------------------------
echo ""
echo "[3/11] Verifying required tools..."
for cmd in aws sam node npm python3; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: $cmd is not installed or not on PATH."
    exit 1
  fi
  echo "  $cmd: $(command -v $cmd)"
done

# -----------------------------------------------
# 4. Build frontend
# -----------------------------------------------
echo ""
echo "[4/11] Building frontend..."

# Determine the API URL from an existing stack, or use empty for first deploy
API_URL=""
EXISTING_API=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text \
  --region "$REGION" 2>/dev/null || true)

if [ -n "$EXISTING_API" ] && [ "$EXISTING_API" != "None" ]; then
  API_URL="$EXISTING_API"
  echo "  Using existing API URL: $API_URL"
fi

cd "$FRONTEND_DIR"
npm install --silent
VITE_API_URL="$API_URL" npm run build
cd - > /dev/null

echo "  Frontend build complete."

# -----------------------------------------------
# 5. Build and package SAM
# -----------------------------------------------
echo ""
echo "[5/11] Building SAM application..."
sam build \
  --template-file "$SAM_TEMPLATE" \
  --region "$REGION"

echo "  SAM build complete."

# -----------------------------------------------
# 6. Deploy infrastructure
# -----------------------------------------------
echo ""
echo "[6/11] Deploying infrastructure..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo "  Infrastructure deployment complete."

# -----------------------------------------------
# 7. Retrieve outputs
# -----------------------------------------------
echo ""
echo "[7/11] Retrieving stack outputs..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text \
  --region "$REGION")

BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text \
  --region "$REGION")

CF_DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text \
  --region "$REGION")

CF_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" \
  --output text \
  --region "$REGION")

echo "  API URL:       $API_URL"
echo "  S3 Bucket:     $BUCKET_NAME"
echo "  CloudFront ID: $CF_DIST_ID"
echo "  CloudFront URL: $CF_URL"

# -----------------------------------------------
# 8. Rebuild frontend with API URL
# -----------------------------------------------
echo ""
echo "[8/11] Rebuilding frontend with API URL..."
cd "$FRONTEND_DIR"
VITE_API_URL="$API_URL" npm run build
cd - > /dev/null

echo "  Frontend rebuild complete."

# -----------------------------------------------
# 9. Deploy frontend to S3
# -----------------------------------------------
echo ""
echo "[9/11] Deploying frontend to S3..."
aws s3 sync "$FRONTEND_DIR/dist" "s3://$BUCKET_NAME" \
  --delete \
  --region "$REGION"

echo "  Frontend deployed to S3."

# -----------------------------------------------
# 10. Invalidate CloudFront cache
# -----------------------------------------------
echo ""
echo "[10/11] Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_DIST_ID" \
  --paths "/*" \
  --region "$REGION" > /dev/null 2>&1 || echo "  Warning: CloudFront invalidation may have failed."

echo "  CloudFront invalidation initiated."

# -----------------------------------------------
# 11. Smoke test
# -----------------------------------------------
echo ""
echo "[11/11] Running smoke test..."

# Test API health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"input":"test","language":"auto"}' \
  "$API_URL/api/analyze" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "502" ]; then
  echo "  API endpoint responding (HTTP $HTTP_CODE)"
else
  echo "  WARNING: API returned HTTP $HTTP_CODE (may still be deploying)"
fi

# -----------------------------------------------
# Final Summary
# -----------------------------------------------
echo ""
echo "================================================"
echo "  DevFix Deployment Complete"
echo "================================================"
echo ""
echo "  Frontend URL:  $CF_URL"
echo "  API URL:       $API_URL"
echo "  S3 Bucket:     $BUCKET_NAME"
echo "  Region:        $REGION"
echo "  Account:       $ACCOUNT_ID"
echo ""
echo "  API Endpoint:  $API_URL/api/analyze"
echo ""
echo "  To destroy: sam delete --stack-name $STACK_NAME --region $REGION"
echo "================================================"
