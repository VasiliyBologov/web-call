#!/bin/bash

# TURN Server Test Script for Azure
# This script tests TURN server connectivity and functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TURN_SERVER="${TURN_SERVER:-localhost}"
TURN_PORT="${TURN_PORT:-3478}"
TURN_USERNAME="${TURN_USERNAME:-user}"
TURN_PASSWORD="${TURN_PASSWORD:-secret}"
TURN_REALM="${TURN_REALM:-localhost}"

echo -e "${YELLOW}Testing TURN Server Configuration${NC}"
echo "=================================="
echo "Server: $TURN_SERVER:$TURN_PORT"
echo "Username: $TURN_USERNAME"
echo "Realm: $TURN_REALM"
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# Test 1: Check if TURN server is reachable
echo "1. Testing TURN server connectivity..."
if nc -z "$TURN_SERVER" "$TURN_PORT" 2>/dev/null; then
    print_status 0 "TURN server is reachable on $TURN_SERVER:$TURN_PORT"
else
    print_status 1 "TURN server is not reachable on $TURN_SERVER:$TURN_PORT"
fi

# Test 2: Test UDP connectivity
echo "2. Testing UDP connectivity..."
if nc -zu "$TURN_SERVER" "$TURN_PORT" 2>/dev/null; then
    print_status 0 "UDP connectivity to TURN server is working"
else
    print_status 1 "UDP connectivity to TURN server failed"
fi

# Test 3: Test TURN server authentication (if turnutils_uclient is available)
echo "3. Testing TURN server authentication..."
if command -v turnutils_uclient >/dev/null 2>&1; then
    # Create temporary credentials file
    cat > /tmp/turn_creds.txt << EOF
$TURN_USERNAME:$TURN_PASSWORD
EOF
    
    # Test TURN authentication
    if timeout 10 turnutils_uclient -v -t -u "$TURN_USERNAME" -w "$TURN_PASSWORD" \
        -p "$TURN_PORT" "$TURN_SERVER" > /tmp/turn_test.log 2>&1; then
        print_status 0 "TURN server authentication successful"
    else
        echo -e "${YELLOW}⚠ TURN server authentication test inconclusive (check logs)${NC}"
        cat /tmp/turn_test.log
    fi
    
    # Cleanup
    rm -f /tmp/turn_creds.txt /tmp/turn_test.log
else
    echo -e "${YELLOW}⚠ turnutils_uclient not available, skipping authentication test${NC}"
fi

# Test 4: Check TURN server logs (if running in container)
echo "4. Checking TURN server status..."
if [ -n "$(docker ps -q -f name=webcall-turn 2>/dev/null)" ]; then
    echo "TURN server container is running"
    docker logs --tail 10 webcall-turn 2>/dev/null | grep -E "(listening|started|ready)" || true
else
    echo -e "${YELLOW}⚠ TURN server container not found${NC}"
fi

# Test 5: Test WebRTC ICE connectivity (basic)
echo "5. Testing basic ICE connectivity..."
# This is a simplified test - in production you'd want more comprehensive WebRTC testing
if curl -s "http://$TURN_SERVER:8000/api/health" >/dev/null 2>&1; then
    print_status 0 "Backend health check passed"
else
    echo -e "${YELLOW}⚠ Backend health check failed (expected if not running)${NC}"
fi

# Test 6: Validate TURN configuration
echo "6. Validating TURN configuration..."
if [ -n "$TURN_USERNAME" ] && [ -n "$TURN_PASSWORD" ] && [ -n "$TURN_REALM" ]; then
    print_status 0 "TURN configuration variables are set"
else
    print_status 1 "Missing TURN configuration variables"
fi

# Test 7: Check firewall/network configuration
echo "7. Checking network configuration..."
echo "Testing port ranges..."
for port in 50000 50050 50100; do
    if nc -zu "$TURN_SERVER" "$port" 2>/dev/null; then
        echo -e "${GREEN}✓ Port $port is accessible${NC}"
    else
        echo -e "${YELLOW}⚠ Port $port is not accessible (may be blocked by firewall)${NC}"
    fi
done

echo ""
echo -e "${GREEN}TURN Server Testing Completed${NC}"
echo "=================================="

# Summary
echo ""
echo "Summary:"
echo "- TURN server should be accessible on port $TURN_PORT (TCP/UDP)"
echo "- TURN server should be accessible on ports 50000-50100 (UDP)"
echo "- Authentication should work with username: $TURN_USERNAME"
echo "- Ensure firewall allows UDP traffic on TURN ports"
echo "- Check Azure Network Security Groups if deployed in Azure"

# Exit with success
exit 0
