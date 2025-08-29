import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { DiscordPresence, ActivityLog, CurrentActivity } from '../types/discord'

interface DiscordContextType {
  status: string
  currentActivity: CurrentActivity | null
  activityLogs: ActivityLog[]
  isLoading: boolean
  error: string | null
}

const DiscordContext = createContext<DiscordContextType | undefined>(undefined)

export const useDiscord = () => {
  const context = useContext(DiscordContext)
  if (!context) {
    throw new Error('useDiscord must be used within a DiscordProvider')
  }
  return context
}

// Get configuration from environment variables
const DISCORD_USER_ID = import.meta.env.VITE_DISCORD_USER_ID
const FIREBASE_BASE = import.meta.env.VITE_FIREBASE_DATABASE_URL
const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY

if (!DISCORD_USER_ID || !FIREBASE_BASE || !API_KEY) {
  console.error('Missing required environment variables. Please check your .env file.')
}

export const DiscordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState('offline')
  const [currentActivity, setCurrentActivity] = useState<CurrentActivity | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<WebSocket | null>(null)

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const fetchActivityLogs = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`${FIREBASE_BASE}/users/${DISCORD_USER_ID}.json?auth=${API_KEY}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }

      const userData = await response.json()
      console.log('Firebase data:', userData)

      const allLogs: ActivityLog[] = []

      // Process music logs
      if (userData?.spotify_logs) {
        const musicLogs = Object.entries(userData.spotify_logs).map(([key, log]: [string, any]) => ({
          id: `music-${key}`,
          type: 'music' as const,
          title: log.song || log.title || 'Unknown Track',
          artist: log.artist || 'Unknown Artist',
          album: log.album || '',
          image: log.album_art_url || log.image || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=64',
          url: log.track_id ? `https://open.spotify.com/track/${log.track_id}` : undefined,
          timestamp: log.timestamp || Date.now(),
          details: log.album || ''
        }))
        allLogs.push(...musicLogs)
      }

      // Process game logs
      if (userData?.game_logs) {
        const gameLogs = Object.entries(userData.game_logs).map(([key, log]: [string, any]) => ({
          id: `game-${key}`,
          type: 'game' as const,
          title: log.name || log.title || 'Unknown Game',
          details: log.details || log.state || '',
          image: log.application_id 
            ? `https://cdn.discordapp.com/app-icons/${log.application_id}/${log.application_id}.png?size=64`
            : 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=64',
          timestamp: log.timestamp || Date.now()
        }))
        allLogs.push(...gameLogs)
      }

      // Sort by timestamp (newest first)
      allLogs.sort((a, b) => b.timestamp - a.timestamp)

      setActivityLogs(allLogs)
      console.log('Processed activity logs:', allLogs)
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
      setError('Failed to load activity data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDiscordData = useCallback((data: DiscordPresence) => {
    console.log('Discord data received:', data)
    setStatus(data.discord_status || 'offline')

    let activity: CurrentActivity | null = null

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
        image: spotify.album_art_url,
        url: spotify.track_id ? `https://open.spotify.com/track/${spotify.track_id}` : undefined,
        progress: {
          current: formatTime(elapsed),
          total: formatTime(total),
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
            ? `https://cdn.discordapp.com/app-icons/${game.application_id}/${game.application_id}.png?size=64`
            : undefined
        }
      }
    }

    setCurrentActivity(activity)
  }, [])

  const connectWebSocket = useCallback(() => {
    if (!DISCORD_USER_ID || !API_KEY) {
      setError('Discord configuration missing')
      setIsLoading(false)
      return
    }

    if (socket) {
      socket.close()
    }

    const ws = new WebSocket('wss://api.lanyard.rest/socket')
    
    ws.onopen = () => {
      console.log('Discord WebSocket connected')
      setError(null)
      ws.send(JSON.stringify({
        op: 2,
        d: {
          subscribe_to_id: DISCORD_USER_ID,
          api_key: API_KEY
        }
      }))
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('WebSocket message:', message)
        
        if (message.t === 'INIT_STATE' || message.t === 'PRESENCE_UPDATE') {
          handleDiscordData(message.d)
        }
        
        if (message.op === 1) {
          ws.send(JSON.stringify({
            op: 2,
            d: {
              subscribe_to_id: DISCORD_USER_ID,
              api_key: API_KEY
            }
          }))
        }
      } catch (error) {
        console.error('Error handling Discord message:', error)
      }
    }

    ws.onclose = () => {
      console.log('Discord WebSocket closed, reconnecting in 5 seconds')
      setError('Connection lost, reconnecting...')
      setTimeout(connectWebSocket, 5000)
    }

    ws.onerror = (error) => {
      console.error('Discord WebSocket error:', error)
      setError('Connection error')
    }

    setSocket(ws)
  }, [socket, handleDiscordData])

  useEffect(() => {
    fetchActivityLogs()
    connectWebSocket()

    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [])

  return (
    <DiscordContext.Provider value={{
      status,
      currentActivity,
      activityLogs,
      isLoading,
      error
    }}>
      {children}
    </DiscordContext.Provider>
  )
}