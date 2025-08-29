// Import CSS
import './index.css'

// Discord Integration
class DiscordIntegration {
  constructor() {
    this.userId = '761701756119547955'
    this.apiKey = '1cf73df572dac3f3ce085aa2b4d6ef83'
    this.firebaseBase = 'https://cole-logs-a8c81-default-rtdb.firebaseio.com'
    this.socket = null
    this.status = 'offline'
    this.currentActivity = null
    this.activityLogs = []
    this.isLoading = true
    
    this.init()
  }
  
  async init() {
    await this.fetchActivityLogs()
    this.connectWebSocket()
  }
  
  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  async fetchActivityLogs() {
    try {
      const [musicRes, gameRes] = await Promise.all([
        fetch(`${this.firebaseBase}/musicLogs.json`),
        fetch(`${this.firebaseBase}/gameLogs.json`)
      ])
      
      const musicData = await musicRes.json()
      const gameData = await gameRes.json()
      
      const musicLogs = (Array.isArray(musicData) ? musicData : Object.values(musicData || {}))
        .filter(Boolean)
        .map(log => ({ ...log, type: 'music' }))
      
      const gameLogs = (Array.isArray(gameData) ? gameData : Object.values(gameData || {}))
        .filter(Boolean)
        .map(log => ({ ...log, type: 'game' }))
      
      this.activityLogs = [...musicLogs, ...gameLogs]
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((log, index) => ({ ...log, id: `${log.type}-${index}` }))
      
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
    } finally {
      this.isLoading = false
      this.updateActivityDisplay()
    }
  }
  
  handleDiscordData(data) {
    this.status = data.discord_status || 'offline'
    this.updateStatusDisplay()
    
    let activity = null
    
    // Handle Spotify
    if (data.spotify) {
      const spotify = data.spotify
      const now = Date.now()
      const elapsed = now - (spotify.timestamps?.start || now)
      const total = (spotify.timestamps?.end || now) - (spotify.timestamps?.start || now)
      const percentage = Math.min(Math.max((elapsed / total) * 100, 0), 100)
      
      activity = {
        type: 'spotify',
        title: spotify.song || 'Unknown Track',
        artist: spotify.artist || 'Unknown Artist',
        details: spotify.album || 'Unknown Album',
        image: spotify.album_art_url || '/icons/spotify.png',
        url: spotify.track_id ? `https://open.spotify.com/track/${spotify.track_id}` : undefined,
        progress: {
          current: this.formatTime(elapsed),
          total: this.formatTime(total),
          percentage: Math.round(percentage)
        }
      }
    }
    // Handle Games
    else if (data.activities?.length) {
      const game = data.activities.find(a => a.type === 0 && a.name !== 'Custom Status')
      if (game) {
        activity = {
          type: 'game',
          title: game.name || 'Playing a game',
          details: game.details || '',
          image: game.application_id 
            ? `https://dcdn.dstn.to/app-icons/${game.application_id}?ext=webp&size=64`
            : '/icons/discord.svg'
        }
      }
    }
    
    this.currentActivity = activity
    this.updateActivityDisplay()
  }
  
  connectWebSocket() {
    if (this.socket) {
      this.socket.close()
    }
    
    this.socket = new WebSocket('wss://api.lanyard.rest/socket')
    
    this.socket.onopen = () => {
      console.log('Discord WebSocket connected')
      this.socket.send(JSON.stringify({
        op: 2,
        d: {
          subscribe_to_id: this.userId,
          api_key: this.apiKey
        }
      }))
    }
    
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        if (message.t === 'INIT_STATE' || message.t === 'PRESENCE_UPDATE') {
          this.handleDiscordData(message.d)
        }
        
        if (message.op === 1) {
          this.socket.send(JSON.stringify({
            op: 2,
            d: {
              subscribe_to_id: this.userId,
              api_key: this.apiKey
            }
          }))
        }
      } catch (error) {
        console.error('Error handling Discord message:', error)
      }
    }
    
    this.socket.onclose = () => {
      console.log('Discord WebSocket closed, reconnecting in 5 seconds')
      setTimeout(() => this.connectWebSocket(), 5000)
    }
    
    this.socket.onerror = (error) => {
      console.error('Discord WebSocket error:', error)
    }
  }
  
  updateStatusDisplay() {
    const statusIndicator = document.querySelector('.status-indicator')
    if (statusIndicator) {
      statusIndicator.className = `status-indicator status-${this.status}`
    }
  }
  
  updateActivityDisplay() {
    const activityContainer = document.querySelector('.discord-activity')
    if (!activityContainer) return
    
    if (this.isLoading) {
      activityContainer.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span style="margin-left: 0.75rem; color: #94a3b8;">Loading activity...</span>
        </div>
      `
      return
    }
    
    if (!this.currentActivity) {
      activityContainer.innerHTML = `
        <div class="activity-content" style="justify-content: center; text-align: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem; color: #94a3b8;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <span>Currently working on YouTube content!</span>
          </div>
        </div>
      `
      return
    }
    
    const isSpotify = this.currentActivity.type === 'spotify'
    const iconSvg = isSpotify 
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 14.5c-.3 0-.5-.2-.7-.5-1.8-2.1-4.9-2.3-8.1-1.3-.2.1-.5 0-.6-.2-.1-.2 0-.5.2-.6 3.8-1.2 7.4-.9 9.6 1.5.2.2.2.5 0 .7-.1.2-.3.4-.4.4zm1-2.7c-.4 0-.6-.3-.8-.6-2.1-2.5-5.6-3.2-9.4-1.8-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 4.4-1.6 8.4-.8 11 2.1.2.3.2.7-.1.9-.2.3-.3.5-.4.5zm.9-2.8c-2.7-3.2-7.1-3.5-9.7-1.9-.4.2-.8 0-1-.4-.2-.4 0-.8.4-1 3.1-1.9 8.2-1.5 11.4 2.2.3.3.2.8-.1 1.1-.3.2-.7.2-1 0z"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
    
    let progressHtml = ''
    if (isSpotify && this.currentActivity.progress) {
      const { current, total, percentage } = this.currentActivity.progress
      progressHtml = `
        <div class="progress-container">
          <span>${current}</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
          <span>${total}</span>
        </div>
      `
    }
    
    activityContainer.innerHTML = `
      <div class="activity-content">
        <div class="activity-image">
          <img src="${this.currentActivity.image || '/icons/discord.svg'}" alt="${this.currentActivity.title}" 
               onerror="this.src='/icons/discord.svg'">
          <div class="activity-icon ${isSpotify ? 'spotify' : 'game'}">
            ${iconSvg}
          </div>
        </div>
        
        <div class="activity-info">
          <h4>${this.currentActivity.title}</h4>
          ${this.currentActivity.artist ? `<p class="artist">${this.currentActivity.artist}</p>` : ''}
          ${this.currentActivity.details ? `<p class="details">${this.currentActivity.details}</p>` : ''}
          ${progressHtml}
        </div>
      </div>
    `
  }
}

// Tab Navigation
class TabNavigation {
  constructor() {
    this.activeTab = 'home'
    this.tabs = ['home', 'activity', 'projects']
    this.init()
  }
  
  init() {
    this.createTabButtons()
    this.showTab(this.activeTab)
  }
  
  createTabButtons() {
    const tabNav = document.querySelector('.tab-navigation')
    if (!tabNav) return
    
    const icons = {
      home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>',
      activity: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>',
      projects: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2" ry="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>'
    }
    
    tabNav.innerHTML = this.tabs.map(tab => `
      <button class="tab-button ${tab === this.activeTab ? 'active' : ''}" data-tab="${tab}">
        ${icons[tab]}
        <span>${tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
      </button>
    `).join('')
    
    // Add click listeners
    tabNav.addEventListener('click', (e) => {
      const button = e.target.closest('.tab-button')
      if (button) {
        const tab = button.dataset.tab
        this.switchTab(tab)
      }
    })
  }
  
  switchTab(tab) {
    if (this.activeTab === tab) return
    
    // Update button states
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab)
    })
    
    // Hide current tab
    const currentContent = document.querySelector(`#${this.activeTab}-tab`)
    if (currentContent) {
      currentContent.style.opacity = '0'
      currentContent.style.transform = 'translateX(20px)'
      
      setTimeout(() => {
        currentContent.classList.add('hidden')
        this.showTab(tab)
      }, 150)
    } else {
      this.showTab(tab)
    }
    
    this.activeTab = tab
  }
  
  showTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden')
    })
    
    // Show selected tab
    const tabContent = document.querySelector(`#${tab}-tab`)
    if (tabContent) {
      tabContent.classList.remove('hidden')
      tabContent.style.opacity = '0'
      tabContent.style.transform = 'translateX(-20px)'
      
      setTimeout(() => {
        tabContent.style.opacity = '1'
        tabContent.style.transform = 'translateX(0)'
      }, 50)
    }
    
    // Load tab-specific content
    if (tab === 'activity') {
      this.loadActivityTab()
    } else if (tab === 'projects') {
      this.loadProjectsTab()
    }
  }
  
  loadActivityTab() {
    const activityList = document.querySelector('.activity-list')
    if (!activityList || !window.discord) return
    
    if (window.discord.isLoading) {
      activityList.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
      `
      return
    }
    
    const logs = window.discord.activityLogs.slice(0, 20) // Show first 20 items
    
    if (logs.length === 0) {
      activityList.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
          </svg>
          <p>No recent activity found.</p>
        </div>
      `
      return
    }
    
    activityList.innerHTML = logs.map(log => {
      const isMusic = log.type === 'music'
      const icon = isMusic 
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
      
      const date = new Date(log.timestamp).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago'
      })
      
      return `
        <div class="activity-item">
          <div class="activity-item-content">
            <div class="activity-item-image">
              <img src="${log.image || '/icons/discord.svg'}" alt="${log.title}" 
                   onerror="this.src='/icons/discord.svg'">
              <div class="activity-icon ${isMusic ? 'spotify' : 'game'}">
                ${icon}
              </div>
            </div>
            
            <div class="activity-item-info">
              <div class="activity-item-title">${log.title}</div>
              ${log.artist ? `<div class="activity-item-artist">${log.artist}${log.album ? ` • ${log.album}` : ''}</div>` : ''}
              ${log.details ? `<div class="activity-item-details">${log.details}</div>` : ''}
              <div class="activity-item-date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>${date}</span>
              </div>
            </div>
            
            <div class="activity-type-badge ${isMusic ? 'music' : 'game'}">
              ${isMusic ? 'Music' : 'Game'}
            </div>
          </div>
        </div>
      `
    }).join('')
  }
  
  loadProjectsTab() {
    const projectsContainer = document.querySelector('#projects-tab .projects-grid')
    if (!projectsContainer) return
    
    const projects = [
      {
        title: 'YouTube Thumbnails',
        description: 'Eye-catching thumbnail designs that boost click-through rates and engagement for content creators',
        image: 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=600',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
        color: 'linear-gradient(135deg, #ef4444, #f97316)'
      },
      {
        title: 'Video Editing',
        description: 'Professional video editing with smooth transitions, effects, and compelling storytelling',
        image: 'https://images.pexels.com/photos/3945313/pexels-photo-3945313.jpeg?auto=compress&cs=tinysrgb&w=600',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>',
        color: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
      },
      {
        title: 'Content Creation',
        description: 'Full-service content creation from concept development to final polished product',
        image: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=600',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
        color: 'linear-gradient(135deg, #10b981, #06b6d4)'
      }
    ]
    
    projectsContainer.innerHTML = projects.map(project => `
      <div class="project-card">
        <div class="project-image">
          <img src="${project.image}" alt="${project.title}">
          <div class="project-overlay"></div>
          <div class="project-icon" style="background: ${project.color};">
            ${project.icon}
          </div>
        </div>
        
        <div class="project-content">
          <h3 class="project-title">${project.title}</h3>
          <p class="project-description">${project.description}</p>
          
          <a href="#" class="project-link">
            <span>View Work</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15,3 21,3 21,9"/>
              <line x1="10" x2="21" y1="14" y2="3"/>
            </svg>
          </a>
        </div>
      </div>
    `).join('') + `
      <div class="project-card" style="border: 2px dashed rgba(156, 110, 255, 0.3);">
        <div class="project-content" style="text-align: center; padding: 3rem 1.5rem;">
          <div style="width: 4rem; height: 4rem; margin: 0 auto 1rem; border-radius: 50%; background: linear-gradient(135deg, var(--primary-500), var(--primary-600)); display: flex; align-items: center; justify-content: center; animation: spin 20s linear infinite;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="color: white;">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h3 class="project-title">More Projects</h3>
          <p class="project-description">Amazing new projects coming soon!</p>
          <div style="margin-top: 1rem; padding: 0.5rem 1rem; background: rgba(156, 110, 255, 0.2); color: var(--primary-300); border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; animation: pulse 2s ease-in-out infinite;">
            Coming Soon
          </div>
        </div>
      </div>
    `
  }
}

// Activity Filters
class ActivityFilters {
  constructor() {
    this.activeFilter = 'all'
    this.currentPage = 1
    this.itemsPerPage = 20
    this.init()
  }
  
  init() {
    this.createFilterButtons()
    this.setupEventListeners()
  }
  
  createFilterButtons() {
    const filterContainer = document.querySelector('.filter-buttons')
    if (!filterContainer) return
    
    const filters = [
      { id: 'all', label: 'All', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/></svg>' },
      { id: 'music', label: 'Music', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' },
      { id: 'games', label: 'Games', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/></svg>' }
    ]
    
    filterContainer.innerHTML = filters.map(filter => `
      <button class="filter-button ${filter.id === this.activeFilter ? 'active' : ''}" data-filter="${filter.id}">
        ${filter.icon}
        <span>${filter.label}</span>
      </button>
    `).join('')
  }
  
  setupEventListeners() {
    const filterContainer = document.querySelector('.filter-buttons')
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.filter-button')
        if (button) {
          const filter = button.dataset.filter
          this.setFilter(filter)
        }
      })
    }
  }
  
  setFilter(filter) {
    this.activeFilter = filter
    this.currentPage = 1
    
    // Update button states
    document.querySelectorAll('.filter-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter)
    })
    
    // Update activity list
    if (window.tabNav) {
      window.tabNav.loadActivityTab()
    }
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Discord integration
  window.discord = new DiscordIntegration()
  
  // Initialize tab navigation
  window.tabNav = new TabNavigation()
  
  // Initialize activity filters
  window.activityFilters = new ActivityFilters()
  
  // Add some entrance animations
  setTimeout(() => {
    document.querySelector('.glass-card').style.opacity = '1'
    document.querySelector('.glass-card').style.transform = 'scale(1)'
  }, 100)
})

// Add CSS animations
const style = document.createElement('style')
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .glass-card {
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.5s ease;
  }
  
  .tab-content {
    transition: all 0.3s ease;
  }
`
document.head.appendChild(style)