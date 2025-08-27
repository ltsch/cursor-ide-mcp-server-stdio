#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the current working directory to determine which project we're in
const currentDir = process.cwd();
const homeDir = process.env.HOME || process.env.USERPROFILE;

// Find the cursor-mcp-server project directory (where this script is located)
function findCursorMCPServerDir() {
  const dirParts = currentDir.split(path.sep);
  for (let i = dirParts.length - 1; i >= 0; i--) {
    const potentialPath = dirParts.slice(0, i + 1).join(path.sep);
    if (potentialPath.startsWith(homeDir)) {
      const projectName = path.basename(potentialPath);
      // Check if this is the cursor-mcp-server project
      const packageJsonPath = path.join(potentialPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.dependencies && packageJson.dependencies['@modelcontextprotocol/sdk']) {
            return {
              projectName,
              projectPath: potentialPath,
              rulesPath: path.join(potentialPath, '.cursor', 'rules')
            };
          }
        } catch (err) {
          // Continue searching if package.json is invalid
        }
      }
    }
  }
  return null;
}

// Find which project directory we're in
function findProjectDir() {
  const dirParts = currentDir.split(path.sep);
  for (let i = dirParts.length - 1; i >= 0; i--) {
    const potentialProjectPath = dirParts.slice(0, i + 1).join(path.sep);
    if (potentialProjectPath.startsWith(homeDir)) {
      const projectName = path.basename(potentialProjectPath);
      const rulesPath = path.join(potentialProjectPath, '.cursor', 'rules');
      
      return {
        projectName,
        projectPath: potentialProjectPath,
        rulesPath
      };
    }
  }
  return null;
}

// Setup MCP configuration if needed
function setupMCPConfiguration(project) {
  const { projectName, projectPath } = project;
  const mcpConfigPath = path.join(projectPath, '.cursor', 'mcp.json');
  
  // Find the cursor-mcp-server project to get the server path
  const cursorMCPServer = findCursorMCPServerDir();
  if (!cursorMCPServer) {
    console.warn(`⚠️  Could not find cursor-mcp-server project directory`);
    return;
  }
  
  const serverScriptPath = path.join(cursorMCPServer.projectPath, 'cursor_mcp_server.js');
  
  // Create .cursor directory if it doesn't exist
  const cursorDir = path.dirname(mcpConfigPath);
  if (!fs.existsSync(cursorDir)) {
    console.log(`📁 Creating .cursor directory for ${projectName}...`);
    fs.mkdirSync(cursorDir, { recursive: true });
  }
  
  let mcpConfig = { mcpServers: {} };
  let configExists = false;
  
  // Check if mcp.json already exists
  if (fs.existsSync(mcpConfigPath)) {
    try {
      mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      configExists = true;
      console.log(`📄 Found existing MCP configuration in ${projectName}`);
    } catch (err) {
      console.warn(`⚠️  Could not parse existing mcp.json: ${err.message}`);
      mcpConfig = { mcpServers: {} };
    }
  }
  
  // Check if our server is already configured
  const serverName = 'cursor-mcp-server';
  if (mcpConfig.mcpServers && mcpConfig.mcpServers[serverName]) {
    console.log(`✅ MCP server already configured in ${projectName}`);
    return;
  }
  
  // Add our server configuration
  if (!mcpConfig.mcpServers) {
    mcpConfig.mcpServers = {};
  }
  
  mcpConfig.mcpServers[serverName] = {
    command: 'node',
    args: [serverScriptPath],
    env: {
      NODE_PATH: path.join(cursorMCPServer.projectPath, 'node_modules')
    }
  };
  
  // Write the configuration
  try {
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    if (configExists) {
      console.log(`✅ Added MCP server to existing configuration in ${projectName}`);
    } else {
      console.log(`✅ Created MCP configuration for ${projectName}`);
    }
  } catch (err) {
    console.error(`❌ Failed to write MCP configuration: ${err.message}`);
  }
}

// Setup project rules by copying from template if they don't exist
function setupProjectRules(project) {
  const { projectName, rulesPath } = project;
  
  // Create .cursor/rules directory if it doesn't exist
  if (!fs.existsSync(rulesPath)) {
    console.log(`📁 Creating .cursor/rules directory for ${projectName}...`);
    fs.mkdirSync(rulesPath, { recursive: true });
  }
  
  // Find the MCP server home directory (where this script is located)
  const mcpServerHome = __dirname;
  const templateRulesPath = path.join(mcpServerHome, '.cursor', 'rules');
  
  // Check if template rules directory exists
  if (!fs.existsSync(templateRulesPath)) {
    console.warn(`⚠️  Template rules directory not found: ${templateRulesPath}`);
    console.warn(`   Make sure the MCP server home directory has .cursor/rules/ directory`);
    return;
  }
  
  console.log(`📄 Setting up rule files in ${projectName} from MCP server home: ${mcpServerHome}...`);
  
  // Get all template rule files
  const templateFiles = fs.readdirSync(templateRulesPath).filter(file => file.endsWith('.mdc'));
  
  if (templateFiles.length === 0) {
    console.warn(`⚠️  No template .mdc files found in: ${templateRulesPath}`);
    return;
  }
  
  let copiedFiles = [];
  let skippedFiles = [];
  
  // Copy each template file if it doesn't exist in the current project
  for (const filename of templateFiles) {
    const templatePath = path.join(templateRulesPath, filename);
    const targetPath = path.join(rulesPath, filename);
    
    if (fs.existsSync(targetPath)) {
      console.log(`   ⏭️  Skipping ${filename} (already exists)`);
      skippedFiles.push(filename);
    } else {
      try {
        console.log(`   📝 Copying ${filename}...`);
        
        // Read template content
        let content = fs.readFileSync(templatePath, 'utf8');
        
        // Replace project name placeholders in the content
        content = content.replace(/\$\{projectName\}/g, projectName);
        content = content.replace(/cursor-ide-mcp-server-stdio/g, projectName);
        content = content.replace(/cursor-mcp-server/g, projectName);
        
        // Write to target project
        fs.writeFileSync(targetPath, content);
        copiedFiles.push(filename);
      } catch (error) {
        console.warn(`   ⚠️  Failed to copy ${filename}: ${error.message}`);
      }
    }
  }
  
  // Summary
  if (copiedFiles.length > 0) {
    console.log(`✅ Copied ${copiedFiles.length} new rule file(s) to ${projectName}:`);
    copiedFiles.forEach(file => console.log(`   📄 ${file}`));
  }
  
  if (skippedFiles.length > 0) {
    console.log(`ℹ️  Skipped ${skippedFiles.length} existing rule file(s):`);
    skippedFiles.forEach(file => console.log(`   📄 ${file}`));
  }
  
  // List all available rule files in the project
  const allRuleFiles = fs.readdirSync(rulesPath).filter(file => file.endsWith('.mdc'));
  if (allRuleFiles.length > 0) {
    console.log(`📋 Available rule files in ${projectName}:`);
    allRuleFiles.forEach(file => console.log(`   📄 ${file}`));
  }
}

// File watching functionality for automatic reloading
function setupFileWatching(project) {
  const { rulesPath } = project;
  console.log(`👀 Setting up file watching for automatic rule reloading...`);
  
  // Try different file watching strategies
  let watcher = null;
  
  // Strategy 1: Try recursive watching first
  try {
    watcher = fs.watch(rulesPath, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.mdc')) {
        console.log(`🔄 Rule file changed: ${filename} (${eventType})`);
        console.log(`💡 Restart Cursor IDE to reload the updated rules`);
        const filePath = path.join(rulesPath, filename);
        try {
          const stats = fs.statSync(filePath);
          console.log(`📊 File size: ${stats.size} bytes, Last modified: ${stats.mtime}`);
        } catch (err) {
          console.log(`⚠️  Could not get file stats: ${err.message}`);
        }
      }
    });
    
    console.log(`✅ Recursive file watching enabled`);
    return setupWatcherCleanup(watcher);
  } catch (err) {
    if (err.code === 'ERR_FEATURE_UNAVAILABLE_ON_PLATFORM') {
      console.warn(`⚠️  Recursive file watching not available, trying alternative method...`);
    } else {
      console.warn(`⚠️  Recursive file watching failed: ${err.message}, trying alternative method...`);
    }
  }
  
  // Strategy 2: Watch individual files + directory for new files
  try {
    let ruleFiles = fs.readdirSync(rulesPath).filter(file => file.endsWith('.mdc'));
    if (ruleFiles.length === 0) {
      console.warn(`⚠️  No .mdc files found to watch`);
      return null;
    }
    
    console.log(`📁 Watching ${ruleFiles.length} individual rule files...`);
    
    const watchers = new Map(); // Track watchers by filename
    
    // Function to add a new file watcher
    const addFileWatcher = (filename) => {
      if (watchers.has(filename)) return; // Already watching
      
      const filePath = path.join(rulesPath, filename);
      try {
        const watcher = fs.watch(filePath, (eventType) => {
          console.log(`🔄 Rule file changed: ${filename} (${eventType})`);
          console.log(`💡 Restart Cursor IDE to reload the updated rules`);
          try {
            const stats = fs.statSync(filePath);
            console.log(`📊 File size: ${stats.size} bytes, Last modified: ${stats.mtime}`);
          } catch (err) {
            console.log(`⚠️  Could not get file stats: ${err.message}`);
          }
        });
        watchers.set(filename, watcher);
        console.log(`👀 Added watcher for: ${filename}`);
      } catch (err) {
        console.warn(`⚠️  Could not watch file ${filename}: ${err.message}`);
      }
    };
    
    // Function to remove a file watcher
    const removeFileWatcher = (filename) => {
      const watcher = watchers.get(filename);
      if (watcher) {
        watcher.close();
        watchers.delete(filename);
        console.log(`👀 Removed watcher for: ${filename}`);
      }
    };
    
    // Add watchers for existing files
    ruleFiles.forEach(addFileWatcher);
    
    // Watch the directory for new files (non-recursive)
    try {
      const dirWatcher = fs.watch(rulesPath, (eventType, filename) => {
        if (filename && filename.endsWith('.mdc')) {
          if (eventType === 'rename') {
            // Check if file was created or deleted
            const filePath = path.join(rulesPath, filename);
            if (fs.existsSync(filePath)) {
              // File was created
              console.log(`🆕 New rule file detected: ${filename}`);
              addFileWatcher(filename);
              console.log(`💡 Restart Cursor IDE to reload the updated rules`);
            } else {
              // File was deleted
              console.log(`🗑️  Rule file deleted: ${filename}`);
              removeFileWatcher(filename);
              console.log(`💡 Restart Cursor IDE to reload the updated rules`);
            }
          }
        }
      });
      
      // Create a composite watcher that closes all watchers
      const compositeWatcher = {
        close: () => {
          dirWatcher.close();
          watchers.forEach(w => w.close());
        },
        on: (event, handler) => {
          // Forward events to directory watcher and all file watchers
          if (dirWatcher.on) {
            dirWatcher.on(event, handler);
          }
          watchers.forEach(w => {
            if (w.on) {
              w.on(event, handler);
            }
          });
        }
      };
      
      console.log(`✅ Individual file watching + directory monitoring enabled`);
      console.log(`💡 New .mdc files will be automatically detected`);
      return setupWatcherCleanup(compositeWatcher);
    } catch (dirErr) {
      console.warn(`⚠️  Directory watching failed: ${dirErr.message}`);
      console.warn(`   Only existing files will be watched (new files require restart)`);
      
      // Fallback to just individual file watching
      const compositeWatcher = {
        close: () => {
          watchers.forEach(w => w.close());
        },
        on: (event, handler) => {
          watchers.forEach(w => {
            if (w.on) {
              w.on(event, handler);
            }
          });
        }
      };
      
      console.log(`✅ Individual file watching enabled (existing files only)`);
      return setupWatcherCleanup(compositeWatcher);
    }
  } catch (err) {
    console.error(`❌ Individual file watching failed: ${err.message}`);
  }
  
  // Strategy 3: Polling fallback
  console.warn(`⚠️  File watching not available on this platform`);
  console.warn(`   File changes will not be automatically detected`);
  console.warn(`   You can still edit rule files manually and restart Cursor IDE`);
  console.warn(`   Consider using 'inotify-tools' or similar for better file watching support`);
  return null;
}

function setupWatcherCleanup(watcher) {
  if (!watcher) return null;
  
  watcher.on('error', (err) => {
    console.error(`❌ File watching error: ${err.message}`);
  });
  
  process.on('SIGINT', () => {
    console.log(`\n🛑 Shutting down file watcher...`);
    watcher.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log(`\n🛑 Shutting down file watcher...`);
    watcher.close();
    process.exit(0);
  });
  
  return watcher;
}

// Validate MCP files
function validateMCPFiles(project) {
  const { rulesPath } = project;
  const ruleFiles = fs.readdirSync(rulesPath).filter(file => file.endsWith('.mdc'));
  
  console.log(`🔍 Validating ${ruleFiles.length} MCP rule files...`);
  
  let validationErrors = [];
  
  for (const filename of ruleFiles) {
    const filePath = path.join(rulesPath, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for YAML frontmatter
    if (!content.startsWith('---')) {
      validationErrors.push(`${filename}: Missing YAML frontmatter`);
      continue;
    }
    
    // Extract YAML frontmatter
    const yamlEnd = content.indexOf('---', 3);
    if (yamlEnd === -1) {
      validationErrors.push(`${filename}: Incomplete YAML frontmatter`);
      continue;
    }
    
    const yamlContent = content.substring(3, yamlEnd);
    
    // Check for required fields
    if (!yamlContent.includes('description:')) {
      validationErrors.push(`${filename}: Missing description field`);
    }
    
    if (!yamlContent.includes('globs:')) {
      validationErrors.push(`${filename}: Missing globs field`);
    }
  }
  
  if (validationErrors.length > 0) {
    console.warn(`⚠️  MCP validation warnings:`);
    validationErrors.forEach(error => console.warn(`   ${error}`));
    console.warn(`💡 Consider fixing these issues for better MCP integration`);
  } else {
    console.log(`✅ All MCP files validated successfully`);
  }
}

// Main execution
const project = findProjectDir();

if (!project) {
  console.error('❌ No project directory found in current path');
  console.error('Current directory:', currentDir);
  console.error('');
  console.error('💡 Make sure you\'re in a project directory under your home folder');
  process.exit(1);
}

console.log(`✅ Starting MCP server for project: ${project.projectName}`);
console.log(`📁 Project path: ${project.projectPath}`);

// Setup MCP configuration first
setupMCPConfiguration(project);

// Setup project rules
setupProjectRules(project);

// Validate MCP files
validateMCPFiles(project);

// Setup file watching for automatic reloading
const fileWatcher = setupFileWatching(project);

// Create MCP server
const server = new McpServer({
  name: 'cursor-mcp-server',
  version: '1.0.0'
});

// Define tools
server.tool(
  'list_rule_files',
  'List all available rule files in the current project',
  {},
  async () => {
    const ruleFiles = fs.readdirSync(project.rulesPath).filter(file => file.endsWith('.mdc'));
    return {
      content: [
        {
          type: 'text',
          text: `Available rule files in ${project.projectName}:\n${ruleFiles.map(file => `- ${file}`).join('\n')}`
        }
      ]
    };
  }
);

// LLM-powered text summarization
server.tool(
  'summarize_text',
  'Summarize any text using the connected AI model',
  {
    text: z.string().describe('Text to summarize'),
    maxLength: z.number().optional().describe('Maximum length of summary (default: 500)')
  },
  async ({ text, maxLength = 500 }) => {
    try {
      const response = await server.server.createMessage({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please provide a concise summary of the following text (maximum ${maxLength} characters):\n\n${text}`
            }
          }
        ],
        maxTokens: maxLength
      });
      
      return {
        content: [
          {
            type: 'text',
            text: response.content.type === 'text' ? response.content.text : 'Unable to generate summary'
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Summarization failed: ${error.message}`
          }
        ]
      };
    }
  }
);

// LLM-powered rule analysis and suggestions
server.tool(
  'analyze_rule_file',
  'Analyze a rule file and provide suggestions for improvement using AI',
  {
    filename: z.string().describe('Name of the rule file to analyze (e.g., "01-critical-safety.mdc")')
  },
  async ({ filename }) => {
    const filePath = path.join(project.rulesPath, filename);
    if (!fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Rule file "${filename}" not found in ${project.projectName}`
          }
        ]
      };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    try {
      const response = await server.server.createMessage({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please analyze this MCP rule file and provide suggestions for improvement. Focus on:
1. YAML frontmatter completeness and correctness
2. Rule clarity and organization
3. Coverage and comprehensiveness
4. Best practices adherence

Here's the rule file content:

${content}

Please provide a structured analysis with specific recommendations.`
            }
          }
        ],
        maxTokens: 1000
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `## Analysis of ${filename}\n\n${response.content.type === 'text' ? response.content.text : 'Unable to analyze rule file'}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Analysis failed: ${error.message}`
          }
        ]
      };
    }
  }
);

// AI-powered rule generation
server.tool(
  'generate_rule_file',
  'Generate a new rule file using AI based on a description',
  {
    filename: z.string().describe('Name of the rule file to create (e.g., "06-custom-rules.mdc")'),
    description: z.string().describe('Description of what this rule file should contain'),
    category: z.string().optional().describe('Category of rules (e.g., "safety", "development", "testing")'),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional().describe('Priority level')
  },
  async ({ filename, description, category = 'development', priority = 'medium' }) => {
    const filePath = path.join(project.rulesPath, filename);
    
    if (fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Rule file "${filename}" already exists in ${project.projectName}`
          }
        ]
      };
    }
    
    try {
      const response = await server.server.createMessage({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a complete MCP rule file with the following requirements:

Filename: ${filename}
Description: ${description}
Category: ${category}
Priority: ${priority}

The rule file should:
1. Start with proper YAML frontmatter including description, globs, alwaysApply, priority, and tags
2. Contain comprehensive, well-organized rules
3. Follow MCP best practices
4. Be specific and actionable
5. Include examples where appropriate

Generate the complete file content including YAML frontmatter and markdown content.`
            }
          }
        ],
        maxTokens: 2000
      });
      
      const generatedContent = response.content.type === 'text' ? response.content.text : 'Unable to generate rule file';
      fs.writeFileSync(filePath, generatedContent);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Generated rule file "${filename}" in ${project.projectName}\n\nContent:\n\n${generatedContent}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Rule generation failed: ${error.message}`
          }
        ]
      };
    }
  }
);

server.tool(
  'read_rule_file',
  'Read the content of a specific rule file',
  {
    filename: z.string().describe('Name of the rule file to read (e.g., "01-critical-safety.mdc")')
  },
  async ({ filename }) => {
    const filePath = path.join(project.rulesPath, filename);
    if (!fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Rule file "${filename}" not found in ${project.projectName}`
          }
        ]
      };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      content: [
        {
          type: 'text',
          text: `Content of ${filename}:\n\n${content}`
        }
      ]
    };
  }
);

server.tool(
  'create_rule_file',
  'Create a new rule file with proper YAML frontmatter',
  {
    filename: z.string().describe('Name of the rule file to create (e.g., "06-custom-rules.mdc")'),
    description: z.string().describe('Description of what this rule file contains'),
    globs: z.array(z.string()).describe('File patterns this rule applies to (e.g., ["**/*.py", "**/*.js"])'),
    content: z.string().describe('The markdown content of the rule file')
  },
  async ({ filename, description, globs, content }) => {
    const filePath = path.join(project.rulesPath, filename);
    
    if (fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Rule file "${filename}" already exists in ${project.projectName}`
          }
        ]
      };
    }
    
    const yamlFrontmatter = `---
description: "${description}"
globs: ${JSON.stringify(globs)}
alwaysApply: true
priority: medium
tags: ["custom"]
---

`;
    
    const fullContent = yamlFrontmatter + content;
    fs.writeFileSync(filePath, fullContent);
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ Created rule file "${filename}" in ${project.projectName}`
        }
      ]
    };
  }
);

server.tool(
  'list_project_files',
  'List files in the current project directory',
  {
    directory: z.string().optional().describe('Directory to list (defaults to project root)')
  },
  async ({ directory = '.' }) => {
    const targetPath = path.join(project.projectPath, directory);
    
    if (!fs.existsSync(targetPath)) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Directory "${directory}" not found in ${project.projectName}`
          }
        ]
      };
    }
    
    const items = fs.readdirSync(targetPath);
    const files = [];
    const dirs = [];
    
    for (const item of items) {
      const itemPath = path.join(targetPath, item);
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        dirs.push(item + '/');
      } else {
        files.push(item);
      }
    }
    
    const result = `Files in ${directory}:\n\nDirectories:\n${dirs.map(dir => `- ${dir}`).join('\n')}\n\nFiles:\n${files.map(file => `- ${file}`).join('\n')}`;
    
    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    };
  }
);

server.tool(
  'read_project_file',
  'Read the content of a file in the current project',
  {
    filepath: z.string().describe('Path to the file relative to project root (e.g., "src/main.js")')
  },
  async ({ filepath }) => {
    const fullPath = path.join(project.projectPath, filepath);
    
    if (!fs.existsSync(fullPath)) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ File "${filepath}" not found in ${project.projectName}`
          }
        ]
      };
    }
    
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ "${filepath}" is not a file in ${project.projectName}`
          }
        ]
      };
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    return {
      content: [
        {
          type: 'text',
          text: `Content of ${filepath}:\n\n${content}`
        }
      ]
    };
  }
);

server.tool(
  'check_file_watching',
  'Check the status of file watching for rule files',
  {},
  async () => {
    const ruleFiles = fs.readdirSync(project.rulesPath).filter(file => file.endsWith('.mdc'));
    const watchingStatus = fileWatcher ? '✅ Active' : '❌ Not available';
    
    return {
      content: [
        {
          type: 'text',
          text: `File Watching Status: ${watchingStatus}\n\nWatched rule files:\n${ruleFiles.map(file => `- ${file}`).join('\n')}\n\n💡 File changes will be automatically detected and logged. Restart Cursor IDE to reload updated rules.`
        }
      ]
    };
  }
);

// Project validation and health check
server.tool(
  'validate_project',
  'Validate project structure and configuration',
  {},
  async () => {
    const validation = {
      project: {
        name: project.projectName,
        path: project.projectPath,
        exists: fs.existsSync(project.projectPath)
      },
      rules: {
        directory: project.rulesPath,
        exists: fs.existsSync(project.rulesPath),
        files: fs.existsSync(project.rulesPath) ? fs.readdirSync(project.rulesPath).filter(file => file.endsWith('.mdc')).length : 0
      },
      mcp: {
        configFile: path.join(project.projectPath, '.cursor', 'mcp.json'),
        exists: fs.existsSync(path.join(project.projectPath, '.cursor', 'mcp.json'))
      },
      fileWatching: {
        active: !!fileWatcher,
        type: fileWatcher ? 'recursive' : 'not available'
      }
    };
    
    const issues = [];
    if (!validation.project.exists) issues.push('Project directory not found');
    if (!validation.rules.exists) issues.push('Rules directory not found');
    if (!validation.mcp.exists) issues.push('MCP configuration not found');
    if (!validation.fileWatching.active) issues.push('File watching not available');
    
    const status = issues.length === 0 ? '✅ Healthy' : `⚠️  ${issues.length} issue(s) found`;
    
    return {
      content: [
        {
          type: 'text',
          text: `## Project Validation Results\n\n**Status:** ${status}\n\n${issues.length > 0 ? `**Issues:**\n${issues.map(issue => `- ${issue}`).join('\n')}\n\n` : ''}**Details:**\n\`\`\`json\n${JSON.stringify(validation, null, 2)}\n\`\`\``
        }
      ]
    };
  }
);

// Define resources
server.resource(
  'project_info',
  'Information about the current project',
  {
    name: z.string(),
    path: z.string(),
    type: z.string(),
    description: z.string().optional(),
    ruleCount: z.number(),
    mcpConfigured: z.boolean(),
    fileWatchingActive: z.boolean()
  },
  async () => ({
    name: project.projectName,
    path: project.projectPath,
    type: 'cursor-mcp-project',
    description: 'A project managed by the Cursor MCP server',
    ruleCount: fs.existsSync(project.rulesPath) ? fs.readdirSync(project.rulesPath).filter(file => file.endsWith('.mdc')).length : 0,
    mcpConfigured: fs.existsSync(path.join(project.projectPath, '.cursor', 'mcp.json')),
    fileWatchingActive: !!fileWatcher
  })
);

server.resource(
  'mcp_configuration',
  'Current MCP server configuration',
  {
    serverName: z.string(),
    version: z.string(),
    transport: z.string(),
    tools: z.array(z.string()),
    prompts: z.array(z.string()),
    resources: z.array(z.string())
  },
  async () => ({
    serverName: 'cursor-mcp-server',
    version: '1.0.0',
    transport: 'stdio',
    tools: [
      'list_rule_files',
      'read_rule_file', 
      'create_rule_file',
      'list_project_files',
      'read_project_file',
      'check_file_watching',
      'validate_project',
      'summarize_text',
      'analyze_rule_file',
      'generate_rule_file'
    ],
    prompts: ['manage_rules'],
    resources: ['project_info', 'mcp_configuration', 'available_rules']
  })
);

// Resource that surfaces rule content for LLM discovery
server.resource(
  'available_rules',
  'Available rule content and topics for AI assistance',
  {
    rules: z.array(z.object({
      filename: z.string(),
      title: z.string(),
      description: z.string(),
      priority: z.string(),
      tags: z.array(z.string()),
      topics: z.array(z.string()),
      summary: z.string()
    }))
  },
  async () => {
    const rules = [];
    
    if (fs.existsSync(project.rulesPath)) {
      const ruleFiles = fs.readdirSync(project.rulesPath).filter(file => file.endsWith('.mdc'));
      
      for (const filename of ruleFiles) {
        try {
          const filePath = path.join(project.rulesPath, filename);
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Extract title (first heading)
          const titleMatch = content.match(/^# (.+)$/m);
          const title = titleMatch ? titleMatch[1] : filename.replace('.mdc', '');
          
          // Extract description from YAML frontmatter
          const descMatch = content.match(/description:\s*(.+)$/m);
          const description = descMatch ? descMatch[1].trim() : 'No description available';
          
          // Extract priority from YAML frontmatter
          const priorityMatch = content.match(/priority:\s*(.+)$/m);
          const priority = priorityMatch ? priorityMatch[1].trim() : 'medium';
          
          // Extract tags from YAML frontmatter
          const tagsMatch = content.match(/tags:\s*\[([^\]]+)\]/);
          const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim().replace(/"/g, '')) : [];
          
          // Extract main topics from headings
          const headings = content.match(/^##\s+(.+)$/gm) || [];
          const topics = headings.map(h => h.replace(/^##\s+/, '').replace(/\*\*/g, ''));
          
          // Create a brief summary
          const summary = `Provides guidance on ${topics.slice(0, 3).join(', ')} and related best practices.`;
          
          rules.push({
            filename,
            title,
            description,
            priority,
            tags,
            topics,
            summary
          });
        } catch (error) {
          console.warn(`⚠️  Could not parse rule file ${filename}: ${error.message}`);
        }
      }
    }
    
    return { rules };
  }
);

// Define prompts
server.prompt(
  'manage_rules',
  'Manage rule files for the current project',
  {
    action: z.string().describe('Action to perform: list, read, create, analyze, generate'),
    filename: z.string().optional().describe('Name of the rule file (for read/create/analyze actions)'),
    description: z.string().optional().describe('Description for rule generation')
  },
  async ({ action, filename, description }) => {
    let message = '';
    
    switch (action) {
      case 'list':
        const ruleFiles = fs.readdirSync(project.rulesPath).filter(file => file.endsWith('.mdc'));
        message = `Available rule files in ${project.projectName}:\n${ruleFiles.map(file => `- ${file}`).join('\n')}`;
        break;
      case 'read':
        if (!filename) {
          message = 'Please provide a filename to read';
        } else {
          const filePath = path.join(project.rulesPath, filename);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            message = `Content of ${filename}:\n\n${content}`;
          } else {
            message = `❌ Rule file "${filename}" not found in ${project.projectName}`;
          }
        }
        break;
      case 'analyze':
        if (!filename) {
          message = 'Please provide a filename to analyze';
        } else {
          message = `Use the analyze_rule_file tool to analyze ${filename}`;
        }
        break;
      case 'generate':
        if (!filename || !description) {
          message = 'Please provide both filename and description for rule generation';
        } else {
          message = `Use the generate_rule_file tool to create ${filename} with description: ${description}`;
        }
        break;
      default:
        message = 'Available actions: list, read, create, analyze, generate';
    }
    
    return {
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: message
          }
        }
      ]
    };
  }
);

// Start the server
console.log(`🚀 Starting enhanced MCP server with AI-powered capabilities...`);
console.log(`📋 Available tools:`);
console.log(`   📄 Rule Management: list_rule_files, read_rule_file, create_rule_file`);
console.log(`   🔍 Project Tools: list_project_files, read_project_file, validate_project`);
console.log(`   🤖 AI-Powered: summarize_text, analyze_rule_file, generate_rule_file`);
console.log(`   👀 Monitoring: check_file_watching`);
console.log(`📋 Available resources: project_info, mcp_configuration, available_rules`);
console.log(`📋 Available prompts: manage_rules`);
console.log(`✨ Features: LLM integration, file watching, project validation, AI-powered rule generation`);

const transport = new StdioServerTransport();
await server.connect(transport);


