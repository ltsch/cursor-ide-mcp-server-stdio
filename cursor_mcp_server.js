#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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
          if (packageJson.dependencies && packageJson.dependencies['@modelcontextprotocol/server-filesystem']) {
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

// Setup project rules if they don't exist
function setupProjectRules(project) {
  const { projectName, rulesPath } = project;
  
  // Create .cursor/rules directory if it doesn't exist
  if (!fs.existsSync(rulesPath)) {
    console.log(`📁 Creating .cursor/rules directory for ${projectName}...`);
    fs.mkdirSync(rulesPath, { recursive: true });
  }
  
  // Find the cursor-mcp-server project to copy rules from
  const cursorMCPServer = findCursorMCPServerDir();
  if (!cursorMCPServer) {
    console.warn(`⚠️  Could not find cursor-mcp-server project directory`);
    console.warn(`   Make sure you're running this from within the cursor-mcp-server project`);
    return;
  }
  
  const sourceRulesPath = cursorMCPServer.rulesPath;
  
  // Check if source rules directory exists
  if (!fs.existsSync(sourceRulesPath)) {
    console.warn(`⚠️  Source rules directory not found: ${sourceRulesPath}`);
    console.warn(`   Make sure the cursor-mcp-server project has .cursor/rules/ directory`);
    return;
  }
  
  // Copy all .mdc files from the cursor-mcp-server project
  console.log(`📄 Copying rules from cursor-mcp-server to ${projectName}...`);
  
  const sourceFiles = fs.readdirSync(sourceRulesPath).filter(file => file.endsWith('.mdc'));
  
  if (sourceFiles.length === 0) {
    console.warn(`⚠️  No .mdc files found in source rules directory: ${sourceRulesPath}`);
    return;
  }
  
  let copiedFiles = [];
  for (const filename of sourceFiles) {
    const sourcePath = path.join(sourceRulesPath, filename);
    const targetPath = path.join(rulesPath, filename);
    
    // Only copy if target doesn't exist (don't overwrite existing files)
    if (!fs.existsSync(targetPath)) {
      console.log(`   📝 Copying ${filename}...`);
      
      let content = fs.readFileSync(sourcePath, 'utf8');
      
      // Replace project name placeholders in the content
      content = content.replace(/\$\{projectName\}/g, projectName);
      content = content.replace(/sse-server/g, projectName);
      content = content.replace(/cursor-mdc-server/g, projectName);
      
      fs.writeFileSync(targetPath, content);
      copiedFiles.push(filename);
    } else {
      console.log(`   ⏭️  Skipping ${filename} (already exists)`);
    }
  }
  
  if (copiedFiles.length > 0) {
    console.log(`✅ Copied ${copiedFiles.length} rule file(s) to ${projectName}:`);
    copiedFiles.forEach(file => console.log(`   📄 ${file}`));
  } else {
    console.log(`ℹ️  All rule files already exist in ${projectName}`);
  }
  
  // List all available rule files
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

// Setup project rules
setupProjectRules(project);

// Validate MCP files
validateMCPFiles(project);

// Setup file watching for automatic reloading
const fileWatcher = setupFileWatching(project);

// Check if rules directory has any .mdc files
const ruleFiles = fs.readdirSync(project.rulesPath).filter(file => file.endsWith('.mdc'));
if (ruleFiles.length === 0) {
  console.warn('⚠️  Warning: No .mdc files found in rules directory');
  console.warn('   The MCP server will start but won\'t serve any rules');
} else {
  console.log(`📄 Found ${ruleFiles.length} rule file(s): ${ruleFiles.join(', ')}`);
}

console.log(`🚀 Starting filesystem MCP server...`);
console.log(`💡 Rule files will be automatically watched for changes`);
console.log(`💡 Restart Cursor IDE to reload updated rules`);

// Start the filesystem MCP server in the rules directory
const server = spawn('npx', [
  '@modelcontextprotocol/server-filesystem'
], {
  stdio: 'inherit',
  cwd: project.rulesPath
});

server.on('error', (err) => {
  console.error('❌ Failed to start MCP server:', err);
  fileWatcher.close();
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🔄 MCP server exited with code ${code}`);
  fileWatcher.close();
  process.exit(code);
});


