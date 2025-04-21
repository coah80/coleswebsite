// Mobile-specific JavaScript

console.log('Mobile optimizations loaded');

// Fix tab heights and scrolling on mobile
document.addEventListener('DOMContentLoaded', () => {
  // Fix layout issues immediately
  fixLayoutIssues();
  
  // Then run all other fixes
  setTimeout(() => {
    applyAllFixes();
  }, 100);

  // Adjust card height based on viewport
  const adjustCardHeight = () => {
    const card = document.getElementById('main-card');
    if (card) {
      const viewportHeight = window.innerHeight;
      card.style.maxHeight = `${viewportHeight * 0.85}px`;
    }
  };
  
  // Center the tabs properly
  const centerTabs = () => {
    const tabsContainer = document.querySelector('.card-tabs');
    if (tabsContainer) {
      tabsContainer.style.position = 'static';
      
      // Make tabs evenly sized
      const tabs = tabsContainer.querySelectorAll('.card-tab');
      tabs.forEach(tab => {
        tab.style.flex = '1';
        tab.style.textAlign = 'center';
      });
    }
  };
  
  // Fix the profile picture and status dot positioning
  const fixProfileCentering = () => {
    // Fix profile picture
    const profileWrapper = document.querySelector('.status-wrapper');
    const profileImg = document.querySelector('.status-wrapper img');
    const statusDot = document.querySelector('.status-dot');
    
    if (profileWrapper && profileImg && statusDot) {
      // Set explicit profile wrapper dimensions
      profileWrapper.style.width = '86px';
      profileWrapper.style.height = '86px';
      profileWrapper.style.position = 'relative';
      profileWrapper.style.margin = '0 auto 5px auto';
      profileWrapper.style.display = 'flex';
      profileWrapper.style.justifyContent = 'center';
      profileWrapper.style.alignItems = 'center';
      
      // Center the profile image
      profileImg.style.position = 'absolute';
      profileImg.style.margin = 'auto';
      profileImg.style.top = '0';
      profileImg.style.left = '0';
      profileImg.style.right = '0';
      profileImg.style.bottom = '0';
      profileImg.style.width = '80px';
      profileImg.style.height = '80px';
      
      // Position the status dot
      statusDot.style.position = 'absolute';
      statusDot.style.bottom = '3px';
      statusDot.style.right = '3px';
      statusDot.style.zIndex = '10';
      statusDot.style.transform = 'none';
      statusDot.style.margin = '0';
      statusDot.style.padding = '0';
    }
    
    // Clear any transforms from parent elements that might mess up centering
    const leftSection = document.querySelector('#home-tab .left-section');
    const rightSection = document.querySelector('#home-tab .right-section');
    const homeTab = document.querySelector('#home-tab');
    
    if (leftSection) {
      leftSection.style.transform = 'none';
      leftSection.style.width = '100%';
      leftSection.style.margin = '0';
      leftSection.style.padding = '0';
    }
    
    if (rightSection) {
      rightSection.style.transform = 'none';
      rightSection.style.width = '100%';
      rightSection.style.margin = '0';
      rightSection.style.padding = '0';
    }
    
    if (homeTab) {
      homeTab.style.display = 'flex';
      homeTab.style.flexDirection = 'column';
      homeTab.style.alignItems = 'center';
      homeTab.style.width = '100%';
    }
  };
  
  // Fix immediate layout issues that need to be addressed right away
  function fixLayoutIssues() {
    // Directly manipulate the necessary styles to fix the most problematic issues
    const card = document.getElementById('main-card');
    if (card) {
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'center';
    }
    
    // Fix profile picture centering
    fixProfileCentering();
    
    // Make sure home tab content is centered
    const homeTab = document.getElementById('home-tab');
    if (homeTab) {
      homeTab.style.display = 'flex';
      homeTab.style.flexDirection = 'column';
      homeTab.style.alignItems = 'center';
      homeTab.style.width = '100%';
    }
    
    // Ensure content wrapper is properly aligned
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      contentWrapper.style.flexDirection = 'column';
      contentWrapper.style.alignItems = 'center';
      contentWrapper.style.width = '100%';
    }
  }
  
  // Make the profile section more compact
  const compactProfile = () => {
    const profileImg = document.querySelector('.status-wrapper img');
    const username = document.querySelector('.username');
    const intro = document.querySelector('.intro');
    const discord = document.getElementById('discord-activity');
    
    if (profileImg) profileImg.style.marginBottom = '0';
    
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
    
    if (discord) {
      discord.style.margin = '5px auto';
      discord.style.maxWidth = '280px';
      discord.style.textAlign = 'center';
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
      }, 100);
    }
  };
  
  // Apply all fixes
  const applyAllFixes = () => {
    adjustCardHeight();
    centerTabs();
    fixProfileCentering();
    compactProfile();
    makeTabsScrollable();
    fixTabHeight();
  };
  
  // Reapply on resize and orientation change
  window.addEventListener('resize', applyAllFixes);
  window.addEventListener('orientationchange', applyAllFixes);
  
  // Ensure tab content is properly sized when switching tabs
  document.querySelectorAll('.card-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setTimeout(applyAllFixes, 100);
    });
  });
  
  // Fix for music and games tabs
  const musicTab = document.getElementById('music-tab');
  const gamesTab = document.getElementById('games-tab');
  
  // Ensure proper display of music and games tabs
  if (musicTab) {
    musicTab.style.maxHeight = 'none';
    musicTab.style.overflowY = 'auto';
    musicTab.style.paddingLeft = '0';
    musicTab.style.paddingRight = '0';
    musicTab.style.width = '100%';
    
    // Make music logs more compact
    const musicLogs = musicTab.querySelector('#music-logs');
    if (musicLogs) {
      const observer = new MutationObserver(() => {
        const items = musicLogs.querySelectorAll('.music-wrapper');
        items.forEach(item => {
          const img = item.querySelector('img');
          if (img) {
            img.style.width = '50px';
            img.style.height = '50px';
          }
        });
      });
      
      observer.observe(musicLogs, { childList: true, subtree: true });
    }
  }
  
  if (gamesTab) {
    gamesTab.style.maxHeight = 'none';
    gamesTab.style.overflowY = 'auto';
    gamesTab.style.paddingLeft = '0';
    gamesTab.style.paddingRight = '0';
    gamesTab.style.width = '100%';
    
    // Make games logs more compact
    const gameLogs = gamesTab.querySelector('#game-logs');
    if (gameLogs) {
      const observer = new MutationObserver(() => {
        const items = gameLogs.querySelectorAll('.music-wrapper');
        items.forEach(item => {
          const img = item.querySelector('img');
          if (img) {
            img.style.width = '50px';
            img.style.height = '50px';
          }
        });
      });
      
      observer.observe(gameLogs, { childList: true, subtree: true });
    }
  }
  
  console.log('Mobile optimizations applied');
}); 