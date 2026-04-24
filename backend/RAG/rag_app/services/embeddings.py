import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

APP_ENV = os.getenv("APP_ENV", "local")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
HF_API_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{HF_MODEL}"

# Load local model only when running locally
if APP_ENV == "local":
    from sentence_transformers import SentenceTransformer
    _local_model = SentenceTransformer("all-MiniLM-L6-v2")


def _embed_via_huggingface_api(text: str) -> list:
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    response = requests.post(HF_API_URL, headers=headers, json={"inputs": text})
    response.raise_for_status()
    result = response.json()
    # HF feature-extraction returns nested list for a single string input
    if isinstance(result[0], list):
        # Average token embeddings to get sentence embedding
        import numpy as np
        return list(np.mean(result[0], axis=0))
    return result


def generate_embedding(chunk: str) -> list:
    if APP_ENV == "local":
        return _local_model.encode(chunk).tolist()
    return _embed_via_huggingface_api(chunk)
