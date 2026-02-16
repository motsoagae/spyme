// Email Spy - Popup JavaScript

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    
    // Add active class to clicked tab
    tab.classList.add('active');
    const tabName = tab.dataset.tab;
    document.getElementById(`${tabName}Tab`).style.display = 'block';
    
    // Load data for the tab
    if (tabName === 'tracked') {
      loadTrackedEmails();
    } else if (tabName === 'recent') {
      loadRecentActivity();
    }
  });
});

// Toggle switches
document.querySelectorAll('.toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    const setting = toggle.dataset.setting;
    const isActive = toggle.classList.contains('active');
    
    // Save setting
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      settings[setting] = isActive;
      chrome.storage.local.set({ settings });
    });
  });
});

// Clear data button
document.getElementById('clearData').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all tracking data? This cannot be undone.')) {
    chrome.storage.local.clear(() => {
      alert('All data cleared successfully!');
      location.reload();
    });
  }
});

// Load stats
function loadStats() {
  chrome.storage.local.get(['trackedEmails'], (result) => {
    const emails = result.trackedEmails || [];
    const totalSent = emails.length;
    const totalOpened = emails.filter(e => e.opens > 0).length;
    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    
    document.getElementById('totalSent').textContent = totalSent;
    document.getElementById('totalOpened').textContent = totalOpened;
    document.getElementById('openRate').textContent = `${openRate}%`;
  });
}

// Load tracked emails
function loadTrackedEmails() {
  chrome.storage.local.get(['trackedEmails'], (result) => {
    const emails = result.trackedEmails || [];
    const container = document.getElementById('trackedTab');
    
    if (emails.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📧</div>
          <div class="empty-text">No tracked emails yet</div>
          <div class="empty-subtext">
            Send an email from Gmail to start tracking opens and engagement
          </div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = emails.map(email => {
      const status = email.opens > 0 ? 'read' : 'unread';
      const statusText = email.opens > 0 ? 'Opened' : 'Unread';
      const lastOpened = email.lastOpened ? new Date(email.lastOpened).toLocaleString() : 'Never';
      
      return `
        <div class="email-item">
          <div class="email-header">
            <div class="email-subject">${email.subject || 'No Subject'}</div>
            <div class="email-status ${status}">${statusText}</div>
          </div>
          <div class="email-meta">
            <div class="email-meta-item">
              <span>📬</span>
              <span>To: ${email.to || 'Unknown'}</span>
            </div>
            <div class="email-meta-item">
              <span>👁️</span>
              <span>${email.opens} opens</span>
            </div>
            <div class="email-meta-item">
              <span>🕒</span>
              <span>${lastOpened}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  });
}

// Load recent activity
function loadRecentActivity() {
  chrome.storage.local.get(['recentActivity'], (result) => {
    const activity = result.recentActivity || [];
    const container = document.getElementById('recentTab');
    
    if (activity.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🕒</div>
          <div class="empty-text">No recent activity</div>
          <div class="empty-subtext">
            Email opens will appear here in real-time
          </div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = activity.map(item => {
      return `
        <div class="email-item">
          <div class="email-header">
            <div class="email-subject">${item.subject || 'No Subject'}</div>
            <div class="email-status read">Opened</div>
          </div>
          <div class="email-meta">
            <div class="email-meta-item">
              <span>📍</span>
              <span>${item.location || 'Unknown location'}</span>
            </div>
            <div class="email-meta-item">
              <span>📱</span>
              <span>${item.device || 'Unknown device'}</span>
            </div>
            <div class="email-meta-item">
              <span>🕒</span>
              <span>${new Date(item.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  });
}

// Load settings
function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {
      autoTrack: true,
      notifications: true,
      trackLocation: true,
      anonymous: false
    };
    
    Object.keys(settings).forEach(key => {
      const toggle = document.querySelector(`[data-setting="${key}"]`);
      if (toggle) {
        if (settings[key]) {
          toggle.classList.add('active');
        } else {
          toggle.classList.remove('active');
        }
      }
    });
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadTrackedEmails();
  loadSettings();
  
  // Refresh stats every 5 seconds
  setInterval(loadStats, 5000);
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'emailOpened') {
    loadStats();
    loadTrackedEmails();
    loadRecentActivity();
  }
});
