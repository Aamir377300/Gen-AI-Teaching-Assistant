import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driveLink: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  note: { type: String },
}, { _id: true });

const assignmentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  gradeLevel: { type: String, required: true },
  curriculum: { type: String, required: true },
  fileUrl: { type: String },          // Cloudinary URL
  fileName: { type: String },
  dueDate: { type: Date },
  submissions: [submissionSchema],
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);
