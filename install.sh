#!/bin/bash

# Enhanced MCP Server Installation Script
# This script sets up all dependencies in user space

set -e  # Exit on any error

echo "🚀 Enhanced MCP Server Installation Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Python version
check_python_version() {
    if command_exists python3; then
        python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
        required_version="3.11"
        
        if python3 -c "import sys; exit(0 if sys.version_info >= (3, 11) else 1)"; then
            print_success "Python $python_version found (>= $required_version required)"
            return 0
        else
            print_error "Python $python_version found, but $required_version+ is required"
            return 1
        fi
    else
        print_error "Python 3 not found"
        return 1
    fi
}

# Function to install Node.js in user space
install_nodejs_user() {
    print_status "Installing Node.js in user space..."
    
    # Check if Node.js is already installed
    if command_exists node; then
        node_version=$(node --version)
        print_success "Node.js $node_version already installed"
        return 0
    fi
    
    # Create user bin directory if it doesn't exist
    USER_BIN="$HOME/.local/bin"
    mkdir -p "$USER_BIN"
    
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$USER_BIN:"* ]]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
        export PATH="$HOME/.local/bin:$PATH"
        print_status "Added $USER_BIN to PATH"
    fi
    
    # Download and install Node.js
    NODE_VERSION="20.18.0"  # LTS version
    NODE_ARCH="linux-x64"
    NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${NODE_ARCH}.tar.xz"
    NODE_DIR="$HOME/.local/node-v${NODE_VERSION}-${NODE_ARCH}"
    
    print_status "Downloading Node.js $NODE_VERSION..."
    cd /tmp
    curl -L "$NODE_URL" -o "node.tar.xz"
    
    print_status "Extracting Node.js..."
    tar -xf "node.tar.xz"
    
    print_status "Installing Node.js to user space..."
    rm -rf "$NODE_DIR" 2>/dev/null || true
    mv "node-v${NODE_VERSION}-${NODE_ARCH}" "$NODE_DIR"
    
    # Create symlinks
    ln -sf "$NODE_DIR/bin/node" "$USER_BIN/node"
    ln -sf "$NODE_DIR/bin/npm" "$USER_BIN/npm"
    ln -sf "$NODE_DIR/bin/npx" "$USER_BIN/npx"
    
    # Clean up
    rm -f "node.tar.xz"
    cd - > /dev/null
    
    print_success "Node.js $NODE_VERSION installed to $NODE_DIR"
    print_status "Please restart your terminal or run: source ~/.bashrc"
}

# Function to setup Python virtual environment
setup_python_venv() {
    print_status "Setting up Python virtual environment..."
    
    # Remove existing venv if it exists
    if [ -d "venv" ]; then
        print_status "Removing existing virtual environment..."
        rm -rf venv
    fi
    
    # Create new virtual environment
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    
    # Upgrade pip
    print_status "Upgrading pip..."
    venv/bin/python -m pip install --upgrade pip
    
    # Install Python dependencies
    if [ -f "requirements.txt" ]; then
        print_status "Installing Python dependencies..."
        venv/bin/python -m pip install -r requirements.txt
        print_success "Python dependencies installed"
    else
        print_warning "requirements.txt not found, skipping Python dependencies"
    fi
}

# Function to install Node.js dependencies
install_node_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        return 1
    fi
    
    # Install dependencies
    npm install
    print_success "Node.js dependencies installed"
}

# Function to verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Check Python virtual environment
    if [ -d "venv" ]; then
        print_success "Python virtual environment created"
        
        # Test MCP import
        if venv/bin/python -c "import mcp; print('MCP library imported successfully')" 2>/dev/null; then
            print_success "MCP library working correctly"
        else
            print_error "MCP library not working correctly"
            return 1
        fi
    else
        print_error "Python virtual environment not found"
        return 1
    fi
    
    # Check Node.js
    if command_exists node; then
        node_version=$(node --version)
        print_success "Node.js $node_version available"
        
        # Check npm
        if command_exists npm; then
            npm_version=$(npm --version)
            print_success "npm $npm_version available"
        else
            print_error "npm not found"
            return 1
        fi
    else
        print_error "Node.js not found"
        return 1
    fi
    
    # Check node_modules
    if [ -d "node_modules" ]; then
        print_success "Node.js dependencies installed"
    else
        print_error "Node.js dependencies not found"
        return 1
    fi
    
    print_success "Installation verification completed successfully"
}

# Function to create activation script
create_activation_script() {
    print_status "Creating activation script..."
    
    cat > activate_env.sh << 'EOF'
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
EOF

    chmod +x activate_env.sh
    print_success "Activation script created: ./activate_env.sh"
}

# Function to display next steps
show_next_steps() {
    echo ""
    echo "🎉 Installation completed successfully!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Restart your terminal or run: source ~/.bashrc"
    echo "2. Activate the environment: source ./activate_env.sh"
    echo "3. Start the MCP server: node cursor_mcp_server.js"
    echo "4. Configure Cursor IDE to use the MCP server"
    echo ""
    echo "For more information, see README.md"
    echo ""
}

# Main installation process
main() {
    echo ""
    
    # Check Python version
    print_status "Checking Python version..."
    if ! check_python_version; then
        print_error "Python 3.11+ is required. Please install it first."
        exit 1
    fi
    
    # Install Node.js in user space
    install_nodejs_user
    
    # Setup Python virtual environment
    setup_python_venv
    
    # Install Node.js dependencies
    install_node_dependencies
    
    # Verify installation
    verify_installation
    
    # Create activation script
    create_activation_script
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@"
