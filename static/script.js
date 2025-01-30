document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('file');
    const languageSelect = document.getElementById('language');
    const resultsDiv = document.getElementById('results');
    
    formData.append('file', fileInput.files[0]);
    formData.append('language', languageSelect.value);
    
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
                </div>
                
                <div class="code-structure">
                    <h3>Code Structure</h3>
                    <p>Classes: ${data.code_structure.classes}</p>
                    <p>Functions: ${data.code_structure.functions}</p>
                    <p>Methods: ${data.code_structure.methods}</p>
                    <p>Objects: ${data.code_structure.objects}</p>
                </div>
            </div>

            <div class="analysis-grid">
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
