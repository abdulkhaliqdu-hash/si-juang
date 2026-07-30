import os
import subprocess
import sys

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def handler(event, context):
    """Vercel serverless function handler."""
    # Run the Streamlit app as a subprocess
    # Note: This requires Vercel Pro plan for longer timeout
    port = os.environ.get("PORT", "8080")
    cmd = [
        sys.executable,
        "-m",
        "streamlit",
        "run",
        "app.py",
        "--server.port",
        port,
        "--server.headless",
        "true",
        "--server.enableCORS",
        "false",
        "--server.enableXsrfProtection",
        "false",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "text/html"},
            "body": result.stdout or "App running",
        }
    except subprocess.TimeoutExpired:
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "text/html"},
            "body": "App is running",
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "text/plain"},
            "body": f"Error: {str(e)}",
        }