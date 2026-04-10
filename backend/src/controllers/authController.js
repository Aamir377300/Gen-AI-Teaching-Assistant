import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, gradeLevel, curriculum } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, gradeLevel, curriculum });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        gradeLevel: user.gradeLevel,
        curriculum: user.curriculum,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ 
      $or: [
        { email: email },
        { studentId: email }
      ]
    });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        role: user.role,
        generatedBy: user.generatedBy,
        name: user.name,
        email: user.email,
        gradeLevel: user.gradeLevel,
        curriculum: user.curriculum,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { name, gradeLevel, curriculum } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, gradeLevel, curriculum },
      { new: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Students (For Teachers)
export const generateStudents = async (req, res) => {
  try {
    const { count, gradeLevel, curriculum } = req.body;
    
    // We get the full user from DB because req.user from token might just have {id} depending on how protect middleware works
    const currentUser = await User.findById(req.user.id);

    if (currentUser.role === 'student' || currentUser.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can generate accounts' });
    }

    const { name: teacherName, _id: teacherId } = currentUser;
    
    const credentials = [];
    
    // Generate a short ID prefix
    const prefix = teacherName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'T');
    
    // Fallbacks if not provided
    const targetGrade = gradeLevel || currentUser.gradeLevel || 'N/A';
    const targetCurriculum = curriculum || currentUser.curriculum || 'N/A';
    
    for (let i = 0; i < count; i++) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const studentId = `${prefix}${randomNum}`;
        const password = Math.random().toString(36).slice(-8); // random 8 char password
        
        // Ensure dummy email passes validation
        const dummyEmail = `${studentId}@student.app`;
        
        const user = await User.create({
            name: `Student ${studentId}`,
            email: dummyEmail,
            password: password,
            gradeLevel: targetGrade,
            curriculum: targetCurriculum,
            role: 'student',
            studentId,
            generatedBy: teacherId
        });
        
        credentials.push({
            studentId,
            password,
            gradeLevel: user.gradeLevel,
            curriculum: user.curriculum,
            name: user.name
        });
    }

    res.status(201).json({ credentials });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
