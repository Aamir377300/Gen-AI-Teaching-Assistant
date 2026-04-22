import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  gradeLevel: { type: String, required: true },
  curriculum: { type: String, required: true },
  meetLink: { type: String, required: true },
  googleEventId: { type: String },
  isActive: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('LiveClass', liveClassSchema);
