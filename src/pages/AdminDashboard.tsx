import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PortfolioManager } from '@/components/PortfolioManager';
import SocialLinksManager from '@/components/SocialLinksManager';
import {
  Download,
  Image as ImageIcon,
  Loader2,
  LogOut,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

type Submission = Database['public']['Tables']['submissions']['Row'];

const textFont = '"DM Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const signatureFont = '"Dancing Script", "Inter", cursive';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const sortSubmissions = (items: Submission[]) =>
  items
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.submitted_at ?? 0).getTime();
      const bTime = new Date(b.submitted_at ?? 0).getTime();
      return bTime - aTime;
    });

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'submissions' | 'portfolio' | 'social'>('submissions');

  const fetchSubmissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke<{
        submissions?: Submission[];
      }>('admin-operations', {
        body: { operation: 'fetchSubmissions' }
      });

      if (error) {
        throw error;
      }

      const fetched = data?.submissions ?? [];
      setSubmissions(sortSubmissions(fetched));
    } catch (error) {
      console.error('Failed to load submissions', error);
      toast({
        title: 'Unable to fetch submissions',
        description: 'Check your connection and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    const isAuthed = sessionStorage.getItem('adminAuth') === 'true';
    if (!isAuthed) {
      navigate('/admin');
      return;
    }
    fetchSubmissions();
  }, [fetchSubmissions, navigate]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-submissions-feed')
      .on<'postgres_changes'>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions' },
        (payload) => {
          const inserted = payload.new as Submission | null;
          if (!inserted) return;
          setSubmissions((prev) => {
            const withoutCurrent = prev.filter((submission) => submission.id !== inserted.id);
            return sortSubmissions([inserted, ...withoutCurrent]);
          });
        }
      )
      .on<'postgres_changes'>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'submissions' },
        (payload) => {
          const updated = payload.new as Submission | null;
          if (!updated) return;
          setSubmissions((prev) => {
            const index = prev.findIndex((submission) => submission.id === updated.id);
            if (index === -1) {
              return sortSubmissions([updated, ...prev]);
            }
            const copy = [...prev];
            copy[index] = updated;
            return sortSubmissions(copy);
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error – falling back to manual refresh only');
        }
      });

    const interval = setInterval(() => {
      fetchSubmissions();
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchSubmissions]);

  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (activeTab === 'submissions') {
      fetchSubmissions();
    }
  }, [activeTab, fetchSubmissions]);

  const groupedSubmissions = useMemo(() => {
    const byType: Record<'message' | 'drawing' | 'other', Submission[]> = {
      message: [],
      drawing: [],
      other: []
    };

    submissions.forEach((submission) => {
      if (submission.type === 'message') {
        byType.message.push(submission);
      } else if (submission.type === 'drawing') {
        byType.drawing.push(submission);
      } else {
        byType.other.push(submission);
      }
    });

    return byType;
  }, [submissions]);

  const downloadDrawingSubmission = async (submission: Submission) => {
    const source = submission.content.startsWith('data:')
      ? submission.content
      : `data:image/png;base64,${submission.content}`;

    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        const maxDimension = 2048;
        const { width, height } = image;
        const scale = Math.min(maxDimension / width, maxDimension / height, 1);
        const canvasWidth = Math.round(width * scale);
        const canvasHeight = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `submission-${submission.id}.png`;
        link.click();
        resolve();
      };

      image.onerror = () => reject(new Error('Failed to load submission image'));
      image.src = source;
    });
  };

  const wrapParagraph = (
    ctx: CanvasRenderingContext2D,
    paragraph: string,
    maxWidth: number
  ) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) return { lines: [''], widest: 0 };

    const lines: string[] = [];
    let currentLine = '';
    let widest = 0;

    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const candidateWidth = ctx.measureText(candidate).width;

      if (candidateWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        widest = Math.max(widest, ctx.measureText(currentLine).width);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
      widest = Math.max(widest, ctx.measureText(currentLine).width);
    }

    return { lines, widest };
  };

  const prepareTextBlocks = (
    text: string,
    ctx: CanvasRenderingContext2D,
    font: string,
    maxWidth: number
  ) => {
    ctx.font = font;
    const paragraphs = text.split(/\n/);
    const allLines: string[] = [];
    let widest = 0;

    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim().length === 0) {
        allLines.push('');
        return;
      }

      const { lines, widest: paragraphWidest } = wrapParagraph(ctx, paragraph, maxWidth);
      widest = Math.max(widest, paragraphWidest);
      allLines.push(...lines);
      if (index < paragraphs.length - 1) {
        allLines.push('');
      }
    });

    return { lines: allLines, widest };
  };

  const downloadMessageSubmission = (submission: Submission) => {
    const message = submission.content.trim();
    const signature = submission.signature_enabled ? submission.signature_text ?? '' : '';

    const measureCanvas = document.createElement('canvas');
    const measureContext = measureCanvas.getContext('2d');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!measureContext || !ctx) {
      throw new Error('Canvas features are not available in this browser.');
    }

    const messageFontSize = 30;
    const messageLineHeight = messageFontSize * 1.45;
    const signatureFontSize = 26;
    const signatureLineHeight = signatureFontSize * 1.4;
    const maxTextWidth = 860;
    const paddingX = 72;
    const paddingY = 88;
    const signatureSpacing = signature ? 32 : 0;

    const messageFont = `500 ${messageFontSize}px ${textFont}`;
    const signatureFontResolved = submission.signature_font ? signatureFont : `${signatureFontSize}px ${textFont}`;
    const signatureFontString = `600 ${signatureFontSize}px ${signatureFontResolved}`;

    const { lines: messageLines, widest: messageWidest } = prepareTextBlocks(
      message,
      measureContext,
      messageFont,
      maxTextWidth
    );

    let signatureLines: string[] = [];
    let signatureWidest = 0;
    if (signature) {
      const preparedSignature = prepareTextBlocks(
        signature,
        measureContext,
        signatureFontString,
        maxTextWidth
      );
      signatureLines = preparedSignature.lines;
      signatureWidest = preparedSignature.widest;
    }

    const contentHeight =
      messageLines.length * messageLineHeight +
      (signatureLines.length ? signatureSpacing + signatureLines.length * signatureLineHeight : 0);

    const rawContentWidth = Math.max(messageWidest, signatureWidest);
    const contentWidth = clamp(rawContentWidth, 420, maxTextWidth);

    canvas.width = Math.round(contentWidth + paddingX * 2);
    canvas.height = Math.round(contentHeight + paddingY * 2);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f8f5ff');
    gradient.addColorStop(1, '#e2e8ff');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ctx.fillRect(16, 16, canvas.width - 32, canvas.height - 32);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#1f1b2e';
    ctx.font = messageFont;
    ctx.textBaseline = 'top';

    let cursorY = paddingY;

    messageLines.forEach((line) => {
      if (line === '') {
        cursorY += messageLineHeight * 0.6;
      } else {
        ctx.fillText(line, paddingX, cursorY);
        cursorY += messageLineHeight;
      }
    });

    if (signatureLines.length) {
      cursorY += signatureSpacing;
      ctx.font = signatureFontString;
      ctx.fillStyle = '#4b3fa7';

      signatureLines.forEach((line) => {
        if (line === '') {
          cursorY += signatureLineHeight * 0.6;
        } else {
          ctx.fillText(`— ${line}`, paddingX, cursorY);
          cursorY += signatureLineHeight;
        }
      });
    }

    ctx.strokeStyle = '#d2cdf7';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `submission-${submission.id}.png`;
    link.click();
  };

  const handleDownloadSubmission = async (submission: Submission) => {
    setDownloadingId(submission.id);
    try {
      if (submission.type === 'drawing') {
        await downloadDrawingSubmission(submission);
      } else {
        downloadMessageSubmission(submission);
      }
    } catch (error) {
      console.error('Failed to download submission', error);
      toast({
        title: 'Unable to download submission',
        description: 'Please try again in a moment.',
        variant: 'destructive'
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    navigate('/admin');
  };

  const renderSubmissionCard = (submission: Submission) => {
    const submittedAt = submission.submitted_at
      ? new Date(submission.submitted_at).toLocaleString()
      : 'Unknown date';

    const isMessage = submission.type === 'message';

    return (
      <Card key={submission.id} className="border-border/60 bg-gradient-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {isMessage ? (
                <MessageSquare className="h-5 w-5 text-primary" />
              ) : (
                <ImageIcon className="h-5 w-5 text-primary" />
              )}
              {isMessage ? 'Message Submission' : 'Drawing Submission'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={submission.is_approved ? 'default' : 'outline'}>
                {submission.is_approved ? 'approved' : 'pending'}
              </Badge>
              <Badge variant="outline">#{submission.id.slice(0, 6)}</Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">{submittedAt}</div>
        </CardHeader>
        <Separator className="opacity-40" />
        <CardContent className="space-y-4 pt-4">
          {isMessage ? (
            <>
              <ScrollArea className="max-h-64 rounded-lg border border-border/50 bg-background/60 p-4 pr-6">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                  {submission.content}
                </p>
              </ScrollArea>
              {submission.signature_enabled && submission.signature_text ? (
                <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-sm font-medium text-primary">
                  {submission.signature_text}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <img
                src={submission.content}
                alt="Submitted drawing"
                className="mx-auto max-h-[24rem] w-full rounded-md bg-muted object-contain"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadSubmission(submission)}
              disabled={downloadingId === submission.id}
            >
              {downloadingId === submission.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloadingId === submission.id ? 'Preparing...' : 'Download'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage submissions, projects, and social links in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'submissions' ? (
              <Button
                variant="outline"
                onClick={fetchSubmissions}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            ) : null}
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className="w-full"
        >
          <TabsList className="h-11 bg-card/50 p-1.5">
            <TabsTrigger value="submissions" className="px-4 py-2 text-sm font-medium">
              Submissions
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="px-4 py-2 text-sm font-medium">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="social" className="px-4 py-2 text-sm font-medium">
              Social Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-6">
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading submissions…</span>
                </div>
              </div>
            ) : submissions.length === 0 ? (
              <Card className="border-dashed border-border/60 bg-gradient-card/50 py-12 text-center">
                <CardHeader>
                  <CardTitle className="text-lg text-muted-foreground">
                    No submissions yet
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground/80">
                  Messages and drawings will appear here once they are submitted.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-10">
                {groupedSubmissions.message.length ? (
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Messages</h2>
                      <p className="text-sm text-muted-foreground">
                        Scroll within each card to read the full message before downloading.
                      </p>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      {groupedSubmissions.message.map(renderSubmissionCard)}
                    </div>
                  </section>
                ) : null}

                {groupedSubmissions.drawing.length ? (
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Drawings</h2>
                      <p className="text-sm text-muted-foreground">
                        Images keep their proportions and export in their largest safe size.
                      </p>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      {groupedSubmissions.drawing.map(renderSubmissionCard)}
                    </div>
                  </section>
                ) : null}

                {groupedSubmissions.other.length ? (
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Other</h2>
                      <p className="text-sm text-muted-foreground">
                        Submissions that do not match the standard message or drawing type.
                      </p>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      {groupedSubmissions.other.map(renderSubmissionCard)}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            <div className="rounded-xl border border-border/60 bg-gradient-card p-4 sm:p-6">
              <PortfolioManager />
            </div>
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <div className="rounded-xl border border-border/60 bg-gradient-card p-4 sm:p-6">
              <SocialLinksManager />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
