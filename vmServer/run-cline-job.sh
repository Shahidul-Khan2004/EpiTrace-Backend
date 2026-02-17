!/bin/bash

ENDPOINT=$1
REPO_URL=$2
ERROR_MSG=$3

set -e

echo "--- Starting New Job ---"
echo "Target Repo: $REPO_URL"
echo "Target Endpoint: $ENDPOINT"
echo "Fixing Error: $ERROR_MSG"

JOB_DIR="./workspace"

mkdir -p $JOB_DIR

cd $JOB_DIR

echo "Cloning repository..."

git clone $REPO_URL .

echo "Waking up agent 'cline' to do the job..."

AGENT_RESULT=$(cline -y "Please check the following error: $ERROR_MSG at this endpoint: $ENDPOINT . after finding the error write a analysis on why this error is coming")

echo ":::FINAL_ANALYSIS:::"
echo "$AGENT_RESULT"


