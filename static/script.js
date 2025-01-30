let editor;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize CodeMirror
    editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        mode: 'python', // default mode
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        height: 'auto'
    });

    // Adjust editor height
    editor.setSize(null, 300);

    // Handle language change
    document.getElementById('language').addEventListener('change', (e) => {
        if (e.target.value !== 'auto') {
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
            editor.setOption('mode', modeMap[e.target.value] || 'text/plain');
        }
    });

    // Toggle between upload and paste
    const uploadToggle = document.getElementById('uploadToggle');
    const pasteToggle = document.getElementById('pasteToggle');
    const fileInputSection = document.getElementById('fileInputSection');
    const editorSection = document.getElementById('editorSection');

    uploadToggle.addEventListener('click', () => {
        uploadToggle.classList.add('active');
        pasteToggle.classList.remove('active');
        fileInputSection.style.display = 'block';
        editorSection.style.display = 'none';
    });

    pasteToggle.addEventListener('click', () => {
        pasteToggle.classList.add('active');
        uploadToggle.classList.remove('active');
        fileInputSection.style.display = 'none';
        editorSection.style.display = 'block';
        editor.refresh();
    });
});

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

// Update the file input change handler
document.getElementById('file').addEventListener('change', (e) => {
    const fileInput = e.target;
    const languageSelect = document.getElementById('language');
    
    if (fileInput.files.length > 0) {
        const detectedLanguage = detectLanguageFromFile(fileInput.files[0].name);
        if (detectedLanguage) {
            // Update the language dropdown
            languageSelect.value = detectedLanguage;
            
            // Update CodeMirror mode if editor is visible
            if (editorSection.style.display !== 'none') {
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
                editor.setOption('mode', modeMap[detectedLanguage] || 'text/plain');
            }
        } else {
            // If language cannot be detected, set to auto
            languageSelect.value = 'auto';
        }
    }
});

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const languageSelect = document.getElementById('language');
    const resultsDiv = document.getElementById('results');
    
    formData.append('language', languageSelect.value);

    // Check if we're using file upload or pasted code
    const fileInput = document.getElementById('file');
    if (fileInputSection.style.display !== 'none' && fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    } else {
        // Create a new Blob from the editor content
        const codeContent = editor.getValue();
        const blob = new Blob([codeContent], { type: 'text/plain' });
        formData.append('file', blob, `code.${languageSelect.value}`);
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
