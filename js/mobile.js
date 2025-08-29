// Mobile-specific JavaScript
console.log('Mobile optimizations loaded');

document.addEventListener('DOMContentLoaded', () => {
  // Apply mobile fixes immediately
  if (typeof isMobile !== 'undefined' && isMobile) {
    console.log("Applying mobile optimizations");
    applyMobileFixes();
  }

  function applyMobileFixes() {
    // Fix profile picture and status dot positioning
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

    // Center discord activity
    const discordBox = document.getElementById('discord-activity');
    if (discordBox) {
      discordBox.style.margin = '5px auto';
      discordBox.style.textAlign = 'center';
      discordBox.style.maxWidth = '280px';
      discordBox.style.alignSelf = 'center';
    }

    // Adjust card height
    const card = document.getElementById('main-card');
    if (card) {
      const viewportHeight = window.innerHeight;
      card.style.maxHeight = `${viewportHeight * 0.85}px`;
    }
  }
  
  // Reapply fixes on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(applyMobileFixes, 100);
  });
  
  // Fix tab switching on mobile
  document.querySelectorAll('.card-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setTimeout(applyMobileFixes, 50);
    });
  });
});