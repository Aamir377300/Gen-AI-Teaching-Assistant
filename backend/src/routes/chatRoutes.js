import express from 'express';
import Groq from 'groq-sdk';
import axios from 'axios';
import ChatSession from '../models/ChatSession.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const PYTHON_API = process.env.PYTHON_RAG_URL || 'http://localhost:8000';

// HELPER: Fetch Context from Pinecone 
async function fetchContext(namespace, query, top_k = 5) {
  try {
    const response = await axios.post(`${PYTHON_API}/rag/retrieve`, {
      namespace, query, top_k
    });
    return response.data.chunks || [];
  } catch (err) {
    console.error("RAG Retrieve Error:", err.message);
    return [];
  }
}

// GET /api/chat/sessions
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user._id })
      .select('-messages')
      .sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sessions', error: err.message });
  }
});

// POST /api/chat/sessions
router.post('/sessions', protect, async (req, res) => {
  try {
    const { title, pdfNamespace } = req.body;
    const newSession = await ChatSession.create({
      user: req.user._id,
      title: title || 'New Conversation',
      pdfNamespace: pdfNamespace || undefined,
      messages: [],
    });
    res.json(newSession);
  } catch (err) {
    res.status(500).json({ message: 'Error creating session', error: err.message });
  }
});

// GET /api/chat/sessions/:id
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching session', error: err.message });
  }
});

// ─── PUT /api/chat/sessions/:id/namespace ───────────────────────
// For attaching a PDF to an existing session
router.put('/sessions/:id/namespace', protect, async (req, res) => {
  try {
    const { pdfNamespace } = req.body;
    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { pdfNamespace },
      { new: true }
    );
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Error updating namespace', error: err.message });
  }
});

// ─── POST /api/chat/sessions/:id/message ────────────────────────
router.post('/sessions/:id/message', protect, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });

    if (!session) return res.status(404).json({ message: 'Session not found' });

    // 1. Add user message
    const userMessage = { role: 'user', content, imageUrl };
    session.messages.push(userMessage);

    // 2. Determine Context
    let contextStr = '';
    if (session.pdfNamespace && content) {
      const chunks = await fetchContext(session.pdfNamespace, content, 5);
      if (chunks.length > 0) {
        contextStr = "\n\nRelevant PDF Context:\n" + chunks.map((c, i) => `[Chunk ${i+1}]: ${c}`).join('\n\n');
      }
    }

    // 3. Format Messages for Groq
    let sysPrompt = "You are an expert AI Teaching Assistant.";
    sysPrompt += contextStr;

    const groqMessages = [{ role: 'system', content: sysPrompt }];

    // Prepare previous history for groq (limit to last 10 messages)
    const recentMessages = session.messages.slice(-10);
    
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        const userM = [];
        if (msg.content) userM.push({ type: 'text', text: msg.content });
        if (msg.imageUrl) userM.push({ type: 'image_url', image_url: { url: msg.imageUrl } });
        groqMessages.push({ role: 'user', content: userM });
      } else {
        groqMessages.push({ role: 'assistant', content: msg.content });
      }
    }

    // 4. Call Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    // Fallback to text model if no image is present in the CURRENT message.
    // Llama-3.2 Vision Preview handles multimodal.
    const modelUsed = imageUrl ? 'llama-3.2-11b-vision-preview' : (process.env.AI_MODEL || 'llama-3.1-8b-instant');

    const completion = await groq.chat.completions.create({
      model: modelUsed,
      messages: groqMessages,
      temperature: 0.3,
      max_tokens: 1500,
    });

    const assistantReply = completion.choices[0].message.content.trim();

    // 5. Save assistant message
    session.messages.push({ role: 'assistant', content: assistantReply });
    
    // Automatically update title if it's the first exchange
    if (session.title === 'New Conversation' && session.messages.length <= 2 && content) {
      session.title = content.substring(0, 40) + '...';
    }

    await session.save();

    res.json({ session, assistantReply });
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ message: 'Error generating response', error: err.message });
  }
});

export default router;
