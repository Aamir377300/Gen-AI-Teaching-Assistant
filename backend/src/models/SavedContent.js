import mongoose from 'mongoose';

const savedContentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['notes', 'slides', 'quiz'], required: true },
  topic: { type: String, required: true },
  difficulty: { type: String },
  length: { type: String },
  tone: { type: String },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  pdfUrl: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('SavedContent', savedContentSchema);
