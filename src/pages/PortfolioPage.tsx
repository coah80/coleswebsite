import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Github, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/PageLayout';
import WarpText from '@/components/typography/WarpText';

interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  live_url: string | null;
  github_url: string | null;
  tags: string[] | null;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
}

const PortfolioPage = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      const uniqueCategories = ['All', ...new Set(data?.map(p => p.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    setIsLoading(false);
  };

  const filteredProjects = selectedCategory === 'All'
    ? projects
    : projects.filter(p => p.category === selectedCategory);

  return (
    <PageLayout title="portfolio" allowScroll={true}>
      <div className="mx-auto w-full max-w-xl flex flex-col gap-5 sm:gap-6 pb-8">

        {categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-shrink-0 overflow-x-auto pb-1"
          >
            {categories.map((category, index) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.1 + index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 sm:px-3 py-2 sm:py-1.5 text-[10px] sm:text-xs font-varia lowercase rounded-xl border transition-colors duration-200 whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-ctp-mauve text-ctp-crust font-bold border-ctp-mauve'
                    : 'bg-transparent text-ctp-overlay1 border-ctp-surface1/50 hover:border-ctp-mauve/30 hover:text-ctp-text'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>
        )}


        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-ctp-surface0/30 rounded-2xl animate-pulse" />
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-ctp-surface0/40 border border-ctp-surface1/50 rounded-xl sm:rounded-2xl overflow-hidden transition-colors duration-300 hover:border-ctp-surface2 hover:bg-ctp-surface0/65"
                >

                {project.is_featured && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-ctp-mauve text-ctp-crust text-[10px] sm:text-xs font-data rounded-lg">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                    <span className="hidden sm:inline">featured</span>
                  </div>
                )}


                {project.image_url && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}


                <div className="p-2 sm:p-3">
                  <WarpText className="font-heading font-bold text-xs sm:text-sm text-ctp-text mb-0.5 sm:mb-1">
                    {project.title}
                  </WarpText>

                  {project.description && (
                    <p className="text-[10px] sm:text-xs text-ctp-subtext1 mb-1.5 sm:mb-2 line-clamp-1 sm:line-clamp-2">
                      {project.description}
                    </p>
                  )}


                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 sm:gap-1 mb-1.5 sm:mb-2">
                      {project.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] font-data text-ctp-overlay1 bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}


                  <div className="flex items-center gap-2 sm:gap-3">
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-data text-ctp-text hover:text-ctp-mauve transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        view
                      </a>
                    )}
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-data text-ctp-text hover:text-ctp-mauve transition-colors"
                      >
                        <Github className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        code
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          )}
        </div>

        {filteredProjects.length === 0 && !isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-4xl font-black text-ctp-surface2 mb-2">:(</p>
              <p className="text-ctp-overlay1 font-body text-sm">no projects to show yet</p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PortfolioPage;
