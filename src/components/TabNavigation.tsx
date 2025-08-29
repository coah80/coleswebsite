import React from 'react'
import { motion } from 'framer-motion'
import { Home, Activity, Briefcase } from 'lucide-react'

type Tab = 'home' | 'activity' | 'projects'

interface TabNavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'activity' as const, label: 'Activity', icon: Activity },
  { id: 'projects' as const, label: 'Projects', icon: Briefcase },
]

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="inline-flex space-x-2 bg-dark-800/50 p-2 rounded-xl backdrop-blur-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${isActive 
                ? 'text-white' 
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            
            <div className="relative z-10 flex items-center space-x-2">
              <Icon size={18} />
              <span className="text-sm font-medium">{tab.label}</span>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

export default TabNavigation