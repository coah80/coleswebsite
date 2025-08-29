import React from 'react'
import { motion } from 'framer-motion'
import { Music, Gamepad2, ExternalLink, Calendar } from 'lucide-react'
import type { ActivityLog } from '../types/discord'

interface ActivityItemProps {
  log: ActivityLog
}

const ActivityItem: React.FC<ActivityItemProps> = ({ log }) => {
  const isMusic = log.type === 'music'
  const Icon = isMusic ? Music : Gamepad2
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago'
    })
  }
  
  return (
    <motion.div
      className="glass-card p-3 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-300"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={log.image || (isMusic ? '/icons/spotify.png' : '/icons/steam.svg')}
            alt={log.title}
            className="w-12 h-12 rounded-lg object-cover border-2 border-slate-600"
            onError={(e) => {
              e.currentTarget.src = isMusic ? '/icons/spotify.png' : '/icons/steam.svg'
            }}
          />
          <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
            isMusic ? 'bg-green-500' : 'bg-indigo-500'
          }`}>
            <Icon size={12} className="text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {isMusic && log.url ? (
              <a
                href={log.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-primary-300 transition-colors duration-200 flex items-center space-x-1 truncate"
              >
                <span className="truncate">{log.title}</span>
                <ExternalLink size={14} className="flex-shrink-0" />
              </a>
            ) : (
              <h4 className="font-semibold text-white truncate">{log.title}</h4>
            )}
          </div>
          
          {log.artist && (
            <p className="text-slate-400 text-sm truncate">
              {log.artist} {log.album && `• ${log.album}`}
            </p>
          )}
          
          {log.details && (
            <p className="text-slate-500 text-xs truncate">
              {log.details}
            </p>
          )}
          
          <div className="flex items-center space-x-1 mt-2 text-xs text-slate-500">
            <Calendar size={12} />
            <span>{formatDate(log.timestamp)}</span>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isMusic 
            ? 'bg-green-500/20 text-green-300' 
            : 'bg-indigo-500/20 text-indigo-300'
        }`}>
          {isMusic ? 'Music' : 'Game'}
        </div>
      </div>
    </motion.div>
  )
}

export default ActivityItem