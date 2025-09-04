import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, MessageSquare, Trash2, FolderOpen, Users } from 'lucide-react';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PortfolioManager } from '@/components/PortfolioManager';
import SocialLinksManager from '@/components/SocialLinksManager';
import { useRef } from 'react';

interface Submission {
  id: string;
  content: string;
  type: string;
  submitted_at: string;
  is_approved: boolean | null;
  admin_notes: string | null;
  signature_enabled: boolean | null;
  signature_text: string | null;
  signature_font: string | null;
}

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'messages' | 'drawings'>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check admin auth
    if (!sessionStorage.getItem('adminAuth')) {
      navigate('/admin');
      return;
    }
    
    fetchSubmissions();
  }, [navigate]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { operation: 'fetchSubmissions' }
      });

      if (error) {
        console.error('Error fetching submissions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch submissions",
          variant: "destructive",
        });
      } else {
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error calling admin function:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };


  const deleteSubmission = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: { operation: 'deleteSubmission', submissionId: id }
      });

      if (error) {
        console.error('Error deleting submission:', error);
        toast({
          title: "Error",
          description: "Failed to delete submission",
          variant: "destructive",
        });
      } else {
        setSubmissions(prev => prev.filter(sub => sub.id !== id));
        toast({
          title: "Success",
          description: "Submission deleted",
        });
      }
    } catch (error) {
      console.error('Error calling admin function:', error);
      toast({
        title: "Error",
        description: "Failed to delete submission",
        variant: "destructive",
      });
    }
  };

  const downloadSubmissionAsImage = async (submission: Submission) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Background
    ctx.fillStyle = '#0f0f23'; // Dark background matching the theme
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add border
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Header
    ctx.fillStyle = '#a855f7'; // Primary color
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('Submission from coah\'s website', 30, 50);

    // Date
    ctx.fillStyle = '#71717a'; // Muted color
    ctx.font = '14px Inter, sans-serif';
    const date = new Date(submission.submitted_at).toLocaleString();
    ctx.fillText(date, 30, 75);

    // Type badge
    ctx.fillStyle = submission.type === 'drawing' ? '#a855f7' : '#52525b';
    ctx.fillRect(30, 90, 80, 25);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(submission.type.toUpperCase(), 35, 107);

    if (submission.type === 'drawing') {
      // For drawings, find the existing img element and use it
      const existingImg = document.querySelector(`img[src="${submission.content}"]`) as HTMLImageElement;
      
      if (existingImg && existingImg.complete) {
        // Use the already loaded image
        const maxWidth = canvas.width - 60;
        const maxHeight = canvas.height - 200;
        const scale = Math.min(maxWidth / existingImg.naturalWidth, maxHeight / existingImg.naturalHeight, 1);
        const scaledWidth = existingImg.naturalWidth * scale;
        const scaledHeight = existingImg.naturalHeight * scale;
        
        // Center the drawing
        const x = (canvas.width - scaledWidth) / 2;
        const y = 140;
        
        ctx.drawImage(existingImg, x, y, scaledWidth, scaledHeight);
      } else {
        // Fallback if we can't find the existing image
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText('Drawing not available for download', 30, 160);
      }
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // Draw the message lines
      let y = 150;
      for (const line of lines) {
        ctx.fillText(line, 30, y);
        y += 24;
      }
      
      // Add signature if present
      if (submission.signature_enabled && submission.signature_text) {
        y += 20;
        ctx.fillStyle = '#a855f7';
        ctx.font = 'italic 18px Dancing Script, cursive'; // Use signature font
        ctx.textAlign = 'right';
        ctx.fillText(`— ${submission.signature_text}`, canvas.width - 30, y);
        ctx.textAlign = 'left'; // Reset alignment
      }
    }

    // Footer
    ctx.fillStyle = '#52525b';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Generated from coah\'s admin panel', 30, canvas.height - 30);

    // Download the image
    const link = document.createElement('a');
    link.download = `submission-${submission.type}-${submission.id.slice(0, 8)}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "Downloaded!",
      description: "Submission saved as image",
    });
  };

  const logout = () => {
    sessionStorage.removeItem('adminAuth');
    navigate('/');
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'messages') return sub.type === 'message';
    if (filter === 'drawings') return sub.type === 'drawing';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Site
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="socials" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Social Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-6">
            <div className="mb-6 flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All ({submissions.length})
              </Button>
              <Button
                variant={filter === 'messages' ? 'default' : 'outline'}
                onClick={() => setFilter('messages')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages ({submissions.filter(s => s.type === 'message').length})
              </Button>
              <Button
                variant={filter === 'drawings' ? 'default' : 'outline'}
                onClick={() => setFilter('drawings')}
              >
                <Image className="h-4 w-4 mr-2" />
                Drawings ({submissions.filter(s => s.type === 'drawing').length})
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="p-4 bg-gradient-card border-border/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-2">
                         {submission.type === 'drawing' ? (
                           <Image className="h-4 w-4" />
                         ) : (
                           <MessageSquare className="h-4 w-4" />
                         )}
                         <Badge variant={submission.type === 'drawing' ? 'default' : 'secondary'}>
                           {submission.type}
                         </Badge>
                         <span className="text-sm text-muted-foreground">
                           {new Date(submission.submitted_at).toLocaleString()}
                         </span>
                       </div>
                       
                       {submission.type === 'drawing' ? (
                         <img
                           src={submission.content}
                           alt="User drawing"
                           className="max-w-md max-h-64 rounded border border-border/50"
                         />
                       ) : (
                         <div className="space-y-3">
                           <p className="text-foreground bg-background/50 p-3 rounded border border-border/50">
                             {submission.content}
                           </p>
                           
                           {/* Display Signature */}
                           {submission.signature_enabled && submission.signature_text && (
                             <div className="bg-muted/30 p-3 rounded border border-border/30">
                               <div className="text-xs text-muted-foreground mb-1">Signature:</div>
                               <div className={`text-right italic text-primary ${
                                 submission.signature_font === 'dancing' ? 'font-dancing' :
                                 submission.signature_font === 'pacifico' ? 'font-pacifico' :
                                 submission.signature_font === 'great-vibes' ? 'font-great-vibes' :
                                 submission.signature_font === 'caveat' ? 'font-caveat' : ''
                               }`}>
                                 — {submission.signature_text}
                               </div>
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                    
                     <div className="flex flex-col gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => downloadSubmissionAsImage(submission)}
                       >
                         <Download className="h-4 w-4" />
                       </Button>
                       <Button
                         size="sm"
                         variant="destructive"
                         onClick={() => deleteSubmission(submission.id)}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                  </div>
                </Card>
              ))}
              
              {filteredSubmissions.length === 0 && (
                <Card className="p-8 text-center bg-gradient-card border-border/50">
                  <p className="text-muted-foreground">No submissions found</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            <PortfolioManager />
          </TabsContent>

          <TabsContent value="socials" className="mt-6">
            <SocialLinksManager />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Hidden canvas for generating images */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={800}
        height={600}
      />
    </div>
  );
};

export default AdminDashboard;