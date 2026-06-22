import os
import google.generativeai as genai
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from dotenv import load_dotenv
from pathlib import Path
import json
import sys

# Reconfigure stdout for UTF-8 encoding to prevent Windows charmap print errors
if sys.version_info >= (3, 7):
    sys.stdout.reconfigure(encoding='utf-8')

# Load dotenv
dotenv_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

class IntentEnum(str, Enum):
    GREETING = "GREETING"
    UNKNOWN = "UNKNOWN"

class BookingData(BaseModel):
    date: Optional[str] = None
    originalMessage: Optional[str] = None

class ChatbotIntentResponse(BaseModel):
    intent: IntentEnum = Field(description="Intent")
    parsedData: BookingData = Field(description="Data")
    confidence: float = Field(description="Confidence")
    missingFields: List[str] = Field(description="Missing fields")

def pydantic_to_gemini_schema(model_class):
    schema_dict = model_class.model_json_schema()
    defs = schema_dict.get("$defs", {})
    
    def clean_schema(node):
        if not isinstance(node, dict):
            return node
        
        # Resolve reference
        if "$ref" in node:
            ref_name = node["$ref"].split("/")[-1]
            ref_schema = defs.get(ref_name, {})
            return clean_schema(ref_schema.copy())
        
        # Resolve anyOf (usually for Optional fields like anyOf: [type, null])
        if "anyOf" in node:
            sub_types = [x for x in node["anyOf"] if x.get("type") != "null"]
            if sub_types:
                sub_node = sub_types[0].copy()
                for k, v in node.items():
                    if k != "anyOf" and k not in sub_node:
                        sub_node[k] = v
                return clean_schema(sub_node)
            else:
                return {"type": "STRING"} # fallback
                
        type_map = {
            "string": "STRING",
            "integer": "INTEGER",
            "number": "NUMBER",
            "boolean": "BOOLEAN",
            "object": "OBJECT",
            "array": "ARRAY"
        }
        
        cleaned = {}
        
        if "type" in node:
            t = node["type"]
            cleaned["type"] = type_map.get(t, "STRING")
        elif "enum" in node:
            cleaned["type"] = "STRING"
            
        if "description" in node:
            cleaned["description"] = node["description"]
            
        if "enum" in node:
            cleaned["enum"] = node["enum"]
            
        if "properties" in node:
            cleaned["properties"] = {
                k: clean_schema(v) for k, v in node["properties"].items()
            }
            
        if "required" in node:
            props = node.get("properties", {})
            cleaned["required"] = [
                r for r in node["required"] 
                if r in props or "$ref" in props.get(r, {}) or "anyOf" in props.get(r, {})
            ]
            
        if "items" in node:
            cleaned["items"] = clean_schema(node["items"])
            
        return cleaned

    return clean_schema(schema_dict)

def test():
    model_name = os.getenv("MODEL_NAME", "gemini-1.5-flash")
    print(f"Using model: {model_name}")
    model = genai.GenerativeModel(model_name)
    custom_schema = pydantic_to_gemini_schema(ChatbotIntentResponse)
    print("Resolved Schema Dict:\n", json.dumps(custom_schema, indent=2, ensure_ascii=False))

    try:
        response = model.generate_content(
            "Chào bạn ngày 21",
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=custom_schema
            )
        )
        print("\nResponse text:", response.text)
    except Exception as e:
        print("\nError calling Gemini with custom schema:", e)

if __name__ == "__main__":
    test()
