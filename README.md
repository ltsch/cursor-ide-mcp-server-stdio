# Cursor MCP Server

A specialized MCP (Model Context Protocol) server designed specifically for **Cursor IDE** that automatically creates and manages `.cursor/rules` directories for your projects, with **automatic file watching** for rule changes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.20.8+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org/)
[![Cursor IDE](https://img.shields.io/badge/Cursor%20IDE-Specific-orange.svg)](https://cursor.sh/)
[![Local Only](https://img.shields.io/badge/Local%20Only-Secure-brightgreen.svg)](https://modelcontextprotocol.io/)

> **Note**: This server is specifically designed for Cursor IDE and uses the `.cursor/rules` directory structure. While the MCP protocol could be adapted for other IDEs in the future, this implementation is optimized for Cursor IDE's specific requirements and file structure.

## 🔒 **Security & Architecture**

### ✅ **Local-First Design**
- **No network connectivity**: This server operates entirely locally without any network capabilities
- **File-based communication**: Uses stdio (standard input/output) for communication with Cursor IDE
- **Zero network exposure**: No ports, no HTTP servers, no external connections
- **Process isolation**: Runs as a separate process with no network access

### ✅ **Security Benefits**
- **No attack surface**: No network ports or HTTP endpoints to exploit
- **Data privacy**: All rule files and data remain on your local machine
- **No telemetry**: Zero data collection or external communication
- **Process boundaries**: Clear separation between Cursor IDE and the MCP server

### ✅ **Communication Method**
- **stdio only**: Communication via standard input/output streams
- **No TCP/UDP**: No network sockets or protocols
- **No HTTP**: No web server or API endpoints
- **Direct process communication**: Direct parent-child process communication

> **Security Note**: This server is designed with security in mind. It has no network capabilities, runs entirely locally, and communicates only through stdio with Cursor IDE. This eliminates potential security vulnerabilities associated with network services.

## 🚀 **Features**

### ✅ **Cursor IDE Integration**
- **Cursor-specific paths**: Uses `.cursor/rules` directory structure
- **Automatic rule management**: Creates `.cursor/rules` directory when Cursor IDE connects
- **File watching**: Optimized for Cursor IDE's file monitoring requirements
- **MCP validation**: Ensures compatibility with Cursor IDE's MCP implementation

### ✅ **Portable Rule Distribution**
- **Self-contained**: All rule files are included in the project itself
- **GitHub-based**: Rules are distributed via GitHub, no external dependencies
- **Complete rule set**: Copies ALL `.mdc` files from the cursor-mcp-server project
- **Project customization**: Automatically replaces project names in rule content
- **No overwrites**: Preserves existing rule files in target projects

### ✅ **Automatic Rule Management**
- Creates `.cursor/rules` directory when Cursor IDE connects
- Copies all rule files from the cursor-mcp-server project
- Customizes rule content with project-specific names
- Generates comprehensive rule templates for new projects
- Validates MCP file format compliance

### ✅ **File Watching & Auto-Reloading**
- **Watches for changes** to `.mdc` files in real-time
- **Detects new files** automatically
- **Logs file changes** with timestamps and file sizes
- **Graceful shutdown** handling

### ✅ **MCP File Validation**
- Validates YAML frontmatter structure
- Checks for required fields (`description`, `globs`)
- Provides helpful warnings for missing metadata
- Ensures proper MCP file format

## 📦 **Installation**

### From GitHub (Recommended)
```bash
# Clone the repository
git clone https://github.com/ltsch/cursor-mcp-server.git
cd cursor-mcp-server

# Run the automated installation script
./install.sh
```

### Manual Installation
If you prefer to install manually:

```bash
# Install Node.js dependencies
npm install

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start the server in your project directory
node cursor_mcp_server.js
```

### Prerequisites
- Python 3.11+ installed
- Cursor IDE configured for MCP

The installation script will:
- ✅ Install Node.js in user space (if not already installed)
- ✅ Create Python virtual environment
- ✅ Install all Python dependencies
- ✅ Install all Node.js dependencies
- ✅ Verify the installation
- ✅ Create an activation script

### Configure Cursor IDE
In Cursor IDE, go to Settings → MCP and add:
- **Name**: Cursor Rules Server
- **Command**: `node`
- **Args**: `["/path/to/cursor-mcp-server/cursor_mcp_server.js"]`

> **Important**: The server communicates with Cursor IDE via stdio only. No network configuration is required or possible.

## 📝 **Usage**

### Starting the Server
```bash
# Activate the environment (if using install.sh)
source ./activate_env.sh

# Start the MCP server
node cursor_mcp_server.js
```

### Local Operation
- **No network required**: The server operates entirely offline
- **File system access only**: Reads and writes to local `.cursor/rules` directory
- **Process communication**: Communicates with Cursor IDE via stdio
- **No external dependencies**: All operations are local file system operations

### Editing Rules
1. **Edit any `.mdc` file** in `.cursor/rules/`
2. **Save the file** - changes are detected immediately
3. **Restart Cursor IDE** to reload the rules
4. **Check server console** for change notifications

### Testing File Watching
```bash
# Run the test script to create a test rule file
node test_mcp_reload.js
```

## 🔄 **How Rule Reloading Works**

### File Change Detection
When you edit any `.mdc` file in `.cursor/rules/`:

1. **File watcher detects the change** immediately
2. **Server logs the change** with details:
   ```
   🔄 Rule file changed: general-best-practices.mdc (change)
   📊 File size: 15420 bytes, Last modified: 2024-01-15T10:30:45.123Z
   💡 Restart Cursor IDE to reload the updated rules
   ```

3. **Cursor IDE needs restart** to pick up the changes
   - The MCP server detects changes instantly
   - But Cursor IDE caches rules and needs restart to reload them

### Supported File Operations
- ✅ **File creation** - New `.mdc` files
- ✅ **File modification** - Editing existing files
- ✅ **File deletion** - Removing rule files
- ✅ **File renaming** - Changing file names

## 📁 **File Structure**

### Generated Directory Structure
```
.cursor/
└── rules/
    ├── general-best-practices.mdc    # Comprehensive development guidelines
    ├── project-specific-rules.mdc    # Project-specific guidelines
    ├── coding-standards.mdc          # Coding standards
    └── testing-guidelines.mdc        # Testing guidelines
```

### MCP File Format
Each `.mdc` file should have proper YAML frontmatter:

```markdown
---
description: Description of the rule file
globs: ["**/*.py", "**/*.js", "**/*.ts"]
alwaysApply: true
priority: critical
tags: ["best-practices", "security"]
---

# Rule Content

Your rule content goes here...
```

## 🔧 **Enhanced Features**

### MCP File Validation
The server validates each `.mdc` file for:
- ✅ YAML frontmatter presence
- ✅ Required fields (`description`, `globs`)
- ✅ Proper YAML syntax
- ✅ File format compliance

### Detailed Logging
- File change events with timestamps
- File size and modification time
- Error handling and graceful degradation
- Validation warnings and suggestions

### Error Handling
- Graceful shutdown on SIGINT/SIGTERM
- File watcher error handling
- MCP server error recovery
- Validation error reporting

## 🚨 **Troubleshooting**

### Common Issues

#### "No project directory found"
- **Cause**: Not in a project directory under your home folder
- **Solution**: Navigate to a project directory first

#### "No .mdc files found"
- **Cause**: Rules directory is empty
- **Solution**: The server will create template files automatically

#### "File watching error"
- **Cause**: File system permissions or inotify limits
- **Solution**: Check file permissions and inotify limits

#### "MCP validation warnings"
- **Cause**: Missing YAML frontmatter or required fields
- **Solution**: Add proper YAML frontmatter to rule files

#### "Could not find cursor-mcp-server project directory"
- **Cause**: Running from wrong directory
- **Solution**: Make sure you're running from within the cursor-mcp-server project

### Debugging

#### Check File Permissions
```bash
# Ensure proper permissions
ls -la .cursor/rules/
chmod 644 .cursor/rules/*.mdc
```

#### Monitor File Changes
```bash
# Watch for file changes manually
inotifywait -m -r .cursor/rules/
```

#### Check Dependencies
```bash
# Verify Node.js dependencies are installed
npm list @modelcontextprotocol/server-filesystem

# Verify Python dependencies are installed
source venv/bin/activate
pip list | grep mcp
```

#### Reinstall Dependencies
```bash
# If you encounter issues, reinstall everything
./install.sh
```

## 📋 **Best Practices**

### Rule File Management
1. **Use descriptive names** for rule files
2. **Include proper YAML frontmatter** with all required fields
3. **Organize rules logically** by category or concern
4. **Keep rules focused** on specific areas (security, testing, etc.)

### Workflow Integration
1. **Edit rules** in your preferred editor
2. **Save files** - changes are detected automatically
3. **Restart Cursor IDE** to reload rules
4. **Verify changes** by asking the AI about the rules

### Testing Changes
1. **Use the test script** to create test files
2. **Edit files** to test change detection
3. **Monitor server logs** for change notifications
4. **Restart Cursor IDE** to verify rule updates

## 🚀 **Advanced Configuration**

### Customizing File Watching
You can modify the file watching behavior in `cursor_mcp_server.js`:

```javascript
// Watch for specific file types
const watcher = fs.watch(rulesPath, { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith('.mdc')) {
    // Handle .mdc file changes
  }
});
```

### Extending Validation
Add custom validation rules:

```javascript
// Add custom validation checks
if (!yamlContent.includes('priority:')) {
  validationErrors.push(`${filename}: Missing priority field`);
}
```

## 📈 **Performance Considerations**

### Optimization Tips
- **File watching** uses minimal system resources
- **Validation** runs only on startup and file changes
- **Logging** is lightweight and non-blocking
- **Graceful shutdown** ensures clean resource cleanup

### Monitoring
- Monitor file change frequency
- Check for validation errors
- Review server logs for performance issues
- Ensure proper error handling

## 🔮 **Future Enhancements**

### Planned Features
- **Hot reloading** without Cursor IDE restart
- **Rule file templates** for common patterns
- **Rule conflict resolution** for overlapping globs
- **Performance metrics** and monitoring
- **Rule file backup** and versioning

### Potential Improvements
- **WebSocket notifications** for real-time updates
- **Rule file synchronization** across projects
- **Advanced validation** with custom schemas
- **Rule file import/export** functionality
- **Multi-IDE support** (future expansion)

> **Security Note**: All future enhancements will maintain the local-only, stdio-based architecture. No network capabilities will be added to preserve the security model.

## 📚 **Project Structure**

```
cursor-mcp-server/
├── install.sh                # Automated installation script
├── activate_env.sh           # Environment activation script
├── cursor_mcp_server.js      # Enhanced Node.js server
├── package.json             # Node.js dependencies
├── package-lock.json        # Node.js lock file
├── requirements.txt         # Python dependencies
├── .gitignore              # Git ignore rules
├── README.md              # This file
├── venv/                   # Python virtual environment (not in git)
├── node_modules/           # Node.js dependencies (not in git)
└── .cursor/
    └── rules/             # Rule files (in git)
        ├── general-best-practices.mdc
        ├── project-specific-rules.mdc
        ├── coding-standards.mdc
        └── testing-guidelines.mdc
```

## 🎯 **Summary**

### Key Benefits
✅ **Cursor IDE optimized** with `.cursor/rules` integration  
✅ **Local-only operation** with zero network connectivity  
✅ **Secure stdio communication** with Cursor IDE  
✅ **Portable rule distribution** via GitHub  
✅ **Complete rule set** with all MDC files included  
✅ **Automatic rule management** with file watching  
✅ **Real-time change detection** for `.mdc` files  
✅ **MCP file validation** and compliance checking  
✅ **Comprehensive logging** and error handling  
✅ **Graceful shutdown** and resource cleanup  
✅ **Easy testing** and debugging capabilities  
✅ **One-command installation** with `./install.sh`

### Dependencies
- **Node.js** - Runtime environment for the MCP server
- **@modelcontextprotocol/server-filesystem** - MCP filesystem server
- **Python 3.11+** - For additional MCP tools and utilities
- **mcp>=1.13.1** - Python MCP library (installed in venv)

### Cursor IDE Specific Features
- **`.cursor/rules` directory structure** - Optimized for Cursor IDE
- **MCP protocol compliance** - Designed for Cursor IDE's MCP implementation
- **File watching integration** - Works seamlessly with Cursor IDE's file monitoring
- **Rule validation** - Ensures compatibility with Cursor IDE's rule system

### Security Features
- **No network connectivity** - Operates entirely locally
- **stdio communication only** - No HTTP, TCP, or network protocols
- **File system access only** - Reads and writes to local directories
- **Process isolation** - Clear boundaries between Cursor IDE and server
- **Zero telemetry** - No data collection or external communication

### Portability Features
- **Self-contained** - All rule files included in the project
- **GitHub distribution** - Rules distributed via version control
- **Complete rule set** - All MDC files copied to new projects
- **Project customization** - Automatic name replacement in rule content
- **No external dependencies** - Rules come from the project itself

**Remember**: While the server detects changes instantly, you still need to restart Cursor IDE to reload the updated rules in the AI assistant.

---

**Star this repository if you find it helpful! ⭐**
