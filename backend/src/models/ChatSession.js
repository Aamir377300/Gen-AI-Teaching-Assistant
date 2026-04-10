import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String, // Supports text
  },
  imageUrl: {
    type: String, // Base64 encoded or actual URL
  },
}, { _id: false, timestamps: true });

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'New Conversation',
  },
  pdfNamespace: {
    type: String, // Pinecone namespace if a PDF is attached to this session
  },
  messages: [messageSchema],
}, {
  timestamps: true,
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
