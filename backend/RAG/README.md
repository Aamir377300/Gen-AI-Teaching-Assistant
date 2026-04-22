# RAG Chat App

A Retrieval-Augmented Generation (RAG) system that lets you ask questions about a PDF book and get answers grounded strictly in its content.

---

## How It Works

1. **Ingest** — PDF is loaded, split into overlapping chunks, embedded using `sentence-transformers`, and saved to a local JSON vector store.
2. **Retrieve** — On each question, the query is embedded and compared against stored chunk vectors using cosine similarity. Top 3 most relevant chunks are returned.
3. **Generate** — Retrieved chunks are passed as context to `meta-llama/Llama-3.1-8B-Instruct` via the HuggingFace Inference API. The model answers strictly from the provided context.
4. **Frontend** — React + Tailwind UI sends questions to the FastAPI backend and displays the answer.

---

## Project Structure

```
RAG_assignment/
├── api/
│   └── api.py                  # FastAPI backend
├── data/
│   ├── pdfs/
│   │   └── investment_book.pdf
│   └── vector_store/
│       └── embeddings.json     # generated after ingestion
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── index.css
├── rag_app/
│   └── services/
│       ├── pdf_loader.py       # PDF text extraction
│       ├── text_splitter.py    # chunk with overlap
│       ├── embeddings.py       # sentence-transformers embeddings
│       ├── vector_store.py     # save/load embeddings.json
│       ├── retriever.py        # cosine similarity search
│       └── generator.py        # LLM answer generation
├── scripts/
│   ├── ingest_III.py           # run once to build vector store
│   └── query.py                # CLI query test
├── .env
└── requirements.txt
```

---

## Setup

### 1. Clone & create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
pip install fastapi uvicorn
```

### 3. Add your HuggingFace API key

Create a `.env` file in the project root:

```
HUGGINGFACE_API_KEY=hf_your_token_here
```

Get a free token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).

### 4. Ingest the PDF

Run this once to build the vector store:

```bash
python3 scripts/ingest.py
```

This creates `data/vector_store/embeddings.json`.

---

## Running the App

### Backend

```bash
uvicorn api.api:app --reload
```

Runs at `http://127.0.0.1:8000`. API docs available at `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

---

## API

**POST** `/ask`

```json
{ "question": "What is diversification?" }
```

```json
{ "answer": "..." }
```

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Embedding | `sentence-transformers/all-MiniLM-L6-v2` |
| LLM       | `meta-llama/Llama-3.1-8B-Instruct` (HuggingFace) |
| Backend   | FastAPI                                 |
| Frontend  | React + Tailwind CSS v4                 |
| Vector DB | Local JSON file                         |
