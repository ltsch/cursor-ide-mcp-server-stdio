#!/bin/bash
# Enhanced MCP Server Environment Activation Script

echo "🚀 Activating Enhanced MCP Server Environment"
echo "============================================="

# Activate Python virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Python virtual environment activated"
else
    echo "❌ Python virtual environment not found"
    exit 1
fi

# Add user bin to PATH if needed
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    export PATH="$HOME/.local/bin:$PATH"
    echo "✅ Added user bin to PATH"
fi

echo "✅ Environment activated successfully"
echo ""
echo "Available commands:"
echo "  node cursor_mcp_server.js  - Start the MCP server"
echo "  node test_mcp_reload.js    - Test file watching"
echo "  python -c 'import mcp'     - Test MCP library"
echo ""
