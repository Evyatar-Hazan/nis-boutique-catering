#!/bin/bash

# Lev Hedva Backend Deployment Script

set -e

echo "🚀 Starting deployment to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Get project configuration
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No Google Cloud project configured. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

SERVICE_NAME="lev-hedva-backend"
REGION=${REGION:-"us-central1"}
VERSION=$(node -p "require('./package.json').version")
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:v$VERSION"

echo "📋 Deployment Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Version: v$VERSION"
echo "   Image: $IMAGE_TAG"
echo ""

# Build and test
echo "🧪 Running tests..."
npm run test

echo "🔧 Building application..."
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t $IMAGE_TAG .
docker tag $IMAGE_TAG gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Push to Google Container Registry
echo "📤 Pushing image to Google Container Registry..."
docker push $IMAGE_TAG
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_TAG \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --concurrency=80 \
    --timeout=300 \
    --max-instances=10 \
    --min-instances=0 \
    --set-env-vars=NODE_ENV=production,PORT=8080

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"