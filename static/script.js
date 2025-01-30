let editor;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize CodeMirror
    editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        mode: 'python',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        height: 'auto'
    });

    // File upload elements
    const fileUploadArea = document.querySelector('.file-upload-area');
    const fileInfo = document.querySelector('.file-info');
    const fileName = document.getElementById('file-name');
    const fileInput = document.getElementById('file');
    const languageSelect = document.getElementById('language');

    // Handle file selection
    function handleFileSelect(file) {
        if (file) {
            fileName.textContent = file.name;
            fileInfo.classList.add('show');
            
            // Read and display file content in the editor
            const reader = new FileReader();
            reader.onload = function(e) {
                editor.setValue(e.target.result);
            };
            reader.readAsText(file);
            
            // Auto-detect language if needed
            if (languageSelect.value === 'auto') {
                const detectedLanguage = detectLanguageFromFile(file.name);
                if (detectedLanguage) {
                    languageSelect.value = detectedLanguage;
                    editor.setOption('mode', getEditorMode(detectedLanguage));
                }
            }
        } else {
            fileName.textContent = 'No file chosen';
            fileInfo.classList.remove('show');
            editor.setValue(''); // Clear editor if no file selected
        }
    }

    // File input change handler
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });

    // Drag and drop handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, () => fileUploadArea.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, () => fileUploadArea.classList.remove('drag-over'), false);
    });

    fileUploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        handleFileSelect(files[0]);
    });

    // Content-based language detection for pasted code
    editor.on('change', () => {
        const content = editor.getValue();
        if (content.length > 10 && languageSelect.value === 'auto') {
            const detectedLanguage = detectLanguageFromContent(content);
            if (detectedLanguage) {
                languageSelect.value = detectedLanguage;
                editor.setOption('mode', getEditorMode(detectedLanguage));
            }
        }
    });

    // Form submission handler
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const resultsDiv = document.getElementById('results');
        const codeContent = editor.getValue();
        
        formData.append('language', languageSelect.value);

        // If file is uploaded, use that; otherwise use editor content
        if (fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        } else if (codeContent.trim()) {
            const blob = new Blob([codeContent], { type: 'text/plain' });
            formData.append('file', blob, `code.${languageSelect.value}`);
        } else {
            resultsDiv.innerHTML = `<div class="error">Please either upload a file or paste code</div>`;
            return;
        }
        
        try {
            resultsDiv.innerHTML = 'Analyzing...';
            
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.error) {
                resultsDiv.innerHTML = `<div class="error">Error: ${data.error}</div>`;
                return;
            }
            
            let resultsHTML = `
                <h2>Analysis Results</h2>
                <div class="analysis-grid">
                    <div class="metrics">
                        <h3>Basic Metrics</h3>
                        <p>Total Lines: ${data.total_lines}</p>
                        <p>Empty Lines: ${data.empty_lines}</p>
                        <p>Comment Lines: ${data.comment_lines}</p>
                        <p>Import Count: ${data.import_count}</p>
                    </div>
                    
                    <div class="code-structure">
                        <h3>Code Structure</h3>
                        <p>Classes: ${data.code_structure.classes}</p>
                        <p>Functions: ${data.code_structure.functions}</p>
                        <p>Methods: ${data.code_structure.methods}</p>
                        <p>Objects: ${data.code_structure.objects}</p>
                        <p>Imports: ${data.code_structure.imports}</p>
                    </div>
                </div>

                <div class="analysis-grid">
                    ${data.imports.length > 0 ? `
                        <div class="imports">
                            <h3>Imports Found</h3>
                            <ul>
                                ${data.imports.map(imp => `<li>${imp}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${data.classes.length > 0 ? `
                        <div class="classes">
                            <h3>Classes Found</h3>
                            <ul>
                                ${data.classes.map(cls => `<li>${cls}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${data.functions.length > 0 ? `
                        <div class="functions">
                            <h3>Functions Found</h3>
                            <ul>
                                ${data.functions.map(func => `<li>${func}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${data.methods.length > 0 ? `
                        <div class="methods">
                            <h3>Methods Found</h3>
                            <ul>
                                ${data.methods.map(method => `<li>${method}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${data.objects.length > 0 ? `
                        <div class="objects">
                            <h3>Objects Found</h3>
                            <ul>
                                ${data.objects.map(obj => `<li>${obj}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>

                ${data.comments.length > 0 ? `
                    <div class="comments">
                        <h3>Comments Found</h3>
                        <ul>
                            ${data.comments.map(comment => `<li>${comment}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="output">
                    <h3>Analysis Output</h3>
                    <pre>${data.output || 'No issues found'}</pre>
                </div>
            `;
            
            resultsDiv.innerHTML = resultsHTML;
        } catch (error) {
            resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    });
});

// Helper function to get editor mode
function getEditorMode(language) {
    const modeMap = {
        'python': 'python',
        'javascript': 'javascript',
        'cpp': 'text/x-c++src',
        'java': 'text/x-java',
        'ruby': 'ruby',
        'go': 'go',
        'swift': 'swift',
        'php': 'php',
        'csharp': 'text/x-csharp'
    };
    return modeMap[language] || 'text/plain';
}

// Add this function to detect language from file extension
function detectLanguageFromFile(filename) {
    const extensionMap = {
        '.py': 'python',
        '.js': 'javascript',
        '.cpp': 'cpp',
        '.hpp': 'cpp',
        '.h': 'cpp',
        '.java': 'java',
        '.rb': 'ruby',
        '.go': 'go',
        '.swift': 'swift',
        '.php': 'php',
        '.cs': 'csharp'
    };
    
    const ext = '.' + filename.split('.').pop().toLowerCase();
    return extensionMap[ext];
}

// Add this function to detect language from content
function detectLanguageFromContent(content) {
    // Implement content-based language detection logic here
    // This is a placeholder and should be replaced with actual implementation
    return null;
}
