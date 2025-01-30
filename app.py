from flask import Flask, request, jsonify, render_template
import os
import subprocess
import re

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
            method_pattern = r'\s+def\s+\w+\s*\(.*\)'  # Indented def for methods
            object_pattern = r'\w+\s*=\s*\w+\('
            try:
                result = subprocess.run(["pylint", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Pylint not installed. Please install pylint for detailed Python analysis."
                
        elif language == "javascript":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'function\s+\w+'
            method_pattern = r'(async\s+)?[\w.]+\s*\(.*\)\s*{'  # Includes async methods
            object_pattern = r'(const|let|var)\s+\w+\s*=\s*new\s+\w+'
            try:
                result = subprocess.run(["jshint", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "JSHint not installed. Please install jshint for detailed JavaScript analysis."
                
        elif language == "cpp":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'\w+\s+\w+\(.*\)'
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
            try:
                result = subprocess.run(["javac", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Java compiler not found. Please install JDK for Java analysis."

        elif language == "ruby":
            comment_symbol = "#"
            class_pattern = r'class\s+\w+'
            function_pattern = r'def\s+\w+'
            try:
                result = subprocess.run(["ruby", "-wc", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Ruby not installed. Please install Ruby for detailed analysis."

        elif language == "go":
            comment_symbol = "//"
            class_pattern = r'type\s+\w+\s+struct'
            function_pattern = r'func\s+\w+'
            try:
                result = subprocess.run(["go", "vet", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Go not installed. Please install Go for detailed analysis."

        elif language == "swift":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'func\s+\w+'
            try:
                result = subprocess.run(["swiftc", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "Swift compiler not found. Please install Swift for detailed analysis."

        elif language == "php":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'function\s+\w+'
            try:
                result = subprocess.run(["php", "-l", file_path], capture_output=True, text=True)
                analysis_output = result.stdout or "No issues found"
            except FileNotFoundError:
                analysis_output = "PHP not installed. Please install PHP for detailed analysis."

        elif language == "csharp":
            comment_symbol = "//"
            class_pattern = r'class\s+\w+'
            function_pattern = r'\w+\s+\w+\(.*\)'
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
        
        # Find methods, classes, functions and comments
        methods = []
        objects = []
        classes = []
        functions = []
        comments = []
        
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
        
        return {
            "output": analysis_output,
            "total_lines": total_lines,
            "empty_lines": empty_lines,
            "comment_lines": comment_lines,
            "class_count": class_count,
            "function_count": function_count,
            "method_count": method_count,
            "object_count": object_count,
            "methods": methods,
            "objects": objects,
            "classes": classes,
            "functions": functions,
            "comments": comments,
            "code_structure": {
                "classes": class_count,
                "functions": function_count,
                "methods": method_count,
                "objects": object_count
            }
        }
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

@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"})
    
    file = request.files["file"]
    if file.filename == '':
        return jsonify({"error": "No file selected"})
    
    language = request.form.get("language")
    if not language:
        return jsonify({"error": "No language selected"})
    
    if not allowed_file(file.filename, language):
        return jsonify({"error": f"Invalid file type for {language}"})
    
    try:
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

if __name__ == "__main__":
    os.makedirs("uploads", exist_ok=True)
    app.run(debug=True)
