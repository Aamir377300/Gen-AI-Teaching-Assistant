import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String },
  tone: { type: String },
  questions: [
    {
      question: { type: String, required: true },
      options: [{ type: String }],
      correct: { type: Number, required: true },
      explanation: { type: String },
    },
  ],
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
