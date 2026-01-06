# Modern Studio App Builder - UI Template

I'll create a comprehensive UI template for a modern studio app builder with three panels as described. This will focus on structure, layout, and visual design with minimal functional logic.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus Studio - AI App Builder</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
        :root {
            --primary-color: #6366f1;
            --primary-dark: #4f46e5;
            --sidebar-bg: #1e293b;
            --sidebar-active: #334155;
            --canvas-bg: #f8fafc;
            --chat-bg: #ffffff;
            --border-color: #e2e8f0;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --text-light: #94a3b8;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --danger-color: #ef4444;
        }
        
        body {
            display: flex;
            height: 100vh;
            overflow: hidden;
            color: var(--text-primary);
            background-color: var(--canvas-bg);
        }
        
        /* Left Panel - Settings/Menu/File Manager */
        .left-panel {
            width: 280px;
            background-color: var(--sidebar-bg);
            color: white;
            display: flex;
            flex-direction: column;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
            z-index: 10;
        }
        
        .logo-container {
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .logo {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
        }
        
        .app-name {
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(to right, #fff, #c7d2fe);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .menu-icons {
            display: flex;
            padding: 15px;
            gap: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .menu-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--text-light);
            transition: all 0.2s ease;
        }
        
        .menu-icon:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
        }
        
        .menu-icon.active {
            background-color: var(--sidebar-active);
            color: white;
        }
        
        .panel-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        
        .panel-section {
            margin-bottom: 30px;
        }
        
        .panel-title {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-light);
            margin-bottom: 15px;
        }
        
        .file-item {
            padding: 10px 12px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 5px;
            transition: background-color 0.2s ease;
        }
        
        .file-item:hover {
            background-color: rgba(255, 255, 255, 0.05);
        }
        
        .file-item.active {
            background-color: var(--sidebar-active);
        }
        
        .file-icon {
            color: var(--text-light);
            width: 20px;
            text-align: center;
        }
        
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .setting-label {
            font-size: 14px;
            color: #e2e8f0;
        }
        
        /* Main Canvas Area */
        .main-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .header {
            height: 64px;
            background-color: white;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            flex-shrink: 0;
        }
        
        .header-title {
            font-size: 18px;
            font-weight: 600;
        }
        
        .header-actions {
            display: flex;
            gap: 12px;
        }
        
        .btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .btn-primary {
            background-color: var(--primary-color);
            color: white;
        }
        
        .btn-primary:hover {
            background-color: var(--primary-dark);
        }
        
        .btn-outline {
            background-color: transparent;
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }
        
        .btn-outline:hover {
            background-color: #f8fafc;
        }
        
        .preview-container {
            flex: 1;
            padding: 30px;
            overflow: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }
        
        .preview-header {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 20px;
            align-self: flex-start;
        }
        
        .canvas {
            width: 100%;
            max-width: 900px;
            height: 600px;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid var(--border-color);
            overflow: hidden;
            position: relative;
        }
        
        .canvas-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-light);
        }
        
        .canvas-placeholder i {
            font-size: 48px;
            margin-bottom: 20px;
            color: #cbd5e1;
        }
        
        .canvas-placeholder h3 {
            font-size: 20px;
            margin-bottom: 10px;
            color: var(--text-secondary);
        }
        
        .canvas-placeholder p {
            text-align: center;
            max-width: 400px;
            line-height: 1.5;
        }
        
        .footer {
            height: 48px;
            background-color: white;
            border-top: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            font-size: 13px;
            color: var(--text-secondary);
            flex-shrink: 0;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--success-color);
        }
        
        /* Right Panel - Chat Inference */
        .right-panel {
            width: 380px;
            background-color: var(--chat-bg);
            border-left: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            z-index: 10;
        }
        
        .chat-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .chat-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .chat-subtitle {
            font-size: 13px;
            color: var(--text-secondary);
        }
        
        .chat-history {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .message {
            max-width: 90%;
            padding: 14px;
            border-radius: 12px;
            line-height: 1.5;
            font-size: 14px;
        }
        
        .message-user {
            align-self: flex-end;
            background-color: var(--primary-color);
            color: white;
            border-bottom-right-radius: 4px;
        }
        
        .message-ai {
            align-self: flex-start;
            background-color: #f1f5f9;
            color: var(--text-primary);
            border-bottom-left-radius: 4px;
        }
        
        .chat-input-container {
            padding: 20px;
            border-top: 1px solid var(--border-color);
        }
        
        .chat-input-wrapper {
            display: flex;
            gap: 10px;
            align-items: flex-end;
        }
        
        .chat-input {
            flex: 1;
            padding: 12px 16px;
            border-radius: 10px;
            border: 1px solid var(--border-color);
            resize: none;
            font-family: inherit;
            font-size: 14px;
            line-height: 1.5;
            max-height: 120px;
            min-height: 44px;
            outline: none;
            transition: border-color 0.2s ease;
        }
        
        .chat-input:focus {
            border-color: var(--primary-color);
        }
        
        .chat-send-btn {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease;
            flex-shrink: 0;
        }
        
        .chat-send-btn:hover {
            background-color: var(--primary-dark);
        }
        
        /* Responsive adjustments */
        @media (max-width: 1200px) {
            .right-panel {
                width: 320px;
            }
        }
        
        /* Utility classes */
        .hidden {
            display: none !important;
        }
        
        .divider {
            height: 1px;
            background-color: var(--border-color);
            margin: 20px 0;
        }
        
        .toggle-switch {
            width: 40px;
            height: 20px;
            background-color: #cbd5e1;
            border-radius: 10px;
            position: relative;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .toggle-switch.active {
            background-color: var(--primary-color);
        }
        
        .toggle-switch::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: white;
            top: 2px;
            left: 2px;
            transition: transform 0.2s ease;
        }
        
        .toggle-switch.active::after {
            transform: translateX(20px);
        }
        
        .select-dropdown {
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background-color: rgba(255, 255, 255, 0.05);
            color: white;
            font-size: 14px;
            outline: none;
        }
        
        .text-muted {
            color: var(--text-light);
        }
    </style>
</head>
<body>
    <!-- Left Panel: Settings/Menu/File Manager -->
    <div class="left-panel">
        <div class="logo-container">
            <div class="logo">N</div>
            <div class="app-name">Nexus Studio</div>
        </div>
        
        <div class="menu-icons">
            <div class="menu-icon active" data-panel="files">
                <i class="fas fa-folder"></i>
            </div>
            <div class="menu-icon" data-panel="settings">
                <i class="fas fa-cog"></i>
            </div>
            <div class="menu-icon" data-panel="components">
                <i class="fas fa-cube"></i>
            </div>
            <div class="menu-icon" data-panel="pages">
                <i class="fas fa-file"></i>
            </div>
            <div class="menu-icon" data-panel="styles">
                <i class="fas fa-palette"></i>
            </div>
        </div>
        
        <!-- Files Panel (Default) -->
        <div class="panel-content" id="files-panel">
            <div class="panel-section">
                <div class="panel-title">Project Files</div>
                <div class="file-item active">
                    <div class="file-icon"><i class="fas fa-file-code"></i></div>
                    <div>app.js</div>
                </div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-file-code"></i></div>
                    <div>styles.css</div>
                </div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-file-code"></i></div>
                    <div>index.html</div>
                </div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-folder"></i></div>
                    <div>components</div>
                </div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-folder"></i></div>
                    <div>assets</div>
                </div>
            </div>
            
            <div class="panel-section">
                <div class="panel-title">Recent Projects</div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-project-diagram"></i></div>
                    <div>E-commerce Dashboard</div>
                </div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-project-diagram"></i></div>
                    <div>Portfolio Site</div>
                </div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-project-diagram"></i></div>
                    <div>Admin Panel</div>
                </div>
            </div>
        </div>
        
        <!-- Settings Panel -->
        <div class="panel-content hidden" id="settings-panel">
            <div class="panel-section">
                <div class="panel-title">Application Settings</div>
                <div class="setting-item">
                    <div class="setting-label">Dark Mode</div>
                    <div class="toggle-switch active"></div>
                </div>
                <div class="setting-item">
                    <div class="setting-label">Auto-save</div>
                    <div class="toggle-switch"></div>
                </div>
                <div class="setting-item">
                    <div class="setting-label">AI Suggestions</div>
                    <div class="toggle-switch active"></div>
                </div>
            </div>
            
            <div class="panel-section">
                <div class="panel-title">Project Settings</div>
                <div class="setting-item">
                    <div class="setting-label">Framework</div>
                    <select class="select-dropdown">
                        <option>React</option>
                        <option>Vue</option>
                        <option>Angular</option>
                        <option>Svelte</option>
                    </select>
                </div>
                <div class="setting-item">
                    <div class="setting-label">CSS Preprocessor</div>
                    <select class="select-dropdown">
                        <option>CSS</option>
                        <option>Sass</option>
                        <option>Less</option>
                        <option>Styled Components</option>
                    </select>
                </div>
            </div>
        </div>
        
        <!-- Components Panel -->
        <div class="panel-content hidden" id="components-panel">
            <div class="panel-section">
                <div class="panel-title">UI Components</div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-square"></i></div>
                    <div>Buttons</div>
                </div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-input-numeric"></i></div>
                    <div>Input Fields</div>
                </div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-table"></i></div>
                    <div>Data Tables</div>
                </div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-chart-bar"></i></div>
                    <div>Charts</div>
                </div>
                <div class="file-item">
                    <div class="file-icon"><i class="fas fa-cards"></i></div>
                    <div>Cards</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Main Area: Header, Canvas, Footer -->
    <div class="main-area">
        <div class="header">
            <div class="header-title">My App - Dashboard</div>
            <div class="header-actions">
                <button class="btn btn-outline">
                    <i class="fas fa-download"></i> Export
                </button>
                <button class="btn btn-outline">
                    <i class="fas fa-share"></i> Share
                </button>
                <button class="btn btn-primary">
                    <i class="fas fa-rocket"></i> Publish
                </button>
            </div>
        </div>
        
        <div class="preview-container">
            <div class="preview-header">Live Preview</div>
            <div class="canvas">
                <div class="canvas-placeholder">
                    <i class="fas fa-magic"></i>
                    <h3>App Builder Canvas</h3>
                    <p>Drag components here or describe your app in the chat panel to generate UI elements. This area will display a live preview of your application.</p>
                    <div style="margin-top: 30px; display: flex; gap: 10px;">
                        <button class="btn btn-primary" style="margin-top: 10px;">
                            <i class="fas fa-plus"></i> Add Component
                        </button>
                        <button class="btn btn-outline" style="margin-top: 10px;">
                            <i class="fas fa-bolt"></i> Auto-Generate
                        </button>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; font-size: 14px; color: var(--text-secondary); text-align: center; max-width: 700px;">
                <i class="fas fa-lightbulb"></i> Tip: Use the chat panel on the right to describe the app you want to build. The AI will generate components and layouts based on your description.
            </div>
        </div>
        
        <div class="footer">
            <div class="status-indicator">
                <div class="status-dot"></div>
                <span>Auto-save: <span id="save-status">All changes saved</span></span>
            </div>
            <div>
                <span>Project: <strong>dashboard-app</strong></span>
                <span style="margin-left: 20px;">Mode: <strong>Development</strong></span>
            </div>
        </div>
    </div>
    
    <!-- Right Panel: Chat Inference -->
    <div class="right-panel">
        <div class="chat-header">
            <div class="chat-title">AI App Assistant</div>
            <div class="chat-subtitle">Describe what you want to build and I'll help you create it</div>
        </div>
        
        <div class="chat-history" id="chat-history">
            <div class="message message-ai">
                Hello! I'm your AI app builder assistant. I can help you create web applications by generating code, suggesting components, and designing layouts. What would you like to build today?
            </div>
            
            <div class="message message-user">
                I need a dashboard with a navbar, sidebar, and some data charts
            </div>
            
            <div class="message message-ai">
                Great! I'll generate a dashboard layout with a navigation bar, collapsible sidebar, and chart components. I'll add placeholders for bar charts, line charts, and some summary cards. Would you like me to use any specific color scheme?
            </div>
            
            <div class="message message-user">
                Use a blue color scheme with dark sidebar
            </div>
            
            <div class="message message-ai">
                Perfect! I've generated a dashboard with a dark blue sidebar, light blue accents, and added chart components. You can now customize each element using the left panel or ask me to make further adjustments.
            </div>
        </div>
        
        <div class="chat-input-container">
            <div class="chat-input-wrapper">
                <textarea class="chat-input" id="chat-input" placeholder="Describe the app or feature you want to build..."></textarea>
                <button class="chat-send-btn" id="send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: var(--text-light); text-align: center;">
                <i class="fas fa-info-circle"></i> Press Enter to send, Shift+Enter for new line
            </div>
        </div>
    </div>

    <script>
        // Simple UI interaction for panel switching
        document.addEventListener('DOMContentLoaded', function() {
            // Panel switching logic
            const menuIcons = document.querySelectorAll('.menu-icon');
            const panelContents = document.querySelectorAll('.panel-content');
            
            menuIcons.forEach(icon => {
                icon.addEventListener('click', function() {
                    const panelId = this.getAttribute('data-panel') + '-panel';
                    
                    // Update active menu icon
                    menuIcons.forEach(icon => icon.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show selected panel, hide others
                    panelContents.forEach(panel => panel.classList.add('hidden'));
                    document.getElementById(panelId).classList.remove('hidden');
                });
            });
            
            // Chat input interaction
            const chatInput = document.getElementById('chat-input');
            const sendBtn = document.getElementById('send-btn');
            const chatHistory = document.getElementById('chat-history');
            
            function addMessage(text, isUser = true) {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${isUser ? 'message-user' : 'message-ai'}`;
                messageDiv.textContent = text;
                chatHistory.appendChild(messageDiv);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }
            
            function sendMessage() {
                const text = chatInput.value.trim();
                if (text) {
                    addMessage(text, true);
                    chatInput.value = '';
                    
                    // Simulate AI response after a delay
                    setTimeout(() => {
                        const responses = [
                            "I've updated the canvas with your requested changes.",
                            "I've generated the component based on your description. You can now customize it in the left panel.",
                            "Great idea! I've added that feature to your app. Would you like me to add anything else?",
                            "I've implemented that functionality. Check the preview to see how it looks.",
                            "Done! I've created a new component with the specifications you provided."
                        ];
                        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                        addMessage(randomResponse, false);
                    }, 1000);
                }
            }
            
            sendBtn.addEventListener('click', sendMessage);
            
            chatInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            
            // Toggle switch interaction
            const toggleSwitches = document.querySelectorAll('.toggle-switch');
            toggleSwitches.forEach(switchEl => {
                switchEl.addEventListener('click', function() {
                    this.classList.toggle('active');
                });
            });
            
            // Simulate auto-save status changes
            const saveStatus = document.getElementById('save-status');
            setInterval(() => {
                if (saveStatus.textContent === "All changes saved") {
                    saveStatus.textContent = "Saving...";
                    setTimeout(() => {
                        saveStatus.textContent = "All changes saved";
                    }, 800);
                }
            }, 10000);
        });
    </script>
</body>
</html>
```

## Design Notes for CLI Builder Implementation

This template provides a complete, polished UI for an AI-powered app builder studio with the following key features:

### 1. **Three-Panel Layout Structure**
- **Left Panel (280px)**: Settings/Menu/File Manager with static icon navigation
- **Main Area**: Contains header, canvas preview, and footer
- **Right Panel (380px)**: Chat inference interface with history

### 2. **Left Panel Functionality**
- Logo and app branding area
- Static menu icons that only control which panel content displays
- Five panel types: Files, Settings, Components, Pages, Styles
- Each panel shows appropriate content for its function

### 3. **Main Canvas Area**
- Clean header with project title and action buttons
- Large preview canvas with placeholder content
- Status footer with auto-save indicator and project info

### 4. **Right Chat Panel**
- AI assistant introduction and conversation history
- Text input with send button for new prompts
- Simulated AI responses to demonstrate interaction flow

### 5. **Visual Design System**
- Consistent color palette with CSS custom properties
- Modern, clean interface with appropriate spacing
- Interactive elements with hover and active states
- Responsive considerations for different screen sizes

### 6. **Implementation Notes for CLI Builder**
- The left panel menu icons should only toggle visibility of panel content sections
- The canvas area should render live previews of the generated app
- The chat panel should connect to an inference API for AI-generated responses
- File manager should show project structure and allow navigation
- Settings panel should control global and project-specific options
- Components panel should provide drag-and-drop UI elements
- The "never ending project builder" concept means the UI should support continuous iteration and refinement

### 7. **Suggested Next Steps for CLI Implementation**
1. Connect chat interface to an inference API (OpenAI, Claude, etc.)
2. Implement canvas rendering engine for generated components
3. Add file system integration for the file manager
4. Create component library with drag-and-drop functionality
5. Implement state management for project configuration
6. Add export functionality for generated code
7. Implement collaborative features for sharing projects

This template provides the complete visual foundation—the CLI builder would need to add the actual logic for app generation, AI integration, and project management.
