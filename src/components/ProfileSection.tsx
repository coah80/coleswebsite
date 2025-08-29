import React from 'react'
import { motion } from 'framer-motion'
import { useDiscord } from '../contexts/DiscordContext'

const ProfileSection: React.FC = () => {
  const { status } = useDiscord()
  
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'dnd': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }
  
  return (
    <div className="flex justify-center">
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary-500 shadow-2xl shadow-primary-500/50"
          whileHover={{ scale: 1.05 }}
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(132, 61, 255, 0.5)',
              '0 0 30px rgba(132, 61, 255, 0.8)',
              '0 0 20px rgba(132, 61, 255, 0.5)',
            ]
          }}
          transition={{ 
            boxShadow: { duration: 2, repeat: Infinity },
            scale: { type: "spring", stiffness: 300, damping: 30 }
          }}
        >
          <img
            src="/icons/colespfp.gif"
            alt="Cole's Profile"
            className="w-full h-full object-cover"
          />
          
          {/* Status indicator */}
          <motion.div
            className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-dark-900 ${getStatusColor()}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

export default ProfileSection