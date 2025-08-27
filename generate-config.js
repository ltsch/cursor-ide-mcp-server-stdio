#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the current working directory
const currentDir = process.cwd();
const homeDir = process.env.HOME || process.env.USERPROFILE;

// Find where this script is located (the cursor-mcp-server project)
const scriptDir = __dirname;
const scriptName = path.basename(__filename);

// Check if we're in the cursor-mcp-server project itself
const isInMCPServerProject = scriptDir === currentDir;

console.log('🚀 Cursor IDE MCP Server Configuration Generator');
console.log('================================================');
console.log('');

if (isInMCPServerProject) {
  console.log('📍 You are in the cursor-mcp-server project directory');
  console.log('📁 Current directory:', currentDir);
  console.log('');
  console.log('⚠️  WARNING: Do not create mcp.json in this directory!');
  console.log('   This would cause Cursor IDE to load the MCP server twice.');
  console.log('');
  console.log('💡 To use this MCP server:');
  console.log('   1. Navigate to your actual project directory');
  console.log('   2. Run this generator from there');
  console.log('');
  console.log('🔧 Example:');
console.log('   cd ~/my-actual-project');
console.log(`   node ${path.join(scriptDir, scriptName)}`);
console.log('');
console.log('💡 Important: Update the path in the generated configuration');
console.log('   to match where you cloned the cursor-ide-mcp-server-stdio repository');
  console.log('');
  console.log('📋 Available commands:');
  console.log('   # Test the MCP server directly');
  console.log(`   node ${path.join(scriptDir, 'cursor_mcp_server.js')}`);
  console.log('');
  console.log('   # Run MCP Inspector for testing');
  console.log(`   cd ${scriptDir} && npm run inspector`);
  
} else {
  console.log('📍 You are in a different project directory');
  console.log('📁 Current directory:', currentDir);
  console.log('📁 MCP Server location:', scriptDir);
  console.log('');
  
  // Check if cursor-mcp-server exists
  const mcpServerPath = path.join(scriptDir, 'cursor_mcp_server.js');
  if (!fs.existsSync(mcpServerPath)) {
    console.error('❌ Error: cursor_mcp_server.js not found in:', scriptDir);
    console.error('   Make sure you cloned the cursor-ide-mcp-server-stdio repository');
    process.exit(1);
  }
  
  // Generate configuration for manual setup
  const mcpConfig = {
    "cursor-mcp-server": {
      command: "node",
      args: [mcpServerPath],
      env: {
        NODE_PATH: path.join(scriptDir, "node_modules")
      }
    }
  };
  
  console.log('🔧 MCP Server Configuration:');
  console.log('============================');
  console.log('');
  console.log('📋 Add this to your Cursor IDE MCP configuration:');
console.log('');
console.log('1. Open Cursor IDE Settings');
console.log('2. Go to "MCP & Integrations"');
console.log('3. Add a new MCP server with these settings:');
console.log('');
console.log('**Server Name:** cursor-mcp-server');
console.log('**Command:** node');
console.log(`**Arguments:** ${mcpServerPath}`);
console.log(`**Environment Variables:**`);
console.log(`   NODE_PATH = ${path.join(scriptDir, "node_modules")}`);
console.log('');
console.log('⚠️  IMPORTANT: Update the paths above to match your environment!');
console.log(`   Current paths are based on: ${scriptDir}`);
console.log('   Make sure these paths point to where you cloned the repository');
  console.log('');
  console.log('📄 Or add this to your .cursor/mcp.json file:');
console.log(JSON.stringify({ mcpServers: { "cursor-mcp-server": mcpConfig["cursor-mcp-server"] } }, null, 2));
console.log('');
console.log('⚠️  IMPORTANT: Update the paths in the JSON above to match your environment!');
console.log(`   Current paths are based on: ${scriptDir}`);
console.log('   Make sure these paths point to where you cloned the repository');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Add the MCP server configuration to Cursor IDE');
  console.log('   2. Restart Cursor IDE to load the MCP server');
  console.log('   3. Check MCP & Integrations settings to verify connection');
  console.log('   4. The server will automatically set up rule files');
  console.log('');
  console.log('🔍 Verification:');
  console.log(`   MCP Server script: ${mcpServerPath} ${fs.existsSync(mcpServerPath) ? '✅' : '❌'}`);
  console.log(`   Node modules: ${path.join(scriptDir, "node_modules")} ${fs.existsSync(path.join(scriptDir, "node_modules")) ? '✅' : '❌'}`);
}

console.log('');
console.log('🎯 Quick Setup Commands:');
console.log('   # Generate config for current project');
console.log(`   node ${path.join(scriptDir, scriptName)}`);
console.log('');
console.log('   # Test the MCP server');
console.log(`   node ${path.join(scriptDir, 'cursor_mcp_server.js')}`);
console.log('');
console.log('   # Run MCP Inspector for testing');
console.log(`   cd ${scriptDir} && npm run inspector`);
