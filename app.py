from flask import Flask, request, jsonify, render_template
import os
import subprocess
import re
import ast
from radon.complexity import cc_visit
from radon.metrics import mi_visit
from radon.raw import analyze

app = Flask(__name__)

# Function to analyze code based on file type
def analyze_code(file_path, language):
    try:
        # Read file contents first
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            content = ''.join(lines)
            total_lines = len(lines)
            
        # Common patterns for object-oriented features
        method_pattern = r'\s*def\s+\w+\s*\(.*\)'
        object_pattern = r'\w+\s*=\s*\w+\('
        
        # Set up language-specific patterns and try analysis
        if language == "python":
            comment_symbol = "#"
            class_pattern = r'class\s+\w+'
            function_pattern = r'def\s+\w+'
            method_pattern = r'\s+def\s+\w+\s*\(.*\)'
            object_pattern = r'\w+\s*=\s*\w+\('
            import_pattern = r'^(?:from\s+\w+(?:\.\w+)*\s+import|\s*import\s+\w+(?:\s*,\s*\w+)*)'
            try:
                result = subprocess.run(["pylint", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Pylint not installed. Please install pylint for detailed Python analysis."
                
        elif language == "javascript":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'function\s+\w+'
            method_pattern = r'(async\s+)?[\w.]+\s*\(.*\)\s*{'
            object_pattern = r'(const|let|var)\s+\w+\s*=\s*new\s+\w+'
            import_pattern = r'^(?:import\s+.*\s+from\s+[\'"].*[\'"]|require\s*\([\'"].*[\'"]\))'
            try:
                result = subprocess.run(["jshint", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "JSHint not installed. Please install jshint for detailed JavaScript analysis."
                
        elif language == "cpp":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'\w+\s+\w+\(.*\)'
            import_pattern = r'#include\s*[<"].*[>"]'
            try:
                result = subprocess.run(["cppcheck", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Cppcheck not installed. Please install cppcheck for detailed C++ analysis."
                
        elif language == "java":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'\w+\s+\w+\(.*\)'
            method_pattern = r'(public|private|protected)?\s+\w+\s+\w+\s*\(.*\)'
            object_pattern = r'\w+\s+\w+\s*=\s*new\s+\w+'
            import_pattern = r'import\s+[\w.]+(?:\s*\*)?;'
            try:
                result = subprocess.run(["javac", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Java compiler not found. Please install JDK for Java analysis."

        elif language == "ruby":
            comment_symbol = "#"
            class_pattern = r'class\s+\w+'
            function_pattern = r'def\s+\w+'
            import_pattern = r'^(?:require|require_relative|load)\s+[\'"].*[\'"]'
            try:
                result = subprocess.run(["ruby", "-wc", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Ruby not installed. Please install Ruby for detailed analysis."

        elif language == "go":
            comment_symbol = "//"
            class_pattern = r'type\s+\w+\s+struct'
            function_pattern = r'func\s+\w+'
            import_pattern = r'import\s+(?:\([^)]+\)|"[^"]+")'
            try:
                result = subprocess.run(["go", "vet", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Go not installed. Please install Go for detailed analysis."

        elif language == "swift":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'func\s+\w+'
            import_pattern = r'import\s+\w+'
            try:
                result = subprocess.run(["swiftc", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Swift compiler not found. Please install Swift for detailed analysis."

        elif language == "php":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'function\s+\w+'
            import_pattern = r'(?:require|include)(?:_once)?\s*\([\'"].*[\'"]\)'
            try:
                result = subprocess.run(["php", "-l", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "PHP not installed. Please install PHP for detailed analysis."

        elif language == "csharp":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'\w+\s+\w+\(.*\)'
            import_pattern = r'using\s+[\w.]+;'
            try:
                result = subprocess.run(["csc", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "C# compiler not found. Please install .NET SDK for C# analysis."

        else:
            return {"error": "Language not supported yet"}
        
        # Enhanced Analysis
        empty_lines = sum(1 for line in lines if line.strip() == "")
        comment_lines = sum(1 for line in lines if line.strip().startswith(comment_symbol))
        class_count = sum(1 for line in lines if re.search(class_pattern, line))
        function_count = sum(1 for line in lines if re.search(function_pattern, line))
        method_count = sum(1 for line in lines if re.search(method_pattern, line))
        object_count = sum(1 for line in lines if re.search(object_pattern, line))
        import_count = sum(1 for line in lines if re.search(import_pattern, line))
        
        # Find methods, classes, functions and comments
        methods = []
        objects = []
        classes = []
        functions = []
        comments = []
        imports = []
        
        for line in lines:
            # Extract method names
            method_match = re.search(method_pattern, line)
            if method_match:
                method_name = method_match.group().strip()
                methods.append(method_name)
            
            # Extract class names    
            class_match = re.search(class_pattern, line)
            if class_match:
                class_name = class_match.group().strip()
                classes.append(class_name)
            
            # Extract function names    
            function_match = re.search(function_pattern, line)
            if function_match:
                function_name = function_match.group().strip()
                functions.append(function_name)
                
            # Extract comments
            if line.strip().startswith(comment_symbol):
                comment_text = line.strip()
                comments.append(comment_text)
                
            # Extract object creation
            object_match = re.search(object_pattern, line)
            if object_match:
                object_name = object_match.group().strip()
                objects.append(object_name)
            
            # Extract imports
            import_match = re.search(import_pattern, line)
            if import_match:
                import_statement = import_match.group().strip()
                imports.append(import_statement)
        
        # Add complexity analysis
        complexity_metrics = analyze_code_complexity(content, language)
        
        # Add complexity metrics to the result
        result = {
            "output": analysis_output,
            "total_lines": total_lines,
            "empty_lines": empty_lines,
            "comment_lines": comment_lines,
            "class_count": class_count,
            "function_count": function_count,
            "method_count": method_count,
            "object_count": object_count,
            "import_count": import_count,
            "methods": methods,
            "objects": objects,
            "classes": classes,
            "functions": functions,
            "comments": comments,
            "imports": imports,
            "code_structure": {
                "classes": class_count,
                "functions": function_count,
                "methods": method_count,
                "objects": object_count,
                "imports": import_count
            },
            "complexity_analysis": {
                "cyclomatic_complexity": complexity_metrics['cyclomatic_complexity'],
                "max_nesting_depth": complexity_metrics['max_nesting_depth'],
                "cognitive_complexity": complexity_metrics['cognitive_complexity'],
                "maintainability_index": complexity_metrics['maintainability_index'],
                "difficulty_score": complexity_metrics['difficulty_score']
            }
        }
        
        return result
    except Exception as e:
        return {"error": str(e)}

# Add this function to validate file extensions
def allowed_file(filename, language):
    extensions = {
        'python': ['.py'],
        'javascript': ['.js'],
        'cpp': ['.cpp', '.hpp', '.h'],
        'java': ['.java'],
        'ruby': ['.rb'],
        'go': ['.go'],
        'swift': ['.swift'],
        'php': ['.php'],
        'csharp': ['.cs']
    }
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in [ext[1:] for ext in extensions.get(language, [])]

# Add this function for auto-detecting language
def detect_language(filename):
    extension_map = {
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
    }
    if '.' in filename:
        ext = '.' + filename.rsplit('.', 1)[1].lower()
        return extension_map.get(ext)
    return None

@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"})
    
    file = request.files["file"]
    if file.filename == '':
        return jsonify({"error": "No file selected"})
    
    # Get language from form or auto-detect from file
    language = request.form.get("language")
    if not language or language == "auto":
        detected_language = detect_language(file.filename)
        if not detected_language:
            return jsonify({"error": "Could not detect language from file extension"})
        language = detected_language
    
    if not allowed_file(file.filename, language):
        return jsonify({"error": f"Invalid file type for {language}"})
    
    try:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        file_path = os.path.join("uploads", file.filename)
        file.save(file_path)
        
        result = analyze_code(file_path, language)
        os.remove(file_path)  # Cleanup after analysis
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"})

@app.route('/')
def index():
    return render_template('index.html')

def analyze_code_complexity(content, language):
    """Analyze code complexity metrics"""
    try:
        # Basic complexity metrics
        complexity_metrics = {
            'cyclomatic_complexity': 0,
            'max_nesting_depth': 0,
            'cognitive_complexity': 0,
            'maintainability_index': 0,
            'difficulty_score': 0
        }

        if language == "python":
            # Use radon for Python complexity analysis
            results = cc_visit(content)
            complexity_metrics['cyclomatic_complexity'] = sum(result.complexity for result in results)
            complexity_metrics['maintainability_index'] = mi_visit(content, multi=True)
            
            # Calculate max nesting depth
            tree = ast.parse(content)
            complexity_metrics['max_nesting_depth'] = get_max_nesting_depth(tree)
            
        else:
            # Basic complexity analysis for other languages
            lines = content.split('\n')
            current_depth = 0
            max_depth = 0
            
            # Language-specific patterns for nesting detection
            nesting_patterns = {
                'javascript': ['{', '}'],
                'java': ['{', '}'],
                'cpp': ['{', '}'],
                'csharp': ['{', '}'],
                'php': ['{', '}'],
                'ruby': ['do|{|begin|if|unless|case', 'end|},'],
                'swift': ['{', '}'],
                'go': ['{', '}'],
            }
            
            open_pattern, close_pattern = nesting_patterns.get(language, ['{', '}'])
            
            for line in lines:
                line = line.strip()
                if re.search(f'.*{open_pattern}.*', line):
                    current_depth += 1
                    max_depth = max(max_depth, current_depth)
                if re.search(f'.*{close_pattern}.*', line):
                    current_depth = max(0, current_depth - 1)
            
            complexity_metrics['max_nesting_depth'] = max_depth
            
            # Calculate basic cyclomatic complexity
            decision_patterns = [
                r'\bif\b', r'\bwhile\b', r'\bfor\b', r'\bforeach\b',
                r'\bcase\b', r'\bcatch\b', r'\b\|\|\b', r'\b&&\b'
            ]
            
            complexity = 1  # Base complexity
            for pattern in decision_patterns:
                complexity += len(re.findall(pattern, content))
            
            complexity_metrics['cyclomatic_complexity'] = complexity
            
            # Calculate cognitive complexity
            cognitive_patterns = [
                r'\bif\b', r'\belse\b', r'\bwhile\b', r'\bfor\b',
                r'\bforeach\b', r'\bcase\b', r'\bcatch\b', r'\btry\b',
                r'\?', r':\b', r'\b\|\|\b', r'\b&&\b'
            ]
            
            cognitive_score = 0
            for pattern in cognitive_patterns:
                cognitive_score += len(re.findall(pattern, content))
            
            complexity_metrics['cognitive_complexity'] = cognitive_score
            
            # Calculate difficulty score (Halstead difficulty)
            operators = len(re.findall(r'[+\-*/=<>!&|^~%]|\b(if|else|while|for|return)\b', content))
            operands = len(re.findall(r'\b[a-zA-Z_]\w*\b', content))
            unique_operators = len(set(re.findall(r'[+\-*/=<>!&|^~%]|\b(if|else|while|for|return)\b', content)))
            unique_operands = len(set(re.findall(r'\b[a-zA-Z_]\w*\b', content)))
            
            if unique_operands != 0:
                difficulty = (unique_operators / 2) * (operands / unique_operands)
                complexity_metrics['difficulty_score'] = round(difficulty, 2)

        return complexity_metrics
        
    except Exception as e:
        return {
            'cyclomatic_complexity': 0,
            'max_nesting_depth': 0,
            'cognitive_complexity': 0,
            'maintainability_index': 0,
            'difficulty_score': 0,
            'error': str(e)
        }

def get_max_nesting_depth(node, current_depth=0):
    """Calculate maximum nesting depth for Python AST"""
    max_depth = current_depth
    for child in ast.iter_child_nodes(node):
        if isinstance(child, (ast.If, ast.For, ast.While, ast.Try, ast.With)):
            child_depth = get_max_nesting_depth(child, current_depth + 1)
            max_depth = max(max_depth, child_depth)
        else:
            child_depth = get_max_nesting_depth(child, current_depth)
            max_depth = max(max_depth, child_depth)
    return max_depth

if __name__ == "__main__":
    os.makedirs("uploads", exist_ok=True)
    app.run(debug=True)
