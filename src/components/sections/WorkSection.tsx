import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink, Github, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SlamText from '@/components/typography/SlamText';

gsap.registerPlugin(ScrollTrigger);

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

const WorkSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const hasAnimated = useRef(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!projectsRef.current || isLoading || hasAnimated.current) return;

    const cards = projectsRef.current.querySelectorAll('.project-card');
    
    gsap.set(cards, {
      y: 60,
      opacity: 0,
      scale: 0.95
    });

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 60%',
      onEnter: () => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        gsap.to(cards, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'back.out(1.4)'
        });
      },
      once: true
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
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
      
      const uniqueCategories = ['All', ...new Set(data?.map(project => project.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    setIsLoading(false);
  };

  const filteredProjects = selectedCategory === 'All' 
    ? projects 
    : projects.filter(project => project.category === selectedCategory);

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
    >
      {/* Section header */}
      <div className="text-center mb-12">
        <SlamText 
          as="h2"
          className="text-[10vw] md:text-[8vw] lg:text-[6vw] font-black lowercase leading-none tracking-tight justify-center"
          scrollTrigger={true}
        >
          my work
        </SlamText>
        <p className="mt-4 text-muted-foreground font-mono text-sm md:text-base">
          projects and things i've made
        </p>
      </div>

      {/* Category filters */}
      {categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm font-mono lowercase rounded-full border transition-all duration-200 ${
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

      {/* Projects grid */}
      <div 
        ref={projectsRef}
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-card/30 rounded-lg animate-pulse" />
          ))
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="project-card group relative bg-card/30 border border-border/20 rounded-lg overflow-hidden transition-all duration-300 hover:border-border/50 hover:bg-card/50"
            >
              {/* Featured badge */}
              {project.is_featured && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 bg-foreground/90 text-background text-xs font-mono rounded">
                  <Star className="w-3 h-3 fill-current" />
                  featured
                </div>
              )}

              {/* Image */}
              {project.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-foreground/90">
                  {project.title}
                </h3>
                
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.tags.slice(0, 3).map((tag, i) => (
                      <span 
                        key={i}
                        className="px-2 py-0.5 text-xs font-mono text-muted-foreground bg-muted/30 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Links */}
                <div className="flex items-center gap-3">
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-mono text-foreground hover:text-accent transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      view
                    </a>
                  )}
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-mono text-foreground hover:text-accent transition-colors"
                    >
                      <Github className="w-4 h-4" />
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
        <p className="text-muted-foreground font-mono text-sm">no projects to show yet</p>
      )}
    </section>
  );
};

export default WorkSection;
