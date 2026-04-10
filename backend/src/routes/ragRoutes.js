import express from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import Groq from 'groq-sdk';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const PYTHON_API = process.env.PYTHON_RAG_URL || 'http://localhost:8000';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

function handlePythonError(error, res) {
  console.error("RAG Python Service Error:", error.response?.data?.detail || error.message);
  const status = error.response?.status || 500;
  const detail = error.response?.data?.detail || error.message || 'RAG service error';
  return res.status(status).json({ message: detail });
}

// ─── Retrieve Chunks from Python ───────────────────────────────────────────
async function fetchContext(namespace, query, top_k = 10) {
  const response = await axios.post(`${PYTHON_API}/rag/retrieve`, {
    namespace, query, top_k
  });
  return response.data.chunks || [];
}

// ─── POST /api/rag/upload ──────────────────────────────────────────────────
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: 'application/pdf',
    });

    const namespace = req.body.namespace || req.user._id.toString();
    form.append('namespace', namespace);

    const response = await axios.post(`${PYTHON_API}/rag/upload`, form, {
      headers: form.getHeaders(),
      timeout: 120_000,
    });

    res.json(response.data);
  } catch (error) {
    handlePythonError(error, res);
  }
});

// ─── POST /api/rag/generate-content ───────────────────────────────────────
router.post('/generate-content', protect, async (req, res) => {
  try {
    const { namespace, content_type = 'notes', query } = req.body;
    const ns = namespace || req.user._id.toString();

    // 1. Fetch chunks
    const chunks = await fetchContext(ns, query || 'Summarize the document.', 12);
    if (!chunks.length) return res.status(404).json({ message: `No content found for namespace '${ns}'.` });

    const combined = chunks.map((c, i) => `[Chunk ${i+1}]: ${c}`).join('\n\n');

    // 2. Format request for Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    let formatDesc, instruction;
    if (content_type === 'slides') {
      formatDesc = `{"title": "...", "slides": [{"title": "...", "bullets": ["..."]}]}`;
      instruction = "Generate presentation SLIDES";
    } else {
      formatDesc = `{"title": "...", "sections": [{"heading": "...", "content": "..."}], "summary": "..."}`;
      instruction = "Generate structured study NOTES";
    }

    const prompt = `You are an expert teacher. Based ONLY on the provided PDF context, ${instruction}. 
Respond ONLY with a valid JSON object in this exact format (no markdown): ${formatDesc}

PDF Context:
${combined}`;

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    res.json(JSON.parse(completion.choices[0].message.content.trim()));
  } catch (error) {
    if (error.response?.data?.detail) return handlePythonError(error, res);
    console.error('Groq Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate content', error: error.message });
  }
});

// ─── POST /api/rag/generate-quiz ──────────────────────────────────────────
router.post('/generate-quiz', protect, async (req, res) => {
  try {
    const { namespace, query } = req.body;
    const ns = namespace || req.user._id.toString();

    const chunks = await fetchContext(ns, query || 'Generate a quiz from the document.', 12);
    if (!chunks.length) return res.status(404).json({ message: `No content found for namespace '${ns}'.` });

    const combined = chunks.map((c, i) => `[Chunk ${i+1}]: ${c}`).join('\n\n');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are an expert teacher. Based ONLY on the provided PDF context, generate exactly 10 MCQ questions.
Respond ONLY with a valid JSON object in this format (no markdown):
{
  "title": "...", "topic": "...",
  "questions": [
    { "question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..." }
  ]
}

PDF Context:
${combined}`;

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    res.json(JSON.parse(completion.choices[0].message.content.trim()));
  } catch (error) {
    if (error.response?.data?.detail) return handlePythonError(error, res);
    res.status(500).json({ message: 'Failed to generate quiz', error: error.message });
  }
});

// ─── POST /api/rag/ask ────────────────────────────────────────────────────
router.post('/ask', protect, async (req, res) => {
  try {
    const { namespace, question } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: 'Question is required' });

    const ns = namespace || req.user._id.toString();
    const chunks = await fetchContext(ns, question, 5);
    
    if (!chunks.length) return res.status(404).json({ message: `No content found for namespace '${ns}'.` });

    const combined = chunks.map((c, i) => `[Chunk ${i+1}]: ${c}`).join('\n\n');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are a precise QA assistant. Answer ONLY using the context below. If the context doesn't contain the answer, say "The provided context does not contain enough information." Do not invent details.

Context:
${combined}

Question: ${question}`;

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    res.json({ answer: completion.choices[0].message.content.trim(), chunks_used: chunks.length });
  } catch (error) {
    if (error.response?.data?.detail) return handlePythonError(error, res);
    res.status(500).json({ message: 'Failed to get answer', error: error.message });
  }
});

export default router;
