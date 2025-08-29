import React from 'react'
import { motion } from 'framer-motion'
import { Music, Gamepad2, Clock } from 'lucide-react'
import { useDiscord } from '../contexts/DiscordContext'

const DiscordActivity: React.FC = () => {
  const { currentActivity, isLoading } = useDiscord()
  
  if (isLoading) {
    return (
      <motion.div
        className="glass-card p-4 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <span className="ml-3 text-slate-400">Loading activity...</span>
      </motion.div>
    )
  }
  
  if (!currentActivity) {
    return (
      <motion.div
        className="glass-card p-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center space-x-2 text-slate-400">
          <Clock size={18} />
          <span>Currently working on YouTube content!</span>
        </div>
      </motion.div>
    )
  }
  
  const isSpotify = currentActivity.type === 'spotify'
  const Icon = isSpotify ? Music : Gamepad2
  
  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={currentActivity.image || '/icons/discord.svg'}
            alt={currentActivity.title}
            className="w-14 h-14 rounded-lg object-cover border-2 border-primary-500/50"
            onError={(e) => {
              e.currentTarget.src = '/icons/discord.svg'
            }}
          />
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
            isSpotify ? 'bg-green-500' : 'bg-indigo-500'
          }`}>
            <Icon size={12} className="text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">
            {currentActivity.title}
          </h4>
          {currentActivity.artist && (
            <p className="text-slate-400 text-sm truncate">
              {currentActivity.artist}
            </p>
          )}
          {currentActivity.details && (
            <p className="text-slate-500 text-xs truncate">
              {currentActivity.details}
            </p>
          )}
          
          {isSpotify && currentActivity.progress && (
            <div className="mt-2 flex items-center space-x-2 text-xs text-slate-400">
              <span>{currentActivity.progress.current}</span>
              <div className="flex-1 bg-dark-700 rounded-full h-1">
                <motion.div
                  className="bg-primary-500 h-1 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentActivity.progress.percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span>{currentActivity.progress.total}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default DiscordActivity