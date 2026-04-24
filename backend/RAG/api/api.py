import sys
import os
import uuid
import tempfile

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from rag_app.services.pdf_loader import extract_text_from_pdf
from rag_app.services.text_splitter import split_text_into_chunks
from rag_app.services.embeddings import generate_embedding
from rag_app.services.vector_store import store_embeddings_pinecone, delete_namespace, retrieve_from_pinecone

app = FastAPI(title="RAG Teaching Assistant API - Core Vector Services", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# RAG: Upload PDF (Embed & Store)

@app.post("/rag/upload")
async def rag_upload(
    file: UploadFile = File(...),
    namespace: str = Form(default=None),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    ns = namespace if namespace else str(uuid.uuid4())

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        try:
            delete_namespace(ns)
        except Exception:
            pass

        text = extract_text_from_pdf(tmp_path)
        if not text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

        chunks = split_text_into_chunks(text)
        embeddings = [generate_embedding(chunk) for chunk in chunks]
        stored = store_embeddings_pinecone(chunks, embeddings, namespace=ns)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Pinecone upload failed: {str(e)}")
    finally:
        os.unlink(tmp_path)

    return {
        "namespace": ns,
        "chunks_stored": stored,
        "filename": file.filename,
    }


# RAG: Retrieve Chunks

class RetrieveRequest(BaseModel):
    namespace: str
    query: str
    top_k: int = 10

@app.post("/rag/retrieve")
def rag_retrieve(body: RetrieveRequest):
    """
    Retrieve the most relevant text chunks from Pinecone.
    """
    try:
        chunks = retrieve_from_pinecone(body.query, namespace=body.namespace, top_k=body.top_k)
        return {"chunks": chunks}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")
