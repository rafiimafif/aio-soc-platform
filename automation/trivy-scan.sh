#!/bin/bash
# Local automation script to run Trivy scans on code & containers
set -e

echo "========================================="
echo "   CyberOps SOC Security Scanner (Trivy)  "
echo "========================================="

# Check if Trivy is installed
if ! command -v trivy &> /dev/null; then
    echo "Error: Trivy is not installed."
    echo "Installation options:"
    echo "  - Linux: apt-get install trivy (or brew install aquasecurity/trivy/trivy)"
    echo "  - MacOS: brew install aquasecurity/trivy/trivy"
    echo "  - Windows: choco install trivy"
    echo "For detailed instructions, visit: https://aquasecurity.github.io/trivy/"
    exit 1
fi

echo "[1/3] Scanning Repository Filesystem..."
trivy fs --severity CRITICAL,HIGH .

echo ""
echo "[2/3] Scanning Frontend Container Image..."
if docker image inspect aio-soc-frontend:latest &> /dev/null; then
    trivy image --severity CRITICAL,HIGH aio-soc-frontend:latest
else
    echo "Skipping: aio-soc-frontend:latest image not found. Build it with 'docker build -t aio-soc-frontend:latest -f docker/Dockerfile.frontend .'"
fi

echo ""
echo "[3/3] Scanning Backend Container Image..."
if docker image inspect aio-soc-backend:latest &> /dev/null; then
    trivy image --severity CRITICAL,HIGH aio-soc-backend:latest
else
    echo "Skipping: aio-soc-backend:latest image not found. Build it with 'docker build -t aio-soc-backend:latest -f docker/Dockerfile.backend .'"
fi

echo "========================================="
echo "           Scan Completed                "
echo "========================================="
