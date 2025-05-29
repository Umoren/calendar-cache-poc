import express from 'express';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Google OAuth setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Store tokens temporarily (in production, use proper storage)
let userTokens = null;

// Home route
app.get('/', (req, res) => {
    res.json({
        message: 'Calendar Webhook Demo',
        steps: [
            '1. Go to /auth/google to authenticate',
            '2. Copy your tokens from callback',
            '3. Call /setup-webhook with tokens to create webhook',
            '4. Change something in your Google Calendar',
            '5. Check Vercel logs to see webhook fired!'
        ]
    });
});

// Start Google OAuth
app.get('/auth/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
        prompt: 'consent'
    });
    res.redirect(authUrl);
});

// OAuth callback - get tokens
app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ error: 'No authorization code received' });
        }

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Store tokens temporarily
        userTokens = tokens;

        res.json({
            message: 'Authentication successful!',
            tokens: tokens,
            next: 'Now call POST /setup-webhook to create the webhook'
        });
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create webhook - this is the key part!
app.post('/setup-webhook', async (req, res) => {
    try {
        const { tokens } = req.body;

        if (!tokens && !userTokens) {
            return res.status(400).json({ error: 'No tokens provided. Authenticate first.' });
        }

        // Use provided tokens or stored ones
        const authTokens = tokens || userTokens;
        oauth2Client.setCredentials(authTokens);

        // Create a unique channel ID
        const channelId = uuidv4();

        // Set up webhook channel to watch calendar events
        const watchRequest = {
            calendarId: 'primary',
            requestBody: {
                id: channelId,
                type: 'web_hook',
                address: process.env.WEBHOOK_URL, // Your Vercel URL
                token: 'demo-token', // Optional verification token
            }
        };

        console.log('Creating webhook with URL:', process.env.WEBHOOK_URL);

        const response = await calendar.events.watch(watchRequest);

        res.json({
            success: true,
            message: 'Webhook created! Now change something in your Google Calendar.',
            channelId: channelId,
            resourceId: response.data.resourceId,
            expiration: response.data.expiration,
            webhookUrl: process.env.WEBHOOK_URL,
            instructions: [
                '1. Go to calendar.google.com',
                '2. Create, edit, or delete an event',
                '3. Check your Vercel function logs',
                '4. You should see the webhook notification!'
            ]
        });

    } catch (error) {
        console.error('Webhook setup error:', error);
        res.status(500).json({
            error: error.message,
            details: error.response?.data || 'Unknown error'
        });
    }
});

// Test webhook locally (for debugging)
app.post('/webhook/test', (req, res) => {
    console.log('Test webhook called!');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    res.status(200).send('Webhook received');
});

app.listen(PORT, () => {
    console.log(`🚀 Webhook Demo running on port ${PORT}`);
    console.log(`📱 Start here: http://localhost:${PORT}/auth/google`);
    console.log(`🔗 Webhook URL should be: ${process.env.WEBHOOK_URL}`);
});