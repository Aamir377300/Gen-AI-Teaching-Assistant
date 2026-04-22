import { google } from 'googleapis';
import LiveClass from '../models/LiveClass.js';
import User from '../models/User.js';

// ─── Build an authenticated OAuth2 client for a specific teacher ──────────────
const getOAuthClientForTeacher = (teacher) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({
    refresh_token: teacher.googleRefreshToken,
    access_token: teacher.googleAccessToken,
    expiry_date: teacher.googleTokenExpiry ? teacher.googleTokenExpiry.getTime() : null,
  });

  // Auto-save refreshed tokens back to DB
  oauth2Client.on('tokens', async (tokens) => {
    const update = {};
    if (tokens.refresh_token) update.googleRefreshToken = tokens.refresh_token;
    if (tokens.access_token) update.googleAccessToken = tokens.access_token;
    if (tokens.expiry_date) update.googleTokenExpiry = new Date(tokens.expiry_date);
    if (Object.keys(update).length) {
      await User.findByIdAndUpdate(teacher._id, update);
    }
  });

  return oauth2Client;
};

// ─── Create a Google Calendar event with Meet link ───────────────────────────
const createMeetEvent = async (teacher, title, gradeLevel, curriculum) => {
  const auth = getOAuthClientForTeacher(teacher);
  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const end = new Date(now.getTime() + 60 * 60 * 1000);

  const event = {
    summary: `${title} — ${gradeLevel} ${curriculum}`,
    description: `Live class session for ${gradeLevel} (${curriculum})`,
    start: { dateTime: now.toISOString(), timeZone: 'UTC' },
    end: { dateTime: end.toISOString(), timeZone: 'UTC' },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    resource: event,
  });

  const meetLink = response.data.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === 'video'
  )?.uri;

  if (!meetLink) throw new Error('Google Meet link was not generated.');

  return { meetLink, eventId: response.data.id };
};

// ─── Teacher: Start Live Class ────────────────────────────────────────────────
export const startLiveClass = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can start live classes' });
    }

    const teacher = await User.findById(req.user._id);

    if (!teacher.isGoogleConnected || !teacher.googleRefreshToken) {
      return res.status(400).json({
        message: 'Please connect your Google account first to create Meet links.',
        requiresGoogleConnect: true,
      });
    }

    const { title } = req.body;
    const gradeLevel = req.body.gradeLevel || req.user.gradeLevel;
    const curriculum = req.body.curriculum || req.user.curriculum;

    await LiveClass.updateMany(
      { teacher: req.user._id, gradeLevel, curriculum, isActive: true },
      { isActive: false }
    );

    const { meetLink, eventId } = await createMeetEvent(teacher, title || 'Live Class', gradeLevel, curriculum);

    const liveClass = await LiveClass.create({
      teacher: req.user._id,
      title: title || 'Live Class',
      gradeLevel,
      curriculum,
      meetLink,
      googleEventId: eventId,
      isActive: true,
    });

    res.status(201).json(liveClass);
  } catch (error) {
    console.error('Start live class error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── Teacher: End Live Class ──────────────────────────────────────────────────
export const endLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!liveClass) return res.status(404).json({ message: 'Live class not found' });
    res.json(liveClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Teacher: Get My Live Classes ─────────────────────────────────────────────
export const getTeacherLiveClasses = async (req, res) => {
  try {
    const classes = await LiveClass.find({ teacher: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Student: Get Active Live Class for their board ───────────────────────────
export const getActiveLiveClass = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    const teacher = await User.findById(student.generatedBy);
    if (!teacher) return res.json({ liveClass: null });

    const liveClass = await LiveClass.findOne({
      teacher: teacher._id,
      gradeLevel: student.gradeLevel,
      curriculum: student.curriculum,
      isActive: true,
    }).sort({ startedAt: -1 });

    res.json({ liveClass: liveClass || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
