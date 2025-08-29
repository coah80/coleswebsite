import React from 'react'
import { motion } from 'framer-motion'

interface ProfileCardProps {
  children: React.ReactNode
}

const ProfileCard: React.FC<ProfileCardProps> = ({ children }) => {
  return (
    <motion.div
      className="glass-card p-8 relative overflow-hidden"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-purple-500/10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

export default ProfileCard