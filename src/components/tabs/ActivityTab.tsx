import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Gamepad2, Filter } from 'lucide-react'
import { useDiscord } from '../../contexts/DiscordContext'
import ActivityItem from '../ActivityItem'

type FilterType = 'all' | 'music' | 'games'

const filters = [
  { id: 'all' as const, label: 'All', icon: Filter },
  { id: 'music' as const, label: 'Music', icon: Music },
  { id: 'games' as const, label: 'Games', icon: Gamepad2 },
]

const ActivityTab: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const { activityLogs, isLoading } = useDiscord()
  
  const filteredLogs = activityLogs.filter(log => {
    if (activeFilter === 'all') return true
    return log.type === activeFilter.slice(0, -1) // 'music' -> 'music', 'games' -> 'game'
  })
  
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gradient">Recent Activity</h2>
        
        <div className="flex items-center space-x-2">
          {filters.map((filter) => {
            const Icon = filter.icon
            const isActive = activeFilter === filter.id
            
            return (
              <motion.button
                key={filter.id}
                onClick={() => {
                  setActiveFilter(filter.id)
                  setCurrentPage(1)
                }}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' 
                    : 'bg-dark-800/50 text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={16} />
                <span className="text-sm">{filter.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {paginatedLogs.map((log, index) => (
              <motion.div
                key={`${log.id}-${log.timestamp}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <ActivityItem log={log} />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Filter size={48} className="mx-auto mb-4 opacity-50" />
              <p>No activity found for the selected filter.</p>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-700/50">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="bg-dark-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={30}>30 per page</option>
            <option value={50}>50 per page</option>
          </select>
          
          <div className="flex space-x-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1
              const isActive = currentPage === page
              
              return (
                <motion.button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`
                    w-10 h-10 rounded-lg font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-dark-800/50 text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
                    }
                  `}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {page}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityTab