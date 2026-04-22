import os
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME", "aiassistant")

print(f"Checking index: {index_name}")

existing = [idx.name for idx in pc.list_indexes()]

if index_name in existing:
    print(f"Deleting old index {index_name}...")
    pc.delete_index(index_name)

print(f"Creating new {index_name} with dimension 384...")
pc.create_index(
    name=index_name,
    dimension=384,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)
print("Done!")
