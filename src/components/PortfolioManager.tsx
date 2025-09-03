import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Upload, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button as ToastButton } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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

interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  live_url: string;
  github_url: string;
  tags: string;
  is_published: boolean;
  is_featured: boolean;
}

export function PortfolioManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [lastError, setLastError] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    category: "",
    live_url: "",
    github_url: "",
    tags: "",
    is_published: true,
    is_featured: false,
  });

  const copyErrorToClipboard = async () => {
    if (!lastError) {
      toast({
        title: "No error to copy",
        description: "No recent error available",
        variant: "destructive"
      });
      return;
    }
    
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: lastError.message,
        stack: lastError.stack,
        name: lastError.name,
        cause: lastError.cause,
        details: lastError.details || lastError.error_description || lastError.hint,
        code: lastError.code,
        severity: lastError.severity
      },
      context: {
        operation: 'save portfolio item',
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      },
      formData: formData,
      projectData: lastError.projectData || 'not available'
    };

    const logText = JSON.stringify(errorLog, null, 2);
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(logText);
        toast({
          title: "Log copied!",
          description: "Error details copied to clipboard",
        });
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = logText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({
          title: "Log copied!",
          description: "Error details copied to clipboard (fallback method)",
        });
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Always fallback: show error in console for manual copy
      console.log('ERROR LOG TO COPY:');
      console.log(logText);
      toast({
        title: "Copy failed - Check console",
        description: "Error details logged to console for manual copy",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      console.log('Attempting direct database fetch...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Direct fetch result:', { data, error });

      if (error) throw error;
      setProjects(data || []);
      console.log('Successfully loaded projects:', data?.length || 0);
    } catch (error) {
      console.error('Error fetching projects:', error);
      
      // Store detailed error information
      const detailedError = {
        ...error,
        operation: 'fetch',
        timestamp: new Date().toISOString()
      };
      setLastError(detailedError);
      
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
        action: (
          <ToastButton 
            variant="outline" 
            size="sm" 
            onClick={copyErrorToClipboard}
          >
            Copy Log
          </ToastButton>
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = fileName;

    console.log('Uploading file:', { fileName, filePath, fileSize: file.size, fileType: file.type });

    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portfolio')
      .getPublicUrl(filePath);

    console.log('Upload successful, public URL:', publicUrl);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let projectData: any = null;

    try {
      let imageUrl = editingProject?.image_url || null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      projectData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        image_url: imageUrl,
        live_url: formData.live_url || null,
        github_url: formData.github_url || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
      };

      if (editingProject) {
        console.log('Attempting direct database update...');
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Portfolio item updated successfully",
        });
      } else {
        console.log('Attempting direct database insert...');
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Portfolio item created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingProject(null);
      setImageFile(null);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      
      // Store detailed error information
      const detailedError = {
        ...error,
        projectData: projectData,
        timestamp: new Date().toISOString(),
        formData: { ...formData },
        editingProject: editingProject?.id || null
      };
      setLastError(detailedError);
      
      toast({
        title: "Error",
        description: "Failed to save portfolio item",
        variant: "destructive",
        action: (
          <ToastButton 
            variant="outline" 
            size="sm" 
            onClick={copyErrorToClipboard}
          >
            Copy Log
          </ToastButton>
        ),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;

    try {
      console.log('Attempting direct database delete...');
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Portfolio item deleted successfully",
      });
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      
      // Store detailed error information
      const detailedError = {
        ...error,
        operation: 'delete',
        projectId,
        timestamp: new Date().toISOString()
      };
      setLastError(detailedError);
      
      toast({
        title: "Error",
        description: "Failed to delete portfolio item",
        variant: "destructive",
        action: (
          <ToastButton 
            variant="outline" 
            size="sm" 
            onClick={copyErrorToClipboard}
          >
            Copy Log
          </ToastButton>
        ),
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || "",
      category: project.category,
      live_url: project.live_url || "",
      github_url: project.github_url || "",
      tags: project.tags?.join(', ') || "",
      is_published: project.is_published,
      is_featured: project.is_featured,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      live_url: "",
      github_url: "",
      tags: "",
      is_published: true,
      is_featured: false,
    });
  };

  const handleNewProject = () => {
    setEditingProject(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div>Loading portfolio items...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portfolio Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewProject}>
              <Plus className="h-4 w-4 mr-2" />
              Add Portfolio Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Web Development, Mobile App, Design"
                  required
                />
              </div>

              <div>
                <Label htmlFor="image">Project Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                {editingProject?.image_url && !imageFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current image will be kept if no new image is selected
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="live_url">Live URL (Optional)</Label>
                <Input
                  id="live_url"
                  type="url"
                  value={formData.live_url}
                  onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="github_url">GitHub URL (Optional)</Label>
                <Input
                  id="github_url"
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="React, TypeScript, Tailwind CSS"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  />
                  <span>Published</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                  <span>Featured</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      {editingProject ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingProject ? 'Update' : 'Create'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No portfolio items found. Add your first project!
              </p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {project.title}
                      {project.is_featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                      {!project.is_published && (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.category}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {project.image_url && (
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1">
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex gap-2 mb-2">
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Live Demo
                        </a>
                      )}
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          GitHub
                        </a>
                      )}
                    </div>
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}