import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ type: Number }], // selected option index per question
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number, required: true },
}, { timestamps: true });

// One attempt per student per quiz
quizResultSchema.index({ quiz: 1, student: 1 }, { unique: true });

export default mongoose.model('QuizResult', quizResultSchema);
