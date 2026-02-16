// Email Spy - Background Service Worker

console.log('Email Spy: Background service worker started');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Email Spy: Extension installed');
    
    // Set default settings
    chrome.storage.local.set({
      settings: {
        autoTrack: true,
        notifications: true,
        trackLocation: true,
        anonymous: false
      },
      trackedEmails: [],
      recentActivity: []
    });
    
    // Open welcome page (you can create this later)
    // chrome.tabs.create({ url: 'https://your-website.com/welcome' });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Email Spy: Message received', request);
  
  if (request.action === 'emailTracked') {
    handleEmailTracked(request.data);
  } else if (request.action === 'emailOpened') {
    handleEmailOpened(request.data);
  }
  
  sendResponse({ success: true });
  return true;
});

// Handle when an email is tracked (sent with tracking pixel)
function handleEmailTracked(emailData) {
  console.log('Email Spy: Email tracked', emailData);
  
  // Show notification if enabled
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {};
    if (settings.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Email Tracked',
        message: `Now tracking: ${emailData.subject}`,
        priority: 1
      });
    }
  });
}

// Handle when an email is opened (tracking pixel loaded)
function handleEmailOpened(trackingData) {
  console.log('Email Spy: Email opened', trackingData);
  
  // Update tracked email data
  chrome.storage.local.get(['trackedEmails', 'recentActivity', 'settings'], (result) => {
    const trackedEmails = result.trackedEmails || [];
    const recentActivity = result.recentActivity || [];
    const settings = result.settings || {};
    
    // Find the email
    const emailIndex = trackedEmails.findIndex(e => e.id === trackingData.trackingId);
    
    if (emailIndex !== -1) {
      // Update email data
      trackedEmails[emailIndex].opens += 1;
      trackedEmails[emailIndex].lastOpened = Date.now();
      
      if (settings.trackLocation && trackingData.location) {
        trackedEmails[emailIndex].locations.push(trackingData.location);
      }
      
      if (trackingData.device) {
        trackedEmails[emailIndex].devices.push(trackingData.device);
      }
      
      // Add to recent activity
      recentActivity.unshift({
        subject: trackedEmails[emailIndex].subject,
        to: trackedEmails[emailIndex].to,
        location: trackingData.location,
        device: trackingData.device,
        timestamp: Date.now()
      });
      
      // Keep only last 50 activities
      if (recentActivity.length > 50) {
        recentActivity.pop();
      }
      
      // Save updated data
      chrome.storage.local.set({ trackedEmails, recentActivity });
      
      // Show notification
      if (settings.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '👁️ Email Opened!',
          message: `${trackedEmails[emailIndex].subject} was just opened!`,
          priority: 2
        });
      }
      
      // Notify popup if it's open
      chrome.runtime.sendMessage({ action: 'emailOpened', data: trackingData });
    }
  });
}

console.log('Email Spy: Background service ready');
