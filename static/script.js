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

    // Add loading state handling
    function showLoading() {
        document.querySelector('.loading-overlay').style.display = 'flex';
        document.querySelector('.loading-progress-bar').style.width = '0%';
    }

    function hideLoading() {
        document.querySelector('.loading-overlay').style.display = 'none';
    }

    // Update the form submission handler
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = ''; // Clear previous results
        showLoading(); // Show loading overlay
        
        const formData = new FormData();
        const codeContent = editor.getValue();
        const selectedLanguage = document.getElementById('language').value;
        
        if (!codeContent.trim()) {
            hideLoading();
            resultsDiv.innerHTML = `<div class="error fade-in">Please enter some code</div>`;
            return;
        }
        
        try {
            const extension = getFileExtension(selectedLanguage);
            const blob = new Blob([codeContent], { type: 'text/plain' });
            const file = new File([blob], `code${extension}`, { type: 'text/plain' });
            
            formData.append('file', file);
            formData.append('language', selectedLanguage);
            
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
// Start 10-second loading animation
            
            document.querySelector('.loading-progress-bar').style.animation = 'progress 5s linear forwards';
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            if (data.error) {
                resultsDiv.innerHTML = `<div class="error fade-in">Error: ${data.error}</div>`;
                return;
            }
            
            let resultsHTML = `
                <div class="results-container fade-in">
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

                    <div class="analysis-section complexity">
                        <h3>Code Complexity Analysis</h3>
                        <div class="metric-item">
                            <span class="metric-label">Cyclomatic Complexity</span>
                            <span class="metric-value">${data.complexity_analysis.cyclomatic_complexity}</span>
                            <span class="metric-info" title="Measures the number of linearly independent paths through the code">ⓘ</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Maximum Nesting Depth</span>
                            <span class="metric-value">${data.complexity_analysis.max_nesting_depth}</span>
                            <span class="metric-info" title="The deepest level of nested code blocks">ⓘ</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Cognitive Complexity</span>
                            <span class="metric-value">${data.complexity_analysis.cognitive_complexity}</span>
                            <span class="metric-info" title="Measures how difficult the code is to understand">ⓘ</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Maintainability Index</span>
                            <span class="metric-value">${data.complexity_analysis.maintainability_index}</span>
                            <span class="metric-info" title="Higher values indicate better maintainability">ⓘ</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Difficulty Score</span>
                            <span class="metric-value">${data.complexity_analysis.difficulty_score}</span>
                            <span class="metric-info" title="Based on Halstead complexity measures">ⓘ</span>
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
                </div>
            `;
            
            resultsDiv.innerHTML = resultsHTML;
            resultsDiv.classList.add('fade-in');

            // Show result actions when results are displayed
            const showResultActions = () => {
                document.querySelector('.result-actions').style.display = 'block';
            };
            // block the action buttons from submitting the form
            const actionButtons = document.querySelectorAll('.action-btn, .dropdown-content a');
    
            actionButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false; // Prevent form submission
                });
            });

            // Share functionality
            document.getElementById('emailShare').addEventListener('click', (e) => {
                e.preventDefault();
                const subject = 'Code Analysis Results';
                const body = formatAnalysisResults(window.analysisData);
                
                // Limit the body length and clean up the content
                const cleanBody = body
                    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
                    .substring(0, 2000); // Limit length to avoid URL length issues
                
                // Add a note if content was truncated
                const truncationNote = body.length > 2000 ? 
                    '\n\n[Content truncated. Please use export options for full results.]' : '';
                
                try {
                    // Try the mailto link first
                    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cleanBody + truncationNote)}`;
                } catch (error) {
                    // Fallback: Copy to clipboard and show instructions
                    navigator.clipboard.writeText(body).then(() => {
                        alert('Analysis results copied to clipboard. Please paste into your email client.');
                    }).catch(() => {
                        // If clipboard fails, show content in a modal or alert
                        alert('Please copy the analysis results from the page and paste into your email client.');
                    });
                }
            });

            document.getElementById('whatsappShare').addEventListener('click', (e) => {
                e.preventDefault();
                const text = formatAnalysisResults(data);
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            });

            // Export functionality
            document.getElementById('exportPDF').addEventListener('click', async (e) => {
                e.preventDefault();
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Set font and size
                doc.setFont('helvetica');
                doc.setFontSize(16);
                
                // Add title
                doc.text('Code Analysis Results', 20, 20);
                doc.setFontSize(12);
                
                // Get the formatted content
                const content = formatAnalysisResults(data);
                
                // Split content into lines that fit the page width
                const lines = doc.splitTextToSize(content, 170);
                
                let y = 30;
                const pageHeight = doc.internal.pageSize.height;
                
                // Add lines with pagination
                lines.forEach(line => {
                    if (y > pageHeight - 20) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(line, 20, y);
                    y += 6;
                });
                
                doc.save('analysis-results.pdf');
            });

            document.getElementById('exportTXT').addEventListener('click', (e) => {
                e.preventDefault();
                const content = formatAnalysisResults(data);
                const blob = new Blob([content], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'analysis-results.txt';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            });

            document.getElementById('exportImage').addEventListener('click', (e) => {
                e.preventDefault();
                html2canvas(document.getElementById('results')).then(canvas => {
                    const link = document.createElement('a');
                    link.download = 'analysis-results.png';
                    link.href = canvas.toDataURL();
                    link.click();
                });
            });

            // Update the results display to show actions
            const originalResultsHTML = resultsDiv.innerHTML;
            resultsDiv.innerHTML = originalResultsHTML;
            showResultActions();
        } catch (error) {
            resultsDiv.innerHTML = `<div class="error fade-in">Error: ${error.message}</div>`;
        } finally {
            hideLoading();
            // Reset progress bar animation
            const progressBar = document.querySelector('.loading-progress-bar');
            progressBar.style.animation = 'none';
            progressBar.offsetHeight; // Trigger reflow
            progressBar.style.animation = '';
        }
    });

    // Format code button
    document.getElementById('formatCode').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const mode = editor.getMode().name;
            let code = editor.getValue();
            
            if (!code.trim()) {
                return; // Don't format empty code
            }
            
            // Basic formatting for different languages
            switch (mode) {
                case 'javascript':
                    // Basic JS formatting
                    code = code.replace(/[{]/g, ' {\n    ')
                             .replace(/[}]/g, '\n}\n')
                             .replace(/;/g, ';\n')
                             .replace(/\n\s*\n/g, '\n\n'); // Remove extra newlines
                    break;
                    
                case 'python':
                    // Basic Python formatting
                    code = code.replace(/:\s*/g, ':\n    ')
                             .replace(/\n\s*\n/g, '\n\n')
                             .replace(/([^:]);/g, '$1\n'); // Add newlines after statements
                    break;
                    
                default:
                    // Generic formatting for other languages
                    code = code.replace(/[{]/g, ' {\n    ')
                             .replace(/[}]/g, '\n}\n')
                             .replace(/;/g, ';\n')
                             .replace(/\n\s*\n/g, '\n\n');
            }
            
            // Update editor content
            editor.setValue(code);
            
            // Auto indent all lines
            const totalLines = editor.lineCount();
            for (let i = 0; i < totalLines; i++) {
                editor.indentLine(i);
            }
            
            // Refresh the editor to update the display
            editor.refresh();
            
        } catch (error) {
            console.error('Formatting failed:', error);
        }
    });

    document.getElementById('copyCode').addEventListener('click', () => {
        navigator.clipboard.writeText(editor.getValue())
            .then(() => {
                const btn = document.getElementById('copyCode');
                btn.innerHTML = '<svg>...</svg>Copied!';
                setTimeout(() => {
                    btn.innerHTML = '<svg>...</svg>Copy';
                }, 2000);
            });
    });

    document.getElementById('clearCode').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the editor?')) {
            editor.setValue('');
        }
    });

    // Update keyboard shortcuts - remove save-related shortcuts
    editor.setOption('extraKeys', {
        'Ctrl-F': (cm) => {
            document.getElementById('formatCode').click();
        },
        'Ctrl-/': (cm) => {
            const selections = cm.getSelections();
            const mode = cm.getMode().name;
            const comment = mode === 'python' ? '#' : '//';
            
            const newSelections = selections.map(selection => {
                const lines = selection.split('\n');
                const commentedLines = lines.map(line => {
                    if (line.trimStart().startsWith(comment)) {
                        return line.replace(new RegExp(`^(\\s*)${comment}\\s?`), '$1');
                    }
                    return line.replace(/^(\s*)/, `$1${comment} `);
                });
                return commentedLines.join('\n');
            });
            
            cm.replaceSelections(newSelections);
        }
    });

    // Update theme select without localStorage
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        const theme = e.target.value;
        editor.setOption('theme', theme);
    });

    // Update font size select without localStorage
    document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
        const fontSize = e.target.value + 'px';
        document.querySelector('.CodeMirror').style.fontSize = fontSize;
    });

    // Reset everything on page load
    window.addEventListener('load', () => {
        editor.setValue('');
        document.getElementById('language').value = 'auto';
        document.getElementById('themeSelect').value = 'monokai';
        document.getElementById('fontSizeSelect').value = '14';
        editor.setOption('theme', 'monokai');
        document.querySelector('.CodeMirror').style.fontSize = '14px';
    });

    // Indent code button
    document.getElementById('indentCode').addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission
        const totalLines = editor.lineCount();
        editor.operation(() => {
            for (let i = 0; i < totalLines; i++) {
                editor.indentLine(i);
            }
        });
        editor.refresh(); // Refresh editor after indenting
    });

    // Add this to prevent form submission when clicking editor toolbar buttons
    document.querySelector('.editor-toolbar').addEventListener('click', (e) => {
        if (e.target.closest('button')) {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    // Update language detection for pasted code
    document.getElementById('language').addEventListener('change', (e) => {
        const selectedLanguage = e.target.value;
        if (selectedLanguage !== 'auto') {
            editor.setOption('mode', getEditorMode(selectedLanguage));
        }
    });
});

// Helper function to get editor mode
function getEditorMode(language) {
    const modeMap = {
        'python': {
            mode: 'python',
            mime: 'text/x-python',
            indentUnit: 4
        },
        'javascript': {
            mode: 'javascript',
            mime: 'text/javascript',
            indentUnit: 2
        },
        'cpp': {
            mode: 'clike',
            mime: 'text/x-c++src',
            indentUnit: 4
        },
        'java': {
            mode: 'clike',
            mime: 'text/x-java',
            indentUnit: 4
        },
        'ruby': {
            mode: 'ruby',
            mime: 'text/x-ruby',
            indentUnit: 2
        },
        'go': {
            mode: 'go',
            mime: 'text/x-go',
            indentUnit: 4
        },
        'swift': {
            mode: 'swift',
            mime: 'text/x-swift',
            indentUnit: 4
        },
        'php': {
            mode: 'php',
            mime: 'application/x-httpd-php',
            indentUnit: 4
        },
        'csharp': {
            mode: 'clike',
            mime: 'text/x-csharp',
            indentUnit: 4
        }
    };
    
    const config = modeMap[language] || { mode: 'text/plain', indentUnit: 4 };
    editor.setOption('mode', config.mime);
    editor.setOption('indentUnit', config.indentUnit);
    return config.mode;
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

// Add this helper function to get file extension
function getFileExtension(language) {
    const extensionMap = {
        'python': '.py',
        'javascript': '.js',
        'cpp': '.cpp',
        'java': '.java',
        'ruby': '.rb',
        'go': '.go',
        'swift': '.swift',
        'php': '.php',
        'csharp': '.cs'
    };
    return extensionMap[language] || '.txt';
}


// Add this function to detect language from content
function detectLanguageFromContent(content) {
    const patterns = {
        python: {
            keywords: /\b(def|class|import|from|if|for|while|try|except|with|async|await)\b/,
            syntax: /:\s*$/m,
            imports: /^(?:from\s+\w+(?:\.\w+)*\s+import|\s*import\s+\w+)/m
        },
        javascript: {
            keywords: /\b(function|const|let|var|if|for|while|try|catch|class|import|export)\b/,
            syntax: /[{};]/,
            imports: /^(?:import\s+.*\s+from\s+[\'"].*[\'"]|require\s*\([\'"].*[\'"]\))/m
        },
        cpp: {
            keywords: /\b(class|struct|namespace|template|public|private|protected)\b/,
            syntax: /::|->|<>/,
            includes: /#include\s*[<"]/
        },
        java: {
            keywords: /\b(public|private|protected|class|interface|extends|implements|package)\b/,
            syntax: /;$/m,
            imports: /^import\s+[\w.]+(?:\s*\*)?;/m
        },
        ruby: {
            keywords: /\b(def|class|module|require|include|attr_accessor)\b/,
            syntax: /end$/m,
            requires: /^require\s+[\'"].*[\'"]/
        },
        go: {
            keywords: /\b(func|type|struct|interface|package|import|go|chan|defer)\b/,
            syntax: /:\=|<-/,
            imports: /^import\s+(?:\([^)]+\)|"[^"]+")/m
        },
        swift: {
            keywords: /\b(class|struct|enum|protocol|extension|guard|let|var)\b/,
            syntax: /->|@/,
            imports: /^import\s+\w+/m
        },
        php: {
            keywords: /\b(function|class|namespace|use|public|private|protected)\b/,
            syntax: /\$\w+|<?php/,
            imports: /^(?:require|include)(?:_once)?\s*\([\'"].*[\'"]\)/m
        },
        csharp: {
            keywords: /\b(class|namespace|using|public|private|protected|async|await)\b/,
            syntax: /;$/m,
            imports: /^using\s+[\w.]+;/m
        }
    };

    // Score each language based on matches
    const scores = Object.entries(patterns).map(([lang, pattern]) => {
        let score = 0;
        const contentSample = content.slice(0, 1000); // Check first 1000 chars

        if (pattern.keywords.test(contentSample)) score += 2;
        if (pattern.syntax.test(contentSample)) score += 1;
        if (pattern.imports?.test(contentSample)) score += 3;

        return { language: lang, score };
    });

    // Return the language with highest score
    const bestMatch = scores.reduce((max, curr) => 
        curr.score > max.score ? curr : max
    );

    return bestMatch.score > 2 ? bestMatch.language : null;
}

// Update the formatAnalysisResults function to be more email-friendly
function formatAnalysisResults(data) {
    if (!data) return 'No analysis data available.';
    
    try {
        return `
Code Analysis Results
--------------------

BASIC METRICS
Total Lines: ${data.total_lines}
Empty Lines: ${data.empty_lines}
Comment Lines: ${data.comment_lines}
Import Count: ${data.import_count}

CODE STRUCTURE
Classes: ${data.code_structure.classes}
Functions: ${data.code_structure.functions}
Methods: ${data.code_structure.methods}
Objects: ${data.code_structure.objects}
Imports: ${data.code_structure.imports}

${data.imports.length > 0 ? `IMPORTS FOUND\n${data.imports.map(imp => `- ${imp}`).join('\n')}\n` : ''}
${data.classes.length > 0 ? `\nCLASSES FOUND\n${data.classes.map(cls => `- ${cls}`).join('\n')}\n` : ''}
${data.functions.length > 0 ? `\nFUNCTIONS FOUND\n${data.functions.map(func => `- ${func}`).join('\n')}\n` : ''}
${data.methods.length > 0 ? `\nMETHODS FOUND\n${data.methods.map(method => `- ${method}`).join('\n')}\n` : ''}
${data.objects.length > 0 ? `\nOBJECTS FOUND\n${data.objects.map(obj => `- ${obj}`).join('\n')}\n` : ''}
${data.comments.length > 0 ? `\nCOMMENTS FOUND\n${data.comments.map(comment => `- ${comment}`).join('\n')}\n` : ''}

ANALYSIS OUTPUT
${data.output || 'No issues found'}`;
    } catch (error) {
        console.error('Error formatting results:', error);
        return 'Error formatting analysis results. Please try exporting as PDF or TXT instead.';
    }
}

