// Email Spy - Tracking Server (Vercel Serverless Function)
// File: backend/track.js

export default async function handler(req, res) {
  const { id } = req.query;
  
  // Get tracking information from request
  const trackingData = {
    trackingId: id,
    timestamp: Date.now(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'],
  };
  
  // Parse device type from user agent
  const userAgent = trackingData.userAgent.toLowerCase();
  if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
    trackingData.device = 'Mobile';
  } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
    trackingData.device = 'Tablet';
  } else {
    trackingData.device = 'Desktop';
  }
  
  // Get approximate location from IP (you'd use a geolocation service)
  // For demo, we'll just use a placeholder
  trackingData.location = await getLocationFromIP(trackingData.ip);
  
  // Store tracking data in your database
  // For demo, we'll use Vercel KV or Firebase
  await storeTrackingData(trackingData);
  
  // Notify extension via webhook or polling
  await notifyExtension(trackingData);
  
  // Return 1x1 transparent GIF
  const transparentGif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Length', transparentGif.length);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).send(transparentGif);
}

// Get location from IP address
async function getLocationFromIP(ip) {
  try {
    // Use a free geolocation API like ip-api.com
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return `${data.city}, ${data.country}`;
    }
  } catch (error) {
    console.error('Error getting location:', error);
  }
  
  return 'Unknown location';
}

// Store tracking data
async function storeTrackingData(data) {
  // Option 1: Vercel KV (Redis)
  /*
  const kv = require('@vercel/kv');
  await kv.lpush(`tracking:${data.trackingId}`, JSON.stringify(data));
  */
  
  // Option 2: Firebase Firestore
  /*
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore();
  await db.collection('tracking').add(data);
  */
  
  // Option 3: Simple JSON storage (for demo)
  console.log('Tracking data:', data);
}

// Notify extension
async function notifyExtension(data) {
  // You could use:
  // 1. Chrome Extension messaging API (requires connection)
  // 2. Firebase Cloud Messaging
  // 3. WebSocket connection
  // 4. Polling from extension
  
  console.log('Notify extension:', data);
}
