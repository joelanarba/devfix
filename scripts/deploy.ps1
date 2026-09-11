# DevFix Deployment Script for PowerShell
$ErrorActionPreference = "Stop"

$STACK_NAME = "devfix"
$REGION = "us-east-1"
$FRONTEND_DIR = "app/frontend"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DevFix Automated AWS Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. Verify AWS authentication
Write-Host "`n[1/9] Verifying AWS authentication..."
$identityJson = aws sts get-caller-identity --output json | ConvertFrom-Json
Write-Host "  Account:  $($identityJson.Account)"
Write-Host "  Identity: $($identityJson.Arn)"

# 2. Verify Region
Write-Host "`n[2/9] Identifying AWS region..."
Write-Host "  Region:   $REGION"

# 3. Build backend SAM package
Write-Host "`n[3/9] Packaging backend Lambda..."
New-Item -ItemType Directory -Force -Path ".aws-sam/build/DevFixAnalyzeFunction" | Out-Null
Copy-Item "app/backend/handler.py" ".aws-sam/build/DevFixAnalyzeFunction/handler.py" -Force
Copy-Item "app/backend/requirements.txt" ".aws-sam/build/DevFixAnalyzeFunction/requirements.txt" -Force

# 4. Deploy SAM Stack
Write-Host "`n[4/9] Deploying infrastructure via AWS SAM..."
sam deploy `
  --stack-name $STACK_NAME `
  --region $REGION `
  --resolve-s3 `
  --capabilities CAPABILITY_IAM `
  --no-confirm-changeset `
  --no-fail-on-empty-changeset

# 5. Retrieve stack outputs
Write-Host "`n[5/9] Retrieving stack outputs..."
$outputs = aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query "Stacks[0].Outputs" --output json | ConvertFrom-Json
$apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiUrl" }).OutputValue
$bucketName = ($outputs | Where-Object { $_.OutputKey -eq "FrontendBucketName" }).OutputValue
$cfId = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue
$cfUrl = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontUrl" }).OutputValue

Write-Host "  API URL:        $apiUrl"
Write-Host "  S3 Bucket:      $bucketName"
Write-Host "  CloudFront ID:  $cfId"
Write-Host "  CloudFront URL: $cfUrl"

# 6. Build frontend with API URL
Write-Host "`n[6/9] Building frontend with production API URL..."
$env:VITE_API_URL = $apiUrl
Push-Location $FRONTEND_DIR
npm run build
Pop-Location

# 7. Sync frontend to S3
Write-Host "`n[7/9] Syncing frontend assets to S3..."
aws s3 sync "$FRONTEND_DIR/dist" "s3://$bucketName" --delete --region $REGION

# 8. Invalidate CloudFront
Write-Host "`n[8/9] Invalidating CloudFront edge cache..."
aws cloudfront create-invalidation --distribution-id $cfId --paths "/*" --region $REGION | Out-Null

# 9. Smoke test
Write-Host "`n[9/9] Running live smoke test..."
python scripts/smoke_test.py

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  DevFix Deployment Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Frontend URL: $cfUrl"
Write-Host "  API URL:      $apiUrl"
Write-Host "================================================" -ForegroundColor Green
