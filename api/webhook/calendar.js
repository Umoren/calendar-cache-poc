export default function (req, res) {
    console.log('🎉 GOOGLE CALENDAR WEBHOOK FIRED!');
    console.log('Method:', req.method);
    console.log('Timestamp:', new Date().toISOString());

    const channelId = req.headers['x-goog-channel-id'];
    const resourceState = req.headers['x-goog-resource-state'];
    const resourceId = req.headers['x-goog-resource-id'];
    const token = req.headers['x-goog-channel-token'];

    console.log('📧 Webhook Details:');
    console.log('  Channel ID:', channelId);
    console.log('  Resource State:', resourceState);
    console.log('  Resource ID:', resourceId);
    console.log('  Token:', token);

    if (resourceState === 'sync') {
        console.log('✅ This is a sync message (initial setup confirmation)');
    } else if (resourceState === 'exists') {
        console.log('🔄 This means something CHANGED in the calendar!');
        console.log('   → Someone created, updated, or deleted an event');
    } else {
        console.log('❓ Unknown resource state:', resourceState);
    }

    res.status(200).json({
        received: true,
        timestamp: new Date().toISOString(),
        channelId,
        resourceState
    });
}