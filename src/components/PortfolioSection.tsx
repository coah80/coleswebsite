import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Github, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const PortfolioSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // Fetch only published projects for public view
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      setProjects(data || []);
      
      // Extract unique categories from projects
      const uniqueCategories = ["All", ...new Set(data?.map(project => project.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredProjects = selectedCategory === "All" 
    ? projects 
    : projects.filter(project => project.category === selectedCategory);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            my work
          </h2>
          <p className="text-muted-foreground">loading projects...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            my work
          </h2>
          <p className="text-muted-foreground">no projects available yet. check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="portfolio">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
          my work
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          stuff i've made recently. video editing, some coding, whatever.
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              onClick={() => setSelectedCategory(category)}
              className="transition-smooth"
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Portfolio Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card 
            key={project.id} 
            className={`group overflow-hidden bg-card/50 border-border/30 hover:shadow-card transition-all duration-300 hover:-translate-y-2 ${
              project.is_featured ? 'ring-2 ring-accent/50' : ''
            }`}
          >
            <div className="relative overflow-hidden">
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">no image</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Action buttons */}
              <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {project.live_url && (
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8"
                    onClick={() => window.open(project.live_url!, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {project.github_url && (
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8"
                    onClick={() => window.open(project.github_url!, '_blank')}
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Featured badge */}
              {project.is_featured && (
                <div className="absolute top-3 left-3">
                  <span className="bg-accent text-accent-foreground text-xs font-medium px-2 py-1 rounded-full">
                    featured
                  </span>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="mb-2">
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                  {project.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-accent transition-colors">
                {project.title}
              </h3>
              {project.description && (
                <p className="text-muted-foreground text-sm mb-3">
                  {project.description}
                </p>
              )}
              
              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && selectedCategory !== "All" && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">no projects found in "{selectedCategory}" category.</p>
        </div>
      )}
    </div>
  );
};

export default PortfolioSection;