// Email Spy - Content Script for Gmail

console.log('Email Spy: Content script loaded');

// Generate unique tracking ID
function generateTrackingId() {
  return 'esp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Create tracking pixel URL
function createTrackingPixel(trackingId) {
  // IMPORTANT: Replace this URL with your actual Vercel backend URL
  // You'll get this URL after deploying to Vercel
  const trackingUrl = `https://your-tracking-server.vercel.app/track/${trackingId}`;
  
  return `<img src="${trackingUrl}" width="1" height="1" style="display:none !important; opacity:0 !important; width:1px !important; height:1px !important;" alt="" />`;
}

// Inject tracking pixel into email compose
function injectTrackingPixel(composeElement) {
  const trackingId = generateTrackingId();
  const trackingPixel = createTrackingPixel(trackingId);
  
  // Find the email body editor
  const editorElements = composeElement.querySelectorAll('[contenteditable="true"]');
  
  editorElements.forEach(editor => {
    if (!editor.dataset.trackerInjected) {
      // Insert tracking pixel at the end of the email
      const currentContent = editor.innerHTML;
      editor.innerHTML = currentContent + trackingPixel;
      editor.dataset.trackerInjected = 'true';
      
      console.log('Email Spy: Tracking pixel injected', trackingId);
      
      // Store tracking info
      storeTrackingInfo(trackingId, composeElement);
    }
  });
}

// Store tracking information
function storeTrackingInfo(trackingId, composeElement) {
  // Try to extract email details
  const subjectField = composeElement.querySelector('input[name="subjectbox"]');
  const toField = composeElement.querySelector('input[type="email"]');
  
  const emailData = {
    id: trackingId,
    subject: subjectField ? subjectField.value : 'No Subject',
    to: toField ? toField.value : 'Unknown',
    sentAt: Date.now(),
    opens: 0,
    lastOpened: null,
    locations: [],
    devices: []
  };
  
  // Save to Chrome storage
  chrome.storage.local.get(['trackedEmails'], (result) => {
    const trackedEmails = result.trackedEmails || [];
    trackedEmails.unshift(emailData);
    chrome.storage.local.set({ trackedEmails });
    
    // Notify popup
    chrome.runtime.sendMessage({ action: 'emailTracked', data: emailData });
  });
}

// Monitor for new compose windows
function monitorComposeWindows() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Look for Gmail compose windows
          const composeWindows = node.querySelectorAll('[role="dialog"]');
          composeWindows.forEach((composeWindow) => {
            // Check if this is a compose window
            if (composeWindow.querySelector('[name="subjectbox"]')) {
              console.log('Email Spy: New compose window detected');
              
              // Wait a bit for the editor to fully load
              setTimeout(() => {
                injectTrackingPixel(composeWindow);
              }, 1000);
            }
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Check for existing compose windows on load
function checkExistingComposeWindows() {
  const composeWindows = document.querySelectorAll('[role="dialog"]');
  composeWindows.forEach((composeWindow) => {
    if (composeWindow.querySelector('[name="subjectbox"]')) {
      console.log('Email Spy: Existing compose window found');
      setTimeout(() => {
        injectTrackingPixel(composeWindow);
      }, 1000);
    }
  });
}

// Monitor send button clicks
function monitorSendButton() {
  document.addEventListener('click', (e) => {
    const target = e.target;
    
    // Check if it's a send button (Gmail uses different structures)
    if (target.matches('[role="button"]') && target.textContent.includes('Send')) {
      console.log('Email Spy: Send button clicked');
      
      // Show notification
      chrome.storage.local.get(['settings'], (result) => {
        const settings = result.settings || { notifications: true };
        if (settings.notifications) {
          showNotification('Email tracked! You\'ll be notified when it\'s opened.');
        }
      });
    }
  });
}

// Show in-page notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #0d0208;
    color: #00ff41;
    padding: 16px 24px;
    border-radius: 8px;
    border: 1px solid #00ff41;
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
    z-index: 999999;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = '👁️ ' + message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize
console.log('Email Spy: Initializing...');

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Wait for Gmail to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      checkExistingComposeWindows();
      monitorComposeWindows();
      monitorSendButton();
    }, 2000);
  });
} else {
  setTimeout(() => {
    checkExistingComposeWindows();
    monitorComposeWindows();
    monitorSendButton();
  }, 2000);
}

console.log('Email Spy: Ready to track emails!');
