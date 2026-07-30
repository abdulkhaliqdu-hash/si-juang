import os
import sys

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the Streamlit app
import app


def handler(event, context):
    """Vercel serverless function handler."""
    # Run the Streamlit app
    app.main()
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/html",
        },
        "body": "SI-JUANG app is running",
    }