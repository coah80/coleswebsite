import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPlatformVisuals } from '@/lib/social-platforms';

interface SocialLink {
  id: string;
  name: string;
  handle: string;
  url: string;
  description: string | null;
  display_order: number;
  is_published: boolean;
}

const getAdminToken = () => sessionStorage.getItem('adminToken') ?? '';

const adminInvoke = async <T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke<T>('admin-operations', {
    body: { ...body, token: getAdminToken() },
  });
  if (error) throw error;
  return data as T;
};

const SocialLinksManager = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    url: '',
    description: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSocialLinks = useCallback(async () => {
    try {
      const result = await adminInvoke<{ socialLinks: SocialLink[] }>({
        operation: 'fetchSocialLinks',
      });
      setSocialLinks(result.socialLinks ?? []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch social links",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSocialLinks();
  }, [fetchSocialLinks]);

  const moveLink = async (linkId: string, direction: 'up' | 'down') => {
    const currentIndex = socialLinks.findIndex(link => link.id === linkId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= socialLinks.length) return;

    const newLinks = [...socialLinks];
    [newLinks[currentIndex], newLinks[newIndex]] = [newLinks[newIndex], newLinks[currentIndex]];

    try {
      await adminInvoke({
        operation: 'reorderSocialLinks',
        updates: [
          { id: linkId, display_order: newIndex },
          { id: newLinks[currentIndex].id, display_order: currentIndex },
        ],
      });

      setSocialLinks(newLinks);
      toast({ title: "Success", description: "Link order updated" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update link order",
        variant: "destructive",
      });
    }
  };

  const saveSocialLink = async () => {
    if (!formData.name || !formData.handle || !formData.url) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const linkData = {
        name: formData.name,
        handle: formData.handle,
        url: formData.url,
        description: formData.description || null,
        display_order: socialLinks.length,
      };

      if (editingId) {
        await adminInvoke({
          operation: 'updateSocialLink',
          linkId: editingId,
          linkData,
        });
        toast({ title: "Success", description: "Social link updated" });
      } else {
        await adminInvoke({
          operation: 'createSocialLink',
          linkData,
        });
        toast({ title: "Success", description: "Social link added" });
      }

      setFormData({ name: '', handle: '', url: '', description: '' });
      setEditingId(null);
      fetchSocialLinks();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save social link",
        variant: "destructive",
      });
    }
  };

  const deleteSocialLink = async (id: string) => {
    try {
      await adminInvoke({
        operation: 'deleteSocialLink',
        linkId: id,
      });
      toast({ title: "Success", description: "Social link deleted" });
      fetchSocialLinks();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete social link",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (id: string, isPublished: boolean) => {
    try {
      await adminInvoke({
        operation: 'updateSocialLink',
        linkId: id,
        linkData: { is_published: isPublished },
      });
      fetchSocialLinks();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update social link",
        variant: "destructive",
      });
    }
  };

  const editSocialLink = (link: SocialLink) => {
    setFormData({
      name: link.name,
      handle: link.handle,
      url: link.url,
      description: link.description || ''
    });
    setEditingId(link.id);
  };

  const cancelEdit = () => {
    setFormData({ name: '', handle: '', url: '', description: '' });
    setEditingId(null);
  };

  if (isLoading) {
    return <div className="text-foreground">Loading social links...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <Card className="p-4 bg-card border-ctp-surface1/50">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {editingId ? 'Edit Social Link' : 'Add New Social Link'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Platform Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Instagram, Ko-fi, Steam"
            />
          </div>

          <div>
            <Label htmlFor="handle">Handle/Username *</Label>
            <Input
              id="handle"
              value={formData.handle}
              onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
              placeholder="@username or display name"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description"
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={saveSocialLink}>
            {editingId ? 'Update' : 'Add'} Social Link
          </Button>
          {editingId && (
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {/* Social Links List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Current Social Links</h3>

        {socialLinks.map((link) => {
          const { icon: IconComponent, gradient } = getPlatformVisuals(link.name, link.url);

          return (
            <Card key={link.id} className="p-4 bg-card border-ctp-surface1/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveLink(link.id, 'up')}
                      disabled={socialLinks.findIndex(l => l.id === link.id) === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveLink(link.id, 'down')}
                      disabled={socialLinks.findIndex(l => l.id === link.id) === socialLinks.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className={`p-2 rounded-full bg-gradient-to-r ${gradient} shadow-lg`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{link.name}</span>
                    <Badge variant={link.is_published ? "default" : "secondary"}>
                      {link.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {link.handle} • {link.url}
                  </div>
                  {link.description && (
                    <div className="text-xs text-muted-foreground/80">
                      {link.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={link.is_published}
                    onCheckedChange={(checked) => togglePublished(link.id, checked)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editSocialLink(link)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSocialLink(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {socialLinks.length === 0 && (
          <Card className="p-8 text-center bg-card border-ctp-surface1/50">
            <p className="text-muted-foreground">No social links added yet</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SocialLinksManager;
