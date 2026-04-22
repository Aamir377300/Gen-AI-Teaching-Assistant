import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import Groq from 'groq-sdk';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

const configCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// ─── Teacher: Create Assignment ───────────────────────────────────────────────
export const createAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create assignments' });
    }

    const { title, description, dueDate } = req.body;
    const gradeLevel = req.body.gradeLevel || req.user.gradeLevel;
    const curriculum = req.body.curriculum || req.user.curriculum;

    let fileUrl = null;
    let fileName = null;

    if (req.file) {
      configCloudinary();
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: 'teach-ai/assignments',
            public_id: `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`,
          },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        Readable.from(req.file.buffer).pipe(stream);
      });
      fileUrl = uploadResult.secure_url;
      fileName = req.file.originalname;
    }

    const assignment = await Assignment.create({
      teacher: req.user._id,
      title,
      description,
      gradeLevel,
      curriculum,
      fileUrl,
      fileName,
      dueDate: dueDate || null,
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Teacher: Get My Assignments ──────────────────────────────────────────────
export const getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user._id })
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Student: Get Assignments for their class ─────────────────────────────────
export const getStudentAssignments = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    const teacher = await User.findById(student.generatedBy);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const assignments = await Assignment.find({
      teacher: teacher._id,
      gradeLevel: student.gradeLevel,
      curriculum: student.curriculum,
    }).sort({ createdAt: -1 });

    // Mark which ones the student has submitted
    const result = assignments.map((a) => {
      const sub = a.submissions.find((s) => s.student.toString() === student._id.toString());
      return { ...a.toObject(), mySubmission: sub || null };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Student: Submit Assignment ───────────────────────────────────────────────
export const submitAssignment = async (req, res) => {
  try {
    const { driveLink, note } = req.body;
    if (!driveLink) return res.status(400).json({ message: 'Drive link is required' });

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Check already submitted
    const existing = assignment.submissions.find(
      (s) => s.student.toString() === req.user._id.toString()
    );
    if (existing) {
      existing.driveLink = driveLink;
      existing.note = note;
      existing.submittedAt = new Date();
    } else {
      assignment.submissions.push({ student: req.user._id, driveLink, note });
    }

    await assignment.save();
    res.json({ message: 'Submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Teacher: View Submissions ────────────────────────────────────────────────
export const getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      teacher: req.user._id,
    }).populate('submissions.student', 'name studentId gradeLevel curriculum');

    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Teacher: Delete Assignment ───────────────────────────────────────────────
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.id,
      teacher: req.user._id,
    });
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Teacher: AI Generate Assignment ─────────────────────────────────────────
export const generateAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can generate assignments' });
    }

    const { prompt, gradeLevel, curriculum, difficulty = 'intermediate' } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompt = `You are an expert teacher creating a student assignment.
Generate a well-structured assignment based on the teacher's prompt.
Grade Level: ${gradeLevel || 'Not specified'}
Curriculum: ${curriculum || 'Not specified'}
Difficulty: ${difficulty}

Respond ONLY with a valid JSON object in this exact format (no markdown):
{
  "title": "Assignment title",
  "description": "Full assignment description with clear instructions, objectives, requirements, and any relevant questions or tasks. Be detailed and specific so students know exactly what to do."
}`;

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL || 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content.trim());
    res.json(result);
  } catch (error) {
    console.error('Generate assignment error:', error);
    res.status(500).json({ message: error.message });
  }
};
