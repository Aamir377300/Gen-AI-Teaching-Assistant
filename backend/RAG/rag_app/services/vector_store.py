import os
from pinecone import Pinecone, ServerlessSpec
from rag_app.services.embeddings import generate_embedding

_pc = None
_index = None

def _get_pc():
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    return _pc

def _get_index():
    global _index
    if _index is None:
        pc = _get_pc()
        index_name = os.getenv("PINECONE_INDEX_NAME", "aiassistant")
        existing = [idx.name for idx in pc.list_indexes()]
        if index_name not in existing:
            pc.create_index(
                name=index_name,
                dimension=384,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
        _index = pc.Index(index_name)
    return _index

def store_embeddings_pinecone(chunks: list[str], embeddings: list[list[float]], namespace: str = "default"):
    index = _get_index()

    vectors = []
    for i, (chunk, vector) in enumerate(zip(chunks, embeddings)):
        vectors.append({
            "id": f"{namespace}-chunk-{i}",
            "values": vector,
            "metadata": {"text": chunk, "namespace": namespace},
        })

    # Upsert in batches of 100
    batch_size = 100
    for start in range(0, len(vectors), batch_size):
        index.upsert(vectors=vectors[start : start + batch_size], namespace=namespace)

    return len(vectors)

def retrieve_from_pinecone(question: str, namespace: str = "default", top_k: int = 5) -> list[str]:
    index = _get_index()
    
    query_vector = generate_embedding(question)

    result = index.query(
        vector=query_vector,
        top_k=top_k,
        namespace=namespace,
        include_metadata=True,
    )

    chunks = []
    for match in result.matches:
        text = match.metadata.get("text", "")
        if text:
            chunks.append(text)

    return chunks

def delete_namespace(namespace: str):
    index = _get_index()
    try:
        index.delete(delete_all=True, namespace=namespace)
    except Exception:
        pass