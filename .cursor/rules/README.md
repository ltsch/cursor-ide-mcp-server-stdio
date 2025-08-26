# MDC Rules - Cursor MCP Server

## 📋 **Overview**

This directory contains the consolidated MDC (Model Context Protocol) rules for the Cursor MCP Server project. The rules provide comprehensive guidelines for AI-assisted development, following MCP best practices and incorporating lessons learned from successful projects.

## 🏗️ **Structure**

### **01-critical-safety.mdc** (Critical Priority)
- **Purpose**: Essential safety protocols and security guidelines
- **Content**: Never destroy work rules, security best practices, project protection
- **Scope**: All files (`**/*.py`, `**/*.js`, `**/*.ts`, `**/*.java`, `**/*.go`, `**/*.rs`)
- **Priority**: Critical - Always applied

### **02-development-best-practices.mdc** (High Priority)
- **Purpose**: Universal development guidelines and tool usage
- **Content**: Tool usage, architecture principles, file organization, systematic approaches
- **Scope**: All code files (`**/*.py`, `**/*.js`, `**/*.ts`, `**/*.java`, `**/*.go`, `**/*.rs`)
- **Priority**: High - Always applied

### **03-testing-best-practices.mdc** (High Priority)
- **Purpose**: Comprehensive testing guidelines and patterns
- **Content**: Testing requirements, validation, test architecture, real data testing
- **Scope**: Test files and application code (`tests/**/*.py`, `tests/**/*.js`, `**/*.test.js`, `**/*.spec.js`)
- **Priority**: High - Always applied

### **04-project-context.mdc** (Critical Priority)
- **Purpose**: Essential project context and lessons learned
- **Content**: Project status, critical lessons, success factors, emergency procedures
- **Scope**: Application, tests, and documentation (`**/*.py`, `**/*.js`, `**/*.md`)
- **Priority**: Critical - Always applied

### **05-mdc-file-management.mdc** (Critical Priority)
- **Purpose**: Rules for creating and managing MDC rule files correctly
- **Content**: YAML frontmatter requirements, validation, file structure, common mistakes
- **Scope**: All MDC files (`**/*.mdc`)
- **Priority**: Critical - Always applied

## 🎯 **Usage Guidelines**

### **For AI Assistants**
1. **Start with Critical Files**: Always apply 01 and 04 first
2. **Add Development Practices**: Apply 02 for general development tasks
3. **Include Testing**: Apply 03 for any testing-related work
4. **Follow Priority Order**: Critical → High → Medium → Low

### **For Developers**
1. **Read 04-project-context.mdc** first to understand the project
2. **Follow 01-critical-safety.mdc** for all operations
3. **Use 02-development-best-practices.mdc** for coding standards
4. **Reference 03-testing-best-practices.mdc** for testing

### **File Naming Convention**
- **01-**: Critical safety and security (highest priority)
- **02-**: Development practices and tools
- **03-**: Testing and validation
- **04-**: Project context and memory
- **05-**: MDC file management and rules

## 🚨 **Critical Rules Summary**

### **Never Do These**
1. **NEVER destroy valuable work** - always pause and think before destructive operations
2. **NEVER write bad code when tools exist** - use grep, awk, sed, black, flake8, etc.
3. **NEVER guess at problems** - use tools to understand the issue first
4. **NEVER create interdependent tests** - each test must be independent
5. **NEVER skip error testing** - always test failure scenarios
6. **NEVER place temp files in project root** - use designated temp directory
7. **NEVER assume it works** - always test with real data
8. **NEVER skip documentation** - document purpose and behavior
9. **NEVER ignore performance** - test response times and resource usage
10. **NEVER skip security validation** - always validate inputs and protect data

### **Always Do These**
1. **ALWAYS use systematic approaches** - identify all dependencies before major changes
2. **ALWAYS test frequently** - after every significant change
3. **ALWAYS clean up temporary files** - remove them after use
4. **ALWAYS handle errors gracefully** - provide meaningful error messages
5. **ALWAYS document decisions** - especially painful lessons learned
6. **ALWAYS use proper isolation** - prevent data leakage between components
7. **ALWAYS verify assumptions** - test with real data, not just mocks
8. **ALWAYS have a rollback plan** - be prepared to revert changes
9. **ALWAYS validate inputs** - never trust external data
10. **ALWAYS review code** - use systematic review process
11. **ALWAYS use existing tools** - leverage grep, awk, sed, black, flake8, py_compile, etc.
12. **ALWAYS understand the problem** - research before writing code

## 🔧 **Maintenance**

### **When to Update Rules**
1. **New Lessons Learned**: Add to appropriate file based on category
2. **Project Status Changes**: Update 04-project-context.mdc
3. **New Best Practices**: Update 02-development-best-practices.mdc
4. **Testing Improvements**: Update 03-testing-best-practices.mdc
5. **Security Updates**: Update 01-critical-safety.mdc

### **File Update Guidelines**
1. **Maintain Priority Levels**: Don't change critical/high priorities without justification
2. **Keep Scoping Specific**: Don't expand glob patterns unnecessarily
3. **Preserve Structure**: Follow the established format and organization
4. **Update This README**: Document any structural changes

---

**Last Updated**: December 19, 2024
**Consolidation Version**: 1.0
**Status**: Complete - All rules consolidated and organized
