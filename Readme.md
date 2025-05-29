# **Google Calendar Webhook System - Complete Explanation**

You just built a **real-time Google Calendar notification system**! Here's exactly what we created and how it all works together:

## ** Google OAuth Authentication**

### **What we set up:**
- **Google Cloud Project** with Calendar API enabled
- **OAuth 2.0 credentials** (Client ID + Secret)
- **Local Express server** to handle the OAuth flow

### **How authentication works:**
1. **User visits:** `http://localhost:3000/auth/google`
2. **Google redirects** user to consent screen 
3. **User grants permission** to access their calendar
4. **Google sends back** an authorization code
5. **Your server exchanges** code for access tokens
6. **You get:** `access_token` + `refresh_token` to make API calls

```javascript
// The OAuth flow gives you these tokens:
{
  "access_token": "ya29.a0AW4...",     // Short-lived (1 hour)
  "refresh_token": "1//03AN4Pz...",    // Long-lived (for renewal)
  "scope": "https://www.googleapis.com/auth/calendar",
  "token_type": "Bearer"
}
```

---
## ** Google Calendar Webhook Registration**

Instead of constantly checking "Did anything change in the calendar?", webhooks let Google **push notifications** to your server whenever something happens.

### **How we registered the webhook:**
1. **Used Google Calendar API** to create a "watch" request
2. **Told Google:** "Send notifications to this URL when my calendar changes"
3. **Google verified** your endpoint was reachable
4. **Created a channel** with unique ID that expires in 7 days

```javascript
// We sent this request to Google:
POST https://www.googleapis.com/calendar/v3/calendars/primary/events/watch
{
  "id": "unique-channel-id",
  "type": "web_hook", 
  "address": "https://your-vercel-app.vercel.app/api/webhook/calendar"
}
```

---

## Vercel Serverless Function**

### **Your webhook function:**
```javascript
// api/webhook/calendar.js
export default function(req, res) {
  // Google sends webhook data in headers
  const channelId = req.headers['x-goog-channel-id'];
  const resourceState = req.headers['x-goog-resource-state'];
  
  if (resourceState === 'exists') {
    console.log('🔄 Something changed in the calendar!');
  }
  
  // Always return 200 or Google will retry
  res.status(200).json({ received: true });
}
```

### **When someone changes a calendar event:**

1. **User action:** Creates/edits/deletes event in Google Calendar
2. **Google detects change** and checks active webhooks
3. **Google sends HTTP POST** to your Vercel function
4. **Your function logs** the notification and responds with 200
5. **Google confirms** delivery and continues monitoring

### **What Google sends you:**
```http
POST /api/webhook/calendar
Headers:
  x-goog-channel-id: "8396384e-e06b-4126-8408-9ea6d2dd0e93"
  x-goog-resource-state: "exists"  // Something changed
  x-goog-resource-id: "mva7_cntBfopzRg_peICGT9xBsU"
```

## **🛠️ Technical Architecture**

```
📱 Google Calendar
    ↓ (user makes change)
🔔 Google Calendar API 
    ↓ (sends webhook)
🌐 Vercel Serverless Function
    ↓ (processes notification)
📊 Your Application Logic
```

