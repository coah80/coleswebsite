// Mobile-specific JavaScript

console.log('Mobile optimizations loaded');

// Fix tab heights and scrolling on mobile
document.addEventListener('DOMContentLoaded', () => {
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
  
  // Fix the status dot position
  const fixStatusDot = () => {
    const statusDot = document.querySelector('.status-dot');
    const statusWrapper = document.querySelector('.status-wrapper');
    
    if (statusDot && statusWrapper) {
      const wrapperRect = statusWrapper.getBoundingClientRect();
      statusDot.style.position = 'absolute';
      statusDot.style.bottom = '0px';
      statusDot.style.right = '0px';
    }
  };
  
  // Make the profile section more compact
  const compactProfile = () => {
    const profileImg = document.querySelector('.status-wrapper img');
    const username = document.querySelector('.username');
    const discord = document.getElementById('discord-activity');
    
    if (profileImg) profileImg.style.marginBottom = '5px';
    if (username) username.style.marginBottom = '5px';
    if (discord) {
      discord.style.maxWidth = '280px';
      discord.style.marginTop = '5px';
    }
  };
  
  // Make the tab content scrollable
  const makeTabsScrollable = () => {
    document.querySelectorAll('.tab-page').forEach(tab => {
      tab.style.overflowY = 'auto';
      tab.style.webkitOverflowScrolling = 'touch';
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
    fixStatusDot();
    compactProfile();
    makeTabsScrollable();
    fixTabHeight();
  };
  
  // Apply fixes initially
  applyAllFixes();
  
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
    
    // Make music logs more compact
    const musicLogs = musicTab.querySelector('#music-logs');
    if (musicLogs) {
      const observer = new MutationObserver(() => {
        const items = musicLogs.querySelectorAll('.music-wrapper');
        items.forEach(item => {
          const img = item.querySelector('img');
          if (img) img.style.width = '50px';
          if (img) img.style.height = '50px';
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
    
    // Make games logs more compact
    const gameLogs = gamesTab.querySelector('#game-logs');
    if (gameLogs) {
      const observer = new MutationObserver(() => {
        const items = gameLogs.querySelectorAll('.music-wrapper');
        items.forEach(item => {
          const img = item.querySelector('img');
          if (img) img.style.width = '50px';
          if (img) img.style.height = '50px';
        });
      });
      
      observer.observe(gameLogs, { childList: true, subtree: true });
    }
  }
  
  console.log('Mobile optimizations applied');
}); 