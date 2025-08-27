#!/bin/bash
# Enhanced MCP Server Environment Activation Script

echo "🚀 Activating Enhanced MCP Server Environment"
echo "============================================="



# Add user bin to PATH if needed
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    export PATH="$HOME/.local/bin:$PATH"
    echo "✅ Added user bin to PATH"
fi

echo "✅ Environment activated successfully"
echo ""
echo "Available commands:"
echo "  node cursor_mcp_server.js  - Start the MCP server"
echo "  npm run inspector          - Test with MCP Inspector"
echo ""
