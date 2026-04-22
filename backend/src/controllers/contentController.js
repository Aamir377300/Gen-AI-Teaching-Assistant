import Groq from 'groq-sdk';
import { createRequire } from 'module';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import SavedContent from '../models/SavedContent.js';
import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import User from '../models/User.js';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

const lengthGuide = {
  short: '3-4 slides',
  medium: '6-8 slides',
  detailed: '10-12 slides',
};

const toneGuide = {
  formal: 'academic and professional language',
  simple: 'simple, easy-to-understand language suitable for students',
  engaging: 'engaging, conversational language with relatable examples',
};

const difficultyGuide = {
  beginner: 'basic concepts, avoid jargon, use simple analogies',
  intermediate: 'assume foundational knowledge, introduce technical terms with explanations',
  advanced: 'in-depth analysis, technical terminology, assume strong prior knowledge',
};

// ─── Generate Notes ───────────────────────────────────────────────────────────

export const generateNotes = async (req, res) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const { topic, difficulty = 'advanced', tone = 'formal', chatContext = [] } = req.body;

    if (!topic) return res.status(400).json({ message: 'Topic is required' });

    let contextString = "";
    if (chatContext && chatContext.length > 0) {
      contextString = "Use the following context to inform the content:\n" + 
        chatContext.map(c => `${c.role.toUpperCase()}: ${c.content}`).join('\n') + "\n\n";
    }

    const prompt = `You are an expert teacher. Generate VERY detailed study notes for a 5-page PDF document on the topic: "${topic}".
${contextString}
Requirements:
- Difficulty: ${difficultyGuide[difficulty] || difficultyGuide.advanced}
- Length: Must be exhaustive. Generate at least 15 extensive sections. Each section MUST have 3-4 long paragraphs of extremely detailed content. This is meant to fill multiple PDF pages so the density should be at least 75% per page.
- Tone: ${toneGuide[tone] || toneGuide.formal}

Respond ONLY with a valid JSON object in this exact format (no markdown outside the json):
{
  "title": "${topic}",
  "sections": [
    { "heading": "Major Section Heading", "content": "Several paragraphs of extremely detailed content covering this aspect. Ensure to provide extensive detail." }
  ],
  "summary": "A comprehensive summary of the entire topic."
}`;

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4500,
      response_format: { type: 'json_object' },
    });

    const notes = JSON.parse(completion.choices[0].message.content.trim());
    res.json(notes);
  } catch (error) {
    console.error('Notes generation error:', error);
    res.status(500).json({ message: 'Failed to generate notes', error: error.message });
  }
};

// ─── Generate Slides ──────────────────────────────────────────────────────────

export const generateSlides = async (req, res) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const { topic, difficulty = 'advanced', tone = 'formal', chatContext = [] } = req.body;

    if (!topic) return res.status(400).json({ message: 'Topic is required' });
    
    let contextString = "";
    if (chatContext && chatContext.length > 0) {
      contextString = "Use the following context to inform the content:\n" + 
        chatContext.map(c => `${c.role.toUpperCase()}: ${c.content}`).join('\n') + "\n\n";
    }

    const prompt = `You are an expert teacher. Generate EXACTLY 10 presentation slides packed full of rich content for the topic: "${topic}".
${contextString}
Requirements:
- Difficulty: ${difficultyGuide[difficulty] || difficultyGuide.advanced}
- Length: EXACTLY 10 slides. Each slide MUST have 6-8 extremely detailed bullet points (20-30 words per bullet) to ensure at least 75% slide density.
- Tone: ${toneGuide[tone] || toneGuide.formal}

Respond ONLY with a valid JSON object in this exact format (no markdown outside the json):
{
  "title": "${topic} Presentation",
  "slides": [
    { "title": "Slide Title", "bullets": ["A highly detailed point spanning 20+ words.", "Another dense, highly informational point.", "Extensive explanation component.", "Deep contextual detail."] }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4500,
      response_format: { type: 'json_object' },
    });

    const slides = JSON.parse(completion.choices[0].message.content.trim());
    res.json(slides);
  } catch (error) {
    console.error('Slides generation error:', error);
    res.status(500).json({ message: 'Failed to generate slides', error: error.message });
  }
};

// ─── Build PDF from Notes data ───────────────────────────────────────────────

const buildNotesPDF = (notesData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Cover page & Title
    doc.fillColor('#4F46E5')
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(notesData.title, { align: 'center' });
    doc.moveDown(2);
    
    // Summary
    doc.fillColor('#1F2937').fontSize(14).font('Helvetica-Bold').text("Summary");
    doc.moveDown(0.5);
    doc.fillColor('#374151').fontSize(11).font('Helvetica').text(notesData.summary || "", { align: 'justify', lineGap: 4 });
    doc.moveDown(2);

    // Sections
    if (notesData.sections) {
      notesData.sections.forEach(section => {
        // We add page breaks manually or let pdfkit wrap it. For 75% full pages, we simply let it run but maybe force pagebreak if space is low
        doc.fillColor('#4F46E5').fontSize(16).font('Helvetica-Bold').text(section.heading);
        doc.moveDown(0.5);
        
        // Handle paragraphs if separated by newlines
        const paragraphs = section.content.split('\n').filter(p => p.trim());
        paragraphs.forEach(para => {
          doc.fillColor('#374151').fontSize(11).font('Helvetica').text(para, { align: 'justify', lineGap: 5 });
          doc.moveDown(1);
        });
        doc.moveDown(1);
      });
    }

    doc.end();
  });
};

// ─── Build PDF from slides data ───────────────────────────────────────────────

const buildSlidesPDF = (slidesData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Cover page
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#4F46E5');
    doc.fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(slidesData.title, 50, doc.page.height / 2 - 40, { align: 'center', width: doc.page.width - 100 });
    doc.fontSize(12)
      .font('Helvetica')
      .text(`${slidesData.slides.length} slides`, 50, doc.page.height / 2 + 20, { align: 'center', width: doc.page.width - 100 });

    // Slide pages
    slidesData.slides.forEach((slide, index) => {
      doc.addPage();

      // Header bar
      doc.rect(0, 0, doc.page.width, 70).fill('#4F46E5');

      // Slide number
      doc.fillColor('#FFFFFF').font('Helvetica').fontSize(10)
        .text(`${index + 1} / ${slidesData.slides.length}`, doc.page.width - 80, 10, { width: 60, align: 'right' });

      // Slide title
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(18)
        .text(slide.title, 50, 22, { width: doc.page.width - 120 });

      // Bullet points
      let y = 100;
      slide.bullets.forEach((bullet) => {
        // Bullet dot
        doc.circle(62, y + 5, 4).fill('#4F46E5');
        // Bullet text
        doc.fillColor('#1F2937').font('Helvetica').fontSize(13)
          .text(bullet, 78, y, { width: doc.page.width - 130 });
        y += doc.heightOfString(bullet, { width: doc.page.width - 130 }) + 18;
      });
    });

    doc.end();
  });
};

// ─── Save Slides — generate PDF, upload to Cloudinary, save link ──────────────

export const saveSlides = async (req, res) => {
  try {
    const { title, topic, difficulty, length, tone, content } = req.body;

    // Configure Cloudinary here so env vars are guaranteed to be loaded
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Build PDF buffer
    const pdfBuffer = await buildSlidesPDF(content);

    // Upload to Cloudinary as raw PDF
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'teach-ai/slides',
          public_id: `${Date.now()}-${topic.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          type: 'upload',
        },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      Readable.from(pdfBuffer).pipe(uploadStream);
    });

    const pdfUrl = uploadResult.secure_url;

    // Save to MongoDB with PDF URL
    const saved = await SavedContent.create({
      user: req.user._id,
      title,
      type: 'slides',
      topic,
      difficulty,
      length,
      tone,
      content,
      pdfUrl,
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error('Save slides error:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to save slides', error: error.message });
  }
};

// ─── Generate Quiz ────────────────────────────────────────────────────────────

export const generateQuiz = async (req, res) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const { topic, difficulty = 'intermediate', tone = 'engaging' } = req.body;

    if (!topic) return res.status(400).json({ message: 'Topic is required' });

    const prompt = `You are an expert teacher. Generate exactly 10 multiple choice quiz questions for the topic: "${topic}".

Requirements:
- Difficulty: ${difficulty} — ${difficultyGuide[difficulty]}
- Tone: ${tone} — ${toneGuide[tone]}
- Each question must have exactly 4 options (A, B, C, D)
- correct is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D)

Respond ONLY with a valid JSON object in this exact format:
{
  "title": "Quiz: Topic Name",
  "topic": "${topic}",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this answer is correct."
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const quiz = JSON.parse(completion.choices[0].message.content.trim());
    res.json(quiz);
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ message: 'Failed to generate quiz', error: error.message });
  }
};

// ─── Save Quiz ────────────────────────────────────────────────────────────────

export const saveQuiz = async (req, res) => {
  try {
    const { title, topic, difficulty, tone, content } = req.body;
    const saved = await Quiz.create({
      user: req.user._id,
      title,
      topic,
      difficulty,
      tone,
      questions: content.questions,
    });
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Saved Quizzes ────────────────────────────────────────────────────────

export const getSavedQuizzes = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id || req.user.id);
    const targetUserId = currentUser.role === 'student' ? currentUser.generatedBy : (req.user._id || req.user.id);
    const items = await Quiz.find({ user: targetUserId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Quiz ──────────────────────────────────────────────────────────────

export const deleteQuiz = async (req, res) => {
  try {
    const item = await Quiz.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveContent = async (req, res) => {
  try {
    const { title, type, topic, difficulty, length, tone, content } = req.body;
    let pdfUrl = null;

    if (type === 'notes') {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      const pdfBuffer = await buildNotesPDF(content);

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: 'teach-ai/notes',
            public_id: `${Date.now()}-notes-${topic.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            type: 'upload',
          },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        Readable.from(pdfBuffer).pipe(uploadStream);
      });
      pdfUrl = uploadResult.secure_url;
    }

    const saved = await SavedContent.create({
      user: req.user._id, title, type, topic, difficulty, length, tone, content, pdfUrl,
    });
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Saved Content ────────────────────────────────────────────────────────

export const getSavedContent = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id || req.user.id);
    const targetUserId = currentUser.role === 'student' ? currentUser.generatedBy : (req.user._id || req.user.id);
    const items = await SavedContent.find({ user: targetUserId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Saved Content ─────────────────────────────────────────────────────

export const deleteSavedContent = async (req, res) => {
  try {
    const item = await SavedContent.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Submit Quiz Attempt (students, one-time) ─────────────────────────────────

export const submitQuizAttempt = async (req, res) => {
  try {
    const { answers } = req.body; // array of selected indices
    const quizId = req.params.id;

    // Only students can attempt
    const student = await User.findById(req.user._id);
    if (student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can attempt quizzes' });
    }

    // Check already attempted
    const existing = await QuizResult.findOne({ quiz: quizId, student: req.user._id });
    if (existing) {
      return res.status(409).json({ message: 'You have already attempted this quiz', result: existing });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const score = quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
    const total = quiz.questions.length;
    const percentage = Math.round((score / total) * 100);

    const result = await QuizResult.create({
      quiz: quizId,
      student: req.user._id,
      answers,
      score,
      total,
      percentage,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get student's own result for a quiz ─────────────────────────────────────

export const getMyQuizResult = async (req, res) => {
  try {
    const result = await QuizResult.findOne({ quiz: req.params.id, student: req.user._id });
    res.json({ result: result || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get all results for a quiz (teacher) ────────────────────────────────────

export const getQuizResults = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id);
    if (teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can view all results' });
    }
    const results = await QuizResult.find({ quiz: req.params.id })
      .populate('student', 'name email studentId')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Download Quiz Results as PDF (teacher) ───────────────────────────────────

export const downloadQuizResultsPDF = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id);
    if (teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can download results' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const results = await QuizResult.find({ quiz: req.params.id })
      .populate('student', 'name email studentId')
      .sort({ createdAt: -1 });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quiz-results-${quiz._id}.pdf"`);
    doc.pipe(res);

    // ── Header ──
    doc.rect(0, 0, doc.page.width, 80).fill('#4F46E5');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(18)
      .text(quiz.title, 50, 20, { width: doc.page.width - 100 });
    doc.font('Helvetica').fontSize(11)
      .text(`Topic: ${quiz.topic}  ·  Difficulty: ${quiz.difficulty}  ·  ${quiz.questions.length} questions`, 50, 46, { width: doc.page.width - 100 });
    doc.fillColor('#C7D2FE').fontSize(9)
      .text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 62);

    doc.moveDown(3);

    // ── Summary stats ──
    if (results.length > 0) {
      const avg = Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length);
      const passed = results.filter((r) => r.percentage >= 70).length;
      doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(11).text('Summary', 50, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(10).fillColor('#374151')
        .text(`Total Attempts: ${results.length}   ·   Average Score: ${avg}%   ·   Passed (≥70%): ${passed}/${results.length}`, 50);
      doc.moveDown(1);
    }

    // ── Table header ──
    const tableTop = doc.y;
    const col = { name: 50, email: 180, studentId: 340, score: 430, pct: 490 };
    const rowH = 28;

    doc.rect(50, tableTop, doc.page.width - 100, rowH).fill('#EEF2FF');
    doc.fillColor('#4F46E5').font('Helvetica-Bold').fontSize(9);
    doc.text('NAME',      col.name,      tableTop + 9, { width: 120 });
    doc.text('EMAIL',     col.email,     tableTop + 9, { width: 150 });
    doc.text('STUDENT ID',col.studentId, tableTop + 9, { width: 80 });
    doc.text('SCORE',     col.score,     tableTop + 9, { width: 50, align: 'center' });
    doc.text('%',         col.pct,       tableTop + 9, { width: 50, align: 'center' });

    // ── Table rows ──
    if (results.length === 0) {
      doc.moveDown(2);
      doc.fillColor('#6B7280').font('Helvetica').fontSize(10)
        .text('No students have attempted this quiz yet.', { align: 'center' });
    } else {
      results.forEach((r, idx) => {
        const y = tableTop + rowH + idx * rowH;

        // Alternate row background
        if (idx % 2 === 0) doc.rect(50, y, doc.page.width - 100, rowH).fill('#F9FAFB');

        const passed = r.percentage >= 70;
        doc.fillColor('#111827').font('Helvetica').fontSize(9);
        doc.text(r.student?.name || '—',      col.name,      y + 9, { width: 120 });
        doc.text(r.student?.email || '—',     col.email,     y + 9, { width: 150 });
        doc.text(r.student?.studentId || '—', col.studentId, y + 9, { width: 80 });
        doc.fillColor('#111827')
          .text(`${r.score}/${r.total}`, col.score, y + 9, { width: 50, align: 'center' });
        doc.fillColor(passed ? '#16A34A' : '#DC2626').font('Helvetica-Bold')
          .text(`${r.percentage}%`, col.pct, y + 9, { width: 50, align: 'center' });

        // Row border
        doc.moveTo(50, y + rowH).lineTo(doc.page.width - 50, y + rowH)
          .strokeColor('#E5E7EB').lineWidth(0.5).stroke();
      });
    }

    doc.end();
  } catch (error) {
    console.error('PDF download error:', error.message);
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
};
