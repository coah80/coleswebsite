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

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to load submission image'));
      image.src = src;
    });

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
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

  const BADGE_PADDING_X = 16;
  const BADGE_HEIGHT = 30;

  const measureBadgeWidth = (ctx: CanvasRenderingContext2D, text: string) =>
    ctx.measureText(text).width + BADGE_PADDING_X * 2;

  const drawBadge = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    colors: { background: string; foreground: string }
  ) => {
    const badgeWidth = measureBadgeWidth(ctx, text);

    ctx.save();
    ctx.fillStyle = colors.background;
    drawRoundedRect(ctx, x, y, badgeWidth, BADGE_HEIGHT, 999);
    ctx.fill();

    ctx.fillStyle = colors.foreground;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + BADGE_PADDING_X, y + BADGE_HEIGHT / 2 + 1);
    ctx.restore();

    return badgeWidth;
  };

  const createSubmissionScreenshot = async (submission: Submission) => {
    const isMessage = submission.type === 'message';
    const message = submission.content.trim();
    const signature = submission.signature_enabled ? submission.signature_text ?? '' : '';

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (!measureCtx) {
      throw new Error('Canvas measurements are unavailable in this browser.');
    }

    const cardWidth = 960;
    const outerPadding = 64;
    const innerPadding = 48;
    const contentWidth = cardWidth - innerPadding * 2;
    const titleFontSize = 32;
    const metadataFontSize = 20;
    const iconSize = 34;
    const headerSpacing = 18;
    const metadataSpacing = 28;

    const headerBlockHeight =
      Math.max(iconSize, titleFontSize) + headerSpacing + metadataFontSize + metadataSpacing;

    let contentBoxHeight = 0;
    let messageLines: string[] = [];
    let messageLineHeight = 0;
    let contentPadding = 0;
    let signatureLines: string[] = [];
    let signatureLineHeight = 0;
    let signatureSpacing = 0;
    let signatureFontString = '';
    let messageFontString = '';
    let imageDetails:
      | {
          element: HTMLImageElement;
          drawWidth: number;
          drawHeight: number;
        }
      | null = null;

    if (isMessage) {
      const messageFontSize = 28;
      messageLineHeight = Math.round(messageFontSize * 1.5);
      messageFontString = `500 ${messageFontSize}px ${textFont}`;
      contentPadding = 36;

      const usableWidth = contentWidth - contentPadding * 2;
      const preparedMessage = prepareTextBlocks(message, measureCtx, messageFontString, usableWidth);
      messageLines = preparedMessage.lines;

      const computeTextHeight = (lines: string[], lineHeight: number) =>
        lines.reduce((acc, line) => acc + (line === '' ? lineHeight * 0.6 : lineHeight), 0);

      let messageHeight = computeTextHeight(messageLines, messageLineHeight);

      if (!messageLines.length) {
        messageLines = ['(empty submission)'];
        messageHeight = messageLineHeight;
      }

      signatureSpacing = signature ? 28 : 0;
      if (signature) {
        const signatureFontSize = 26;
        signatureLineHeight = Math.round(signatureFontSize * 1.45);
        const preferredFonts =
          '"Dancing Script","Pacifico","Great Vibes","Caveat","Sacramento","Allura","Alex Brush","Kaushan Script","Satisfy","Cookie",cursive';
        signatureFontString = `600 ${signatureFontSize}px ${
          submission.signature_font ? preferredFonts : textFont
        }`;
        const preparedSignature = prepareTextBlocks(signature, measureCtx, signatureFontString, usableWidth);
        signatureLines = preparedSignature.lines;
      }

      const signatureHeight = signatureLines.length
        ? signatureSpacing +
          signatureLines.reduce(
            (acc, line) => acc + (line === '' ? signatureLineHeight * 0.6 : signatureLineHeight),
            0
          )
        : 0;

      const textContentHeight = messageHeight + signatureHeight;
      contentBoxHeight = textContentHeight + contentPadding * 2;
    } else {
      const source = submission.content.startsWith('data:')
        ? submission.content
        : `data:image/png;base64,${submission.content}`;
      const image = await loadImage(source);
      const contentInnerPadding = 28;
      const maxImageHeight = 520;
      const availableWidth = contentWidth - contentInnerPadding * 2;

      const scale = Math.min(availableWidth / image.width, maxImageHeight / image.height, 1);
      const drawWidth = Math.max(availableWidth * 0.4, image.width * scale);
      const computedDrawWidth = Math.min(drawWidth, availableWidth);
      const computedDrawHeight = (image.height * computedDrawWidth) / image.width;

      imageDetails = {
        element: image,
        drawWidth: computedDrawWidth,
        drawHeight: computedDrawHeight
      };

      contentPadding = contentInnerPadding;
      contentBoxHeight = computedDrawHeight + contentPadding * 2;
    }

    const cardHeight = headerBlockHeight + contentBoxHeight + innerPadding * 2;
    const canvasWidth = cardWidth + outerPadding * 2;
    const canvasHeight = cardHeight + outerPadding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(canvasWidth);
    canvas.height = Math.round(canvasHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas features are not available.');
    }

    ctx.textBaseline = 'top';

    ctx.fillStyle = '#05030d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cardX = outerPadding;
    const cardY = outerPadding;

    ctx.save();
    ctx.shadowColor = 'rgba(7, 4, 17, 0.65)';
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 24;
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 40);
    const gradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    gradient.addColorStop(0, '#130f1a');
    gradient.addColorStop(1, '#1c1726');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 40);
    ctx.stroke();

    const contentX = cardX + innerPadding;
    let cursorY = cardY + innerPadding;

    const icon = isMessage ? '💬' : '🖼️';
    ctx.font = `400 ${iconSize}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.fillText(icon, contentX, cursorY - 2);

    ctx.font = `600 ${titleFontSize}px ${textFont}`;
    ctx.fillStyle = '#f8f6ff';
    const titleText = isMessage ? 'Message Submission' : 'Drawing Submission';
    ctx.fillText(titleText, contentX + 52, cursorY - 6);

    const badgesFont = '600 18px "Inter","DM Sans",sans-serif';
    ctx.font = badgesFont;
    const statusText = submission.is_approved ? 'approved' : 'pending';
    const statusColors = submission.is_approved
      ? { background: 'rgba(74,222,128,0.16)', foreground: '#8ff5c7' }
      : { background: 'rgba(246,236,255,0.12)', foreground: '#e3d4ff' };
    const idText = `#${submission.id.slice(0, 6)}`;
    const idColors = { background: 'rgba(255,255,255,0.08)', foreground: '#c7bdf3' };

    const badgeSpacing = 14;
    const statusWidth = measureBadgeWidth(ctx, statusText);
    const idWidth = measureBadgeWidth(ctx, idText);
    const badgesTotalWidth = statusWidth + badgeSpacing + idWidth;
    const badgesStartX = cardX + cardWidth - innerPadding - badgesTotalWidth;

    drawBadge(ctx, statusText, badgesStartX, cursorY, statusColors);
    drawBadge(ctx, idText, badgesStartX + statusWidth + badgeSpacing, cursorY, idColors);

    cursorY += Math.max(iconSize, titleFontSize) + headerSpacing;

    const submittedAt = submission.submitted_at
      ? new Date(submission.submitted_at).toLocaleString()
      : 'Unknown date';
    ctx.font = `500 ${metadataFontSize}px ${textFont}`;
    ctx.fillStyle = 'rgba(226, 220, 255, 0.85)';
    ctx.fillText(submittedAt, contentX, cursorY);

    cursorY += metadataFontSize + metadataSpacing;

    const contentBoxY = cursorY;
    const contentRadius = 32;

    ctx.save();
    ctx.fillStyle = 'rgba(8,7,15,0.85)';
    drawRoundedRect(ctx, contentX, contentBoxY, contentWidth, contentBoxHeight, contentRadius);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, contentX, contentBoxY, contentWidth, contentBoxHeight, contentRadius);
    ctx.stroke();
    ctx.restore();

    if (isMessage) {
      ctx.font = messageFontString;
      ctx.fillStyle = '#f5f3ff';
      let textCursorY = contentBoxY + contentPadding;
      const textCursorX = contentX + contentPadding;

      messageLines.forEach((line) => {
        if (line === '') {
          textCursorY += messageLineHeight * 0.6;
        } else {
          ctx.fillText(line, textCursorX, textCursorY);
          textCursorY += messageLineHeight;
        }
      });

      if (signatureLines.length) {
        textCursorY += signatureSpacing;
        ctx.font = signatureFontString;
        ctx.fillStyle = '#c7bdf3';
        signatureLines.forEach((line, index) => {
          if (line === '') {
            textCursorY += signatureLineHeight * 0.6;
          } else {
            const prefix = index === 0 ? '— ' : '';
            ctx.fillText(`${prefix}${line}`, textCursorX, textCursorY);
            textCursorY += signatureLineHeight;
          }
        });
      }
    } else if (imageDetails) {
      const drawX = contentX + (contentWidth - imageDetails.drawWidth) / 2;
      const drawY = contentBoxY + (contentBoxHeight - imageDetails.drawHeight) / 2;

      ctx.save();
      ctx.fillStyle = '#090816';
      drawRoundedRect(ctx, drawX - 6, drawY - 6, imageDetails.drawWidth + 12, imageDetails.drawHeight + 12, 28);
      ctx.fill();
      drawRoundedRect(ctx, drawX - 6, drawY - 6, imageDetails.drawWidth + 12, imageDetails.drawHeight + 12, 28);
      ctx.clip();
      ctx.drawImage(
        imageDetails.element,
        drawX,
        drawY,
        imageDetails.drawWidth,
        imageDetails.drawHeight
      );
      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  };

  const handleDownloadSubmission = async (submission: Submission) => {
    setDownloadingId(submission.id);
    try {
      const dataUrl = await createSubmissionScreenshot(submission);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `submission-${submission.id}.png`;
      link.click();
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
