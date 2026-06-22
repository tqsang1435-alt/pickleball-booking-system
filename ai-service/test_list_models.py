import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

dotenv_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

try:
    print("Listing models...")
    for m in genai.list_models():
        print(f"Model name: {m.name}, supported: {m.supported_generation_methods}")
except Exception as e:
    print("Error listing models:", e)
