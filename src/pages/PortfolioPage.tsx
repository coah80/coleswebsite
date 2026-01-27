import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
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

  useEffect(() => {
    if (!gridRef.current || isLoading) return;
    const cards = gridRef.current.querySelectorAll('.project-card');
    
    gsap.set(cards, { opacity: 0, y: 30, scale: 0.95 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.4,
      stagger: 0.08,
      ease: 'back.out(1.4)',
      delay: 1.8
    });
  }, [isLoading]);

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
    <PageLayout title="portfolio">
      <div className="h-full flex flex-col overflow-hidden">
        {/* Category filters */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-shrink-0 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-mono lowercase rounded-full border transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-muted-foreground border-border/50 hover:border-foreground hover:text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Projects grid - fits to available space */}
        <div 
          ref={gridRef}
          className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 auto-rows-min overflow-y-auto pb-4"
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-card/30 rounded-2xl animate-pulse" />
            ))
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                className="project-card group relative bg-card/30 border border-border/20 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:border-border/50 hover:bg-card/50 hover:scale-[1.02]"
              >
                {/* Featured badge */}
                {project.is_featured && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-foreground/90 text-background text-[10px] sm:text-xs font-mono rounded">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                    <span className="hidden sm:inline">featured</span>
                  </div>
                )}

                {/* Image */}
                {project.image_url && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img 
                      src={project.image_url}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-2 sm:p-3">
                  <WarpText className="font-bold text-xs sm:text-sm text-foreground mb-0.5 sm:mb-1">
                    {project.title}
                  </WarpText>
                  
                  {project.description && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 line-clamp-1 sm:line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 sm:gap-1 mb-1.5 sm:mb-2">
                      {project.tags.slice(0, 2).map((tag, i) => (
                        <span 
                          key={i}
                          className="px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] font-mono text-muted-foreground bg-muted/30 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-mono text-foreground hover:text-accent transition-colors"
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
                        className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-mono text-foreground hover:text-accent transition-colors"
                      >
                        <Github className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        code
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredProjects.length === 0 && !isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-black text-foreground/10 mb-2">:(</p>
              <p className="text-muted-foreground font-mono text-sm">no projects to show yet</p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PortfolioPage;
