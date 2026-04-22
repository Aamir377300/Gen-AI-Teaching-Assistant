import express from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const getOAuthClient = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

// Step 1 — teacher clicks "Connect Google", we embed their JWT in state
router.get('/connect', protect, (req, res) => {
  const oauth2Client = getOAuthClient();
  // Pass the user's JWT as state so we know who to save tokens for after callback
  const state = req.headers.authorization?.split(' ')[1];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state,
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar',
    ],
  });
  res.json({ url });
});

// Step 2 — Google redirects here, save tokens to the teacher's DB record
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing code parameter');
  if (!state) return res.status(400).send('Missing state parameter');

  try {
    // Verify the JWT from state to identify the teacher
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).send('User not found');

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens to the teacher's record
    user.googleRefreshToken = tokens.refresh_token || user.googleRefreshToken;
    user.googleAccessToken = tokens.access_token;
    user.googleTokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
    user.isGoogleConnected = true;
    await user.save();

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/live?google=connected`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/live?google=error`);
  }
});

// Disconnect Google account
router.post('/disconnect', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      googleRefreshToken: null,
      googleAccessToken: null,
      googleTokenExpiry: null,
      isGoogleConnected: false,
    });
    res.json({ message: 'Google account disconnected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check connection status
router.get('/status', protect, (req, res) => {
  res.json({ isGoogleConnected: req.user.isGoogleConnected || false });
});

export default router;
