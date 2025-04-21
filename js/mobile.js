// Mobile-specific JavaScript

console.log('Mobile optimizations loaded');

// Fix tab heights and scrolling on mobile
document.addEventListener('DOMContentLoaded', () => {
  // Fix for the content overflow in tab pages
  const fixTabHeight = () => {
    const activeTab = document.querySelector('.tab-page[style*="display: block"]');
    const card = document.getElementById('main-card');
    
    if (activeTab && card) {
      // Set card height based on content
      setTimeout(() => {
        const viewportHeight = window.innerHeight;
        const maxHeight = Math.min(viewportHeight * 0.8, activeTab.scrollHeight + 100);
        card.style.maxHeight = `${maxHeight}px`;
        
        console.log(`Set card height to ${maxHeight}px for mobile view`);
      }, 100);
    }
  };
  
  // Apply fixes initially
  fixTabHeight();
  
  // Reapply on resize and orientation change
  window.addEventListener('resize', fixTabHeight);
  window.addEventListener('orientationchange', fixTabHeight);
  
  // Ensure tab content is properly sized when switching tabs
  document.querySelectorAll('.card-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setTimeout(fixTabHeight, 100);
    });
  });
  
  // Improve touch scrolling in tab pages
  document.querySelectorAll('.tab-page').forEach(tab => {
    tab.style.WebkitOverflowScrolling = 'touch';
  });
  
  // Fix for music and games tabs
  const musicTab = document.getElementById('music-tab');
  const gamesTab = document.getElementById('games-tab');
  
  // Ensure proper display of music and games tabs
  if (musicTab) {
    musicTab.style.maxHeight = 'none';
    musicTab.style.overflowY = 'auto';
    musicTab.style.WebkitOverflowScrolling = 'touch';
  }
  
  if (gamesTab) {
    gamesTab.style.maxHeight = 'none';
    gamesTab.style.overflowY = 'auto';
    gamesTab.style.WebkitOverflowScrolling = 'touch';
  }
  
  console.log('Mobile optimizations applied');
});

// Improve touch scrolling for Discord activity box
const discordBox = document.getElementById('discord-activity');
if (discordBox) {
  discordBox.style.WebkitOverflowScrolling = 'touch';
} 