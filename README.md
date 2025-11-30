# Code Analysis Tool

A lightweight web-based Code Analysis Tool that provides quick, visual insights into your code — including basic metrics (lines of code, comments, imports), code structure (classes, functions, methods), and complexity metrics (cyclomatic complexity, maximum nesting depth, maintainability index).

This project is a Flask application with a UI that lets you paste code, upload a file, auto-detect the language, and run an analysis. It uses `radon` for Python complexity metrics and invokes language-specific linters/compilers when available for richer analysis.

---

## 🚀 Features

- Upload or paste code into an in-browser editor. 
- Auto language detection (based on file extension — `auto` mode).
- Code parsing to extract classes, functions, methods, objects, imports and comments.
- Complexity analysis (Cyclomatic complexity, nesting depth, maintainability index via `radon` for Python).
- Exports and share options: PDF, TXT, PNG, Email, WhatsApp.
- Clean UI with editor utilities (format, indent, copy, themes).

---

## 🧰 Prerequisites

- Python 3.9+ (recommended 3.10/3.11)
- Git (optional, to clone repo)

Optional (for richer analysis of different languages — not required for basic analysis):
- Ruby (`ruby`) — Ruby syntax checks
- Go (`go`) — Go `vet` or build tools
- Swift (`swiftc`) — Swift compiler
- PHP (`php`) — PHP syntax check
- C# (`csc`) — .NET csc


> Note: The app will still work with reduced functionality if these optional tools are not installed. The code falls back to a helpful message when a tool is not present.

---

## 🛠️ Installation & Setup

Clone project (if needed):
```bash
git clone https://github.com/rocke7-adhi/script-analysis.git
cd script-analysis
```

Create and activate a Python virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Install optional system tools (Ubuntu examples):
```bash
# For JavaScript linting
sudo npm install -g jshint

# For C++ analysis
sudo apt update && sudo apt install -y cppcheck

# Java JDK
sudo apt install -y default-jdk

# PHP
sudo apt install -y php-cli

# Ruby
sudo apt install -y ruby-full

# Go
sudo apt install -y golang-go

# Swift (package manager dependent; this example uses official repository/ppa as available)
# See https://swift.org/getting-started/ and your platform docs

# .NET SDK (for csc on Ubuntu)
# Follow Microsoft docs: https://learn.microsoft.com/dotnet/core/install/linux
```

---

## ▶️ Running Locally

Start the development server:

```bash
# Activate venv if not already
source venv/bin/activate

# Run the application
python app.py
```

Open your browser at:

http://127.0.0.1:5000/

You can also use `flask run` if you set FLASK_APP:

```bash
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```

---

## 🔧 How It Works (Overview)

- The UI provides a code editor and file upload element. Users may paste code or upload a file and select a language (or choose auto-detect).
- The client (static/script.js) packages the code into a file form and sends it to the backend `/analyze` endpoint using a POST request with `file` and `language` fields.
- The Flask backend handles uploads under `/analyze`: saves the uploaded file temporarily to `uploads/`, runs heuristics and external tooling depending on the language, calculates metrics (lines, comments, imports, classes, functions), runs complexity analysis (radon for Python), and returns a JSON object containing the results.
- Temporary uploads are removed from disk after analysis completes.

---

## 📡 API

### POST /analyze

Analyze a single file or pasted code.

Request (multipart/form-data):
- file: the code file being uploaded (built by the web UI or directly sent via curl)
- language: fallback language chosen by user (or `auto` for file extension detection)

Example using curl:
```bash
curl -X POST \
  -F "file=@/path/to/file.py" \
  -F "language=python" \
  http://127.0.0.1:5000/analyze
```

Response (JSON) — sample keys:
- output (string): Linter/analysis output or a helpful message if tools were missing.
- total_lines, empty_lines, comment_lines (numbers): basic metrics.
- class_count, function_count, method_count, object_count, import_count (numbers)
- methods, objects, classes, functions, imports, comments (arrays): extracted entries
- code_structure (object): breakdown of class/function/method/object/import counts.
- complexity_analysis (object): cyclomatic_complexity, max_nesting_depth, maintainability_index

Example output (partial):
```json
{
  "total_lines": 125,
  "empty_lines": 8,
  "comment_lines": 12,
  "class_count": 2,
  "function_count": 5,
  "methods": ["def __init__(self, x):"],
  "complexity_analysis": {
    "cyclomatic_complexity": 12,
    "max_nesting_depth": 3,
    "maintainability_index": 78.23
  }
}
```

---

## ⚠️ Security & Limitations

- The service executes linters/compilers like `pylint`, `jshint`, `cppcheck`, `javac`, etc. These tools may open a vector if analyzing untrusted code. It's recommended to run the tool in an isolated environment or inside a sandbox (such as a container) if you plan to analyze untrusted code.
- Language detection is primarily based on file extension; for pasted code the UI attempts content-based detection but it's best to explicitly select the language when possible.
- Complexity heuristics (for non-Python languages) are approximations and may not be as accurate as language-specific tools.
- There is no auth; if you need private/team usage, add authentication and a limit on upload size to avoid abuse. Consider rate-limiting and input validation.

---

## 🧪 Testing & Development

- To run the app locally, use `python app.py` as shown above.
- The project uses `uploads/` to store uploaded files; those are cleaned up after analysis. For debugging, you may temporarily remove cleanup or inspect saved files.

To run unit tests or add tests:
- Create `tests/` and add simple request tests using the Flask testing client.

---

## ✅ Useful Commands

```bash
# Activate venv
source venv/bin/activate

# Install dev/testing tools
pip install pytest pytest-flask

# Run the server
python app.py

# Run curl API example
curl -X POST -F "file=@/path/to/example.py" -F "language=auto" http://127.0.0.1:5000/analyze
```

---

## 📦 Contribution & License

Contributions are welcome — feel free to open issues or PRs. Please add tests for new functionality and update `requirements.txt` if you add dependencies.

open-source

---

## 🤝 Acknowledgements

- Built with Flask, Radon, and CodeMirror.
- Some analysis relies on optional third-party CLI tools like `pylint`, `jshint`, `cppcheck`, `javac` and others.

---


Happy to implement any further improvements! ✨
