// Mobile-specific JavaScript

console.log('Mobile optimizations loaded');

// Fix tab heights and scrolling on mobile
document.addEventListener('DOMContentLoaded', () => {
  // Fix critical layout issues immediately
  console.log("Applying critical mobile fixes");
  fixCriticalLayout();
  
  // Then apply all other fixes with a delay to ensure DOM is ready
  setTimeout(() => {
    console.log("Applying all mobile fixes");
    applyAllFixes();
  }, 100);

  // Fix the most critical layout issues right away
  function fixCriticalLayout() {
    // Fix profile picture and status dot positioning
    fixProfileAndStatus();
    
    // Center the discord activity display
    const discordBox = document.getElementById('discord-activity');
    if (discordBox) {
      discordBox.style.margin = '5px auto';
      discordBox.style.textAlign = 'center';
      discordBox.style.maxWidth = '280px';
      discordBox.style.alignSelf = 'center';
    }
    
    // Center everything
    document.querySelectorAll('.left-section, .right-section, .center-content, #home-tab').forEach(el => {
      if (el) {
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.width = '100%';
        el.style.margin = '0 auto';
        el.style.transform = 'none';
      }
    });
  }
  
  // Specific fix for profile picture and status dot
  function fixProfileAndStatus() {
    const profileWrapper = document.querySelector('.status-wrapper');
    const profileImg = document.querySelector('.status-wrapper img');
    const statusDot = document.querySelector('.status-dot');
    
    if (profileWrapper) {
      // Reset any transforms or positioning that might interfere
      profileWrapper.style.cssText = `
        position: relative;
        width: 86px;
        height: 86px;
        margin: 0 auto 10px auto;
        padding: 0;
        display: block;
      `;
    }
    
    if (profileImg) {
      // Use transform for precise centering
      profileImg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        border-width: 3px;
        margin: 0;
        padding: 0;
      `;
    }
    
    if (statusDot) {
      // Position the status dot at the bottom right
      statusDot.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        width: 14px;
        height: 14px;
        z-index: 10;
        margin: 0;
        padding: 0;
      `;
    }
    
    // Apply specific fixes for status dot classes
    document.querySelectorAll('.status-online, .status-idle, .status-dnd, .status-offline').forEach(dot => {
      if (dot) {
        dot.style.position = 'absolute';
        dot.style.bottom = '0';
        dot.style.right = '0';
        dot.style.padding = '0';
        dot.style.margin = '0';
      }
    });
  }

  // Adjust card height based on viewport
  const adjustCardHeight = () => {
    const card = document.getElementById('main-card');
    if (card) {
      const viewportHeight = window.innerHeight;
      card.style.maxHeight = `${viewportHeight * 0.85}px`;
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'center';
    }
  };
  
  // Center the tabs properly
  const centerTabs = () => {
    const tabsContainer = document.querySelector('.card-tabs');
    if (tabsContainer) {
      tabsContainer.style.position = 'static';
      tabsContainer.style.display = 'flex';
      tabsContainer.style.justifyContent = 'center';
      
      // Make tabs evenly sized
      const tabs = tabsContainer.querySelectorAll('.card-tab');
      tabs.forEach(tab => {
        tab.style.flex = '1';
        tab.style.textAlign = 'center';
      });
    }
  };
  
  // Make the profile section more compact
  const compactProfile = () => {
    const username = document.querySelector('.username');
    const intro = document.querySelector('.intro');
    
    if (username) {
      username.style.margin = '4px 0 2px 0';
      username.style.textAlign = 'center';
      username.style.width = '100%';
    }
    
    if (intro) {
      intro.style.margin = '2px 0 6px 0';
      intro.style.textAlign = 'center';
      intro.style.width = '100%';
    }
  };
  
  // Make the tab content scrollable
  const makeTabsScrollable = () => {
    document.querySelectorAll('.tab-page').forEach(tab => {
      tab.style.overflowY = 'auto';
      tab.style.webkitOverflowScrolling = 'touch';
      tab.style.width = '100%';
      tab.style.display = 'flex';
      tab.style.flexDirection = 'column';
      tab.style.alignItems = 'center';
    });
  };
  
  // Fix for the content overflow in tab pages
  const fixTabHeight = () => {
    const activeTab = document.querySelector('.tab-page[style*="display: block"]');
    const card = document.getElementById('main-card');
    
    if (activeTab && card) {
      // Set card height based on content
      setTimeout(() => {
        const viewportHeight = window.innerHeight;
        const maxHeight = Math.min(viewportHeight * 0.85, activeTab.scrollHeight + 50);
        card.style.maxHeight = `${maxHeight}px`;
      }, 50);
    }
  };
  
  // Apply all fixes
  const applyAllFixes = () => {
    adjustCardHeight();
    centerTabs();
    fixProfileAndStatus(); // Call our specific profile/status fix
    compactProfile();
    makeTabsScrollable();
    fixTabHeight();
    
    // Center the discord activity display again
    const discordBox = document.getElementById('discord-activity');
    if (discordBox) {
      discordBox.style.margin = '5px auto';
      discordBox.style.textAlign = 'center';
      discordBox.style.maxWidth = '280px';
      discordBox.style.alignSelf = 'center';
    }
  };
  
  // Reapply on resize and orientation change
  window.addEventListener('resize', () => {
    fixCriticalLayout();
    applyAllFixes();
  });
  
  window.addEventListener('orientationchange', () => {
    fixCriticalLayout();
    applyAllFixes();
  });
  
  // Ensure tab content is properly sized when switching tabs
  document.querySelectorAll('.card-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setTimeout(() => {
        fixCriticalLayout();
        applyAllFixes();
      }, 50);
    });
  });
  
  // Fix for activity tab
  const activityTab = document.getElementById('activity-tab');
  
  // Ensure proper display of activity tab
  if (activityTab) {
    activityTab.style.maxHeight = 'none';
    activityTab.style.overflowY = 'auto';
    activityTab.style.paddingLeft = '0';
    activityTab.style.paddingRight = '0';
    activityTab.style.width = '100%';
    
    // Make activity logs more compact
    const activityLogs = activityTab.querySelector('#activity-logs');
    if (activityLogs) {
      const observer = new MutationObserver(() => {
        const items = activityLogs.querySelectorAll('.activity-wrapper');
        items.forEach(item => {
          const img = item.querySelector('img.activity-icon');
          if (img) {
            img.style.width = '50px';
            img.style.height = '50px';
          }
        });
      });
      
      observer.observe(activityLogs, { childList: true, subtree: true });
    }
  }
  
  console.log('Mobile optimizations applied');
});

// Run an extra check after window load to catch any issues
window.addEventListener('load', () => {
  console.log("Window loaded, applying final fixes");
  
  // Fix the profile picture and status dot one more time
  const profileWrapper = document.querySelector('.status-wrapper');
  const profileImg = document.querySelector('.status-wrapper img');
  const statusDot = document.querySelector('.status-dot');
  
  if (profileWrapper) {
    profileWrapper.style.cssText = `
      position: relative;
      width: 86px;
      height: 86px;
      margin: 0 auto 10px auto;
      padding: 0;
      display: block;
    `;
  }
  
  if (profileImg) {
    profileImg.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 80px;
      border-width: 3px;
      margin: 0;
      padding: 0;
    `;
  }
  
  if (statusDot) {
    statusDot.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 14px;
      height: 14px;
      z-index: 10;
      margin: 0;
      padding: 0;
    `;
  }
  
  // Center discord box
  const discordBox = document.getElementById('discord-activity');
  if (discordBox) {
    discordBox.style.margin = '5px auto';
    discordBox.style.textAlign = 'center';
    discordBox.style.maxWidth = '280px';
    discordBox.style.alignSelf = 'center';
  }
}); 