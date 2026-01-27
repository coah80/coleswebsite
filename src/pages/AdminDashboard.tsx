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
const signatureFontStack =
  '"Dancing Script","Pacifico","Great Vibes","Caveat",cursive';

// Map submitted font slugs to canvas font-family strings
const canvasFontBySlug: Record<string, string> = {
  'dancing': '"Dancing Script",cursive',
  'caveat': '"Caveat",cursive',
  'pacifico': '"Pacifico",cursive',
  'great-vibes': '"Great Vibes",cursive',
  'inter': '"Inter",sans-serif',
  'poppins': '"Poppins",sans-serif',
  'nunito': '"Nunito",sans-serif',
  'source-sans': '"Source Sans Pro",sans-serif'
};

// Tailwind class names for previewing the signature font in UI
const fontClassBySlug: Record<string, string> = {
  'dancing': 'font-dancing',
  'caveat': 'font-caveat',
  'pacifico': 'font-pacifico',
  'great-vibes': 'font-great-vibes',
  'inter': 'font-sans',
  'poppins': 'font-heading',
  'nunito': 'font-rounded',
  'source-sans': 'font-body'
};
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
  const [submissionsFilter, setSubmissionsFilter] = useState<'all' | 'message' | 'drawing' | 'other'>('all');

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

  const submissionFilterTabs = useMemo(
    () => [
      { value: 'all' as const, label: 'All', count: submissions.length },
      { value: 'message' as const, label: 'Messages', count: groupedSubmissions.message.length },
      { value: 'drawing' as const, label: 'Drawings', count: groupedSubmissions.drawing.length },
      { value: 'other' as const, label: 'Other', count: groupedSubmissions.other.length }
    ],
    [groupedSubmissions, submissions.length]
  );

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
    const messageText = submission.content.trim();
    const signatureText = submission.signature_enabled ? submission.signature_text ?? '' : '';

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (!measureCtx) {
      throw new Error('Canvas measurements are not available in this browser.');
    }

    const outerPadding = 64;
    const innerPadding = 48;
    const minCardWidth = 860;
    const maxCardWidth = 1240;
    const baseCardWidth = isMessage ? 1000 : 1120;

    const titleFontSize = 32;
    const metadataFontSize = 20;
    const iconSize = 34;
    const headerSpacing = 18;
    const metadataSpacing = 28;

    const headerBlockHeight =
      Math.max(iconSize, titleFontSize) + headerSpacing + metadataFontSize + metadataSpacing;

    let cardWidth = baseCardWidth;
    let contentWidth = cardWidth - innerPadding * 2;
    let contentBoxHeight = 0;
    let contentPadding = 0;

    let messageLines: string[] = [];
    let messageLineHeight = 0;
    let messageFontString = '';
    let signatureLines: string[] = [];
    let signatureLineHeight = 0;
    let signatureFontString = '';
    let signatureSpacing = 0;

    let imageDetails:
      | {
          element: HTMLImageElement;
          drawWidth: number;
          drawHeight: number;
          caption?: string;
        }
      | null = null;

    if (isMessage) {
      const message = messageText.length ? messageText : '(empty submission)';
      const signature = signatureText;

      const minContentWidth = minCardWidth - innerPadding * 2;
      const maxContentWidth = maxCardWidth - innerPadding * 2;
      const messageFontSize = 28;
      const signatureFontSize = 26;

      contentPadding = 36;
      messageLineHeight = Math.round(messageFontSize * 1.5);
      messageFontString = `500 ${messageFontSize}px ${textFont}`;
      signatureLineHeight = Math.round(signatureFontSize * 1.45);
      const chosenSignatureFamily = submission.signature_font
        ? canvasFontBySlug[submission.signature_font] ?? signatureFontStack
        : textFont;
      signatureFontString = `600 ${signatureFontSize}px ${chosenSignatureFamily}`;
      signatureSpacing = signature ? 28 : 0;

      const computeHeight = (lines: string[], lineHeight: number) =>
        lines.reduce((acc, line) => acc + (line === '' ? lineHeight * 0.6 : lineHeight), 0);

      const computeLayout = (targetContentWidth: number) => {
        const usableWidth = Math.max(targetContentWidth - contentPadding * 2, 320);
        const messageBlock = prepareTextBlocks(message, measureCtx, messageFontString, usableWidth);
        const resolvedMessageLines =
          messageBlock.lines.length > 0 ? messageBlock.lines : ['(empty submission)'];
        const messageHeight = computeHeight(resolvedMessageLines, messageLineHeight);

        const signatureBlock = signature
          ? prepareTextBlocks(signature, measureCtx, signatureFontString, usableWidth)
          : { lines: [] as string[], widest: 0 };
        const signatureHeight = signatureBlock.lines.length
          ? signatureSpacing + computeHeight(signatureBlock.lines, signatureLineHeight)
          : 0;

        return {
          messageLines: resolvedMessageLines,
          signatureLines: signatureBlock.lines,
          totalHeight: messageHeight + signatureHeight,
          longestLineWidth: Math.max(messageBlock.widest, signatureBlock.widest)
        };
      };

      let targetContentWidth = contentWidth;
      let layout = computeLayout(targetContentWidth);
      const recommendedWidth = Math.min(
        Math.max(layout.longestLineWidth + contentPadding * 2, minContentWidth),
        maxContentWidth
      );

      if (Math.abs(recommendedWidth - targetContentWidth) > 4) {
        targetContentWidth = recommendedWidth;
        layout = computeLayout(targetContentWidth);
      }

      messageLines = layout.messageLines;
      signatureLines = layout.signatureLines;
      contentWidth = targetContentWidth;
      cardWidth = Math.min(Math.max(contentWidth + innerPadding * 2, minCardWidth), maxCardWidth);

      const dynamicBuffer = Math.min(160, Math.round(layout.totalHeight * 0.08));
      contentBoxHeight = layout.totalHeight + contentPadding * 2 + 32 + dynamicBuffer;
    } else {
      // Parse drawing content - may be JSON with { drawing, caption } or raw base64/dataUrl
      let imageSrc = submission.content;
      let drawingCaption = '';
      try {
        const parsed = JSON.parse(submission.content);
        if (parsed.drawing) {
          imageSrc = parsed.drawing;
          drawingCaption = parsed.caption || '';
        }
      } catch {
        // Not JSON, use content directly
      }
      
      cardWidth = Math.min(Math.max(cardWidth, 1100), maxCardWidth);
      contentWidth = cardWidth - innerPadding * 2;
      const contentInnerPadding = 32;
      contentPadding = contentInnerPadding;
      const maxImageHeight = 700;
      const source = imageSrc.startsWith('data:')
        ? imageSrc
        : `data:image/png;base64,${imageSrc}`;
      const image = await loadImage(source);
      const availableWidth = Math.max(contentWidth - contentInnerPadding * 2, 320);
      const widthScale = availableWidth / image.width;
      const heightScale = maxImageHeight / image.height;
      const maxScale = 4;

      let scale: number;
      if (widthScale < 1 || heightScale < 1) {
        scale = Math.min(widthScale, heightScale, 1);
      } else {
        scale = Math.min(widthScale, heightScale, maxScale);
      }

      let drawWidth = Math.min(Math.max(image.width * scale, availableWidth * 0.98), availableWidth);
      let drawHeight = (image.height * drawWidth) / image.width;

      if (drawHeight > maxImageHeight) {
        drawHeight = maxImageHeight;
        drawWidth = (image.width * drawHeight) / image.height;
      }

      imageDetails = {
        element: image,
        drawWidth,
        drawHeight,
        caption: drawingCaption
      };

      // Add space for caption if present
      const captionHeight = drawingCaption ? 50 : 0;
      contentBoxHeight = Math.max(drawHeight + contentInnerPadding * 2 + captionHeight, 380);
    }

    cardWidth = Math.min(Math.max(cardWidth, minCardWidth), maxCardWidth);
    contentWidth = cardWidth - innerPadding * 2;

    const cardHeight = headerBlockHeight + contentBoxHeight + innerPadding * 2;
    const canvasWidth = cardWidth + outerPadding * 2;
    const canvasHeight = cardHeight + outerPadding * 2;

    const exportScale = Math.min(
      Math.max(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3),
      4
    );

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(canvasWidth * exportScale);
    canvas.height = Math.round(canvasHeight * exportScale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas features are not available.');
    }

    ctx.scale(exportScale, exportScale);
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) {
      ctx.imageSmoothingQuality = 'high';
    }
    ctx.textBaseline = 'top';

    // Background - deep purple/navy (matches --background: 260 30% 6%)
    ctx.fillStyle = '#0d0a14';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const cardX = outerPadding;
    const cardY = outerPadding;

    ctx.save();
    ctx.shadowColor = 'rgba(20, 10, 40, 0.7)';
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 24;
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 40);
    // Card gradient - purple tinted (matches --card: 260 25% 9%)
    const gradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    gradient.addColorStop(0, '#15111f');
    gradient.addColorStop(1, '#1a1526');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(147, 112, 219, 0.08)';
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
    // Content box - darker purple (matches --muted: 260 20% 16%)
    ctx.fillStyle = 'rgba(13, 10, 20, 0.9)';
    drawRoundedRect(ctx, contentX, contentBoxY, contentWidth, contentBoxHeight, contentRadius);
    ctx.fill();

    ctx.strokeStyle = 'rgba(147, 112, 219, 0.06)';
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
      // Calculate vertical offset for caption
      const captionHeight = imageDetails.caption ? 40 : 0;
      const availableHeight = contentBoxHeight - captionHeight;
      const drawX = contentX + (contentWidth - imageDetails.drawWidth) / 2;
      const drawY = contentBoxY + (availableHeight - imageDetails.drawHeight) / 2;

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
      
      // Draw caption if present
      if (imageDetails.caption) {
        const captionFontSize = 20;
        ctx.save();
        ctx.font = `500 ${captionFontSize}px ${textFont}`;
        ctx.fillStyle = '#c7bdf3';
        ctx.textBaseline = 'top';
        const captionY = drawY + imageDetails.drawHeight + 20;
        const captionText = `"${imageDetails.caption}"`;
        const captionWidth = ctx.measureText(captionText).width;
        const captionX = contentX + (contentWidth - captionWidth) / 2;
        ctx.fillText(captionText, captionX, captionY);
        ctx.restore();
      }
    }

    // Footer call-to-action: "Submit your own at coah80.com!" with highlighted domain
    {
      const footerFontSize = 18;
      const prefix = 'Submit your own at ';
      const highlight = 'coah80.com';
      const suffix = '!';
      const footerGap = 16;

      const footerSeparatorY = cardY + cardHeight + footerGap;
      const footerY = footerSeparatorY + footerFontSize + 12; // float in bottom margin

      ctx.save();
      ctx.font = `600 ${footerFontSize}px ${textFont}`;
      ctx.textBaseline = 'alphabetic';

      // Light divider to separate footer area - purple accent
      ctx.strokeStyle = 'rgba(147, 112, 219, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX, footerSeparatorY);
      ctx.lineTo(cardX + cardWidth, footerSeparatorY);
      ctx.stroke();

      // Measure pieces
      const prefixWidth = ctx.measureText(prefix).width;
      const suffixWidth = ctx.measureText(suffix).width;
      const pillPaddingX = 10;
      const pillHeight = Math.round(footerFontSize * 1.3);
      const pillRadius = Math.round(pillHeight / 2);
      const pillTextYAdjust = Math.round(footerFontSize * 0.25);
      const highlightWidth = ctx.measureText(highlight).width;
      const pillWidth = highlightWidth + pillPaddingX * 2;
      const totalWidth = prefixWidth + pillWidth + suffixWidth + 10; // spacing around pill

      // Center horizontally inside the card area
      const startX = cardX + (cardWidth - totalWidth) / 2;

      // Draw prefix
      ctx.fillStyle = 'rgba(226, 220, 255, 0.9)';
      ctx.fillText(prefix, startX, footerY);

      // Draw pill background for the domain - purple accent
      const pillX = startX + prefixWidth + 5;
      const pillYTop = footerY - footerFontSize + pillTextYAdjust - (pillHeight - footerFontSize) / 2;
      ctx.fillStyle = 'rgba(147, 112, 219, 0.25)';
      drawRoundedRect(ctx, pillX, pillYTop, pillWidth, pillHeight, pillRadius);
      ctx.fill();

      // Domain text inside the pill
      ctx.fillStyle = '#f8f6ff';
      ctx.fillText(highlight, pillX + pillPaddingX, footerY);

      // Trailing punctuation
      const suffixX = pillX + pillWidth + 5;
      ctx.fillStyle = 'rgba(226, 220, 255, 0.9)';
      ctx.fillText(suffix, suffixX, footerY);

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
                <div
                  className={`rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-sm font-medium text-primary ${
                    submission.signature_font ? fontClassBySlug[submission.signature_font] ?? '' : ''
                  }`}
                >
                  {submission.signature_text}
                </div>
              ) : null}
            </>
          ) : (
            (() => {
              // Parse drawing content - may be JSON with { drawing, caption } or raw base64/dataUrl
              let imageSrc = submission.content;
              let caption = '';
              try {
                const parsed = JSON.parse(submission.content);
                if (parsed.drawing) {
                  imageSrc = parsed.drawing;
                  caption = parsed.caption || '';
                }
              } catch {
                // Not JSON, use content directly
                if (!imageSrc.startsWith('data:')) {
                  imageSrc = `data:image/png;base64,${imageSrc}`;
                }
              }
              return (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                    <img
                      src={imageSrc}
                      alt="Submitted drawing"
                      className="mx-auto max-h-[24rem] w-full rounded-md bg-muted object-contain"
                    />
                  </div>
                  {caption && (
                    <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-sm text-primary">
                      <span className="font-medium">Caption:</span> {caption}
                    </div>
                  )}
                </div>
              );
            })()
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-6 px-3 sm:px-4 py-4 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage submissions, projects, and social links in one place.
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeTab === 'submissions' ? (
              <Button
                variant="outline"
                onClick={fetchSubmissions}
                disabled={isRefreshing}
                size="sm"
                className="text-xs sm:text-sm"
              >
                {isRefreshing ? (
                  <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                )}
                Refresh
              </Button>
            ) : null}
            <Button variant="secondary" onClick={handleLogout} size="sm" className="text-xs sm:text-sm">
              <LogOut className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Log out
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className="w-full"
        >
          <TabsList className="h-9 sm:h-11 bg-card/50 p-1 sm:p-1.5 w-full sm:w-auto">
            <TabsTrigger value="submissions" className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium flex-1 sm:flex-initial">
              Submissions
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium flex-1 sm:flex-initial">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="social" className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium flex-1 sm:flex-initial">
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-6">
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading submissions...</span>
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
              <div className="space-y-4 sm:space-y-6">
                <Tabs
                  value={submissionsFilter}
                  onValueChange={(value) => setSubmissionsFilter(value as typeof submissionsFilter)}
                  className="w-full"
                >
                  <TabsList className="h-8 sm:h-10 bg-card/40 p-0.5 sm:p-1 flex-wrap">
                    {submissionFilterTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium"
                      >
                        <span>{tab.label}</span>
                        <span className="ml-1 sm:ml-2 rounded-full bg-primary/10 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs text-primary">
                          {tab.count}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="all" className="mt-4 sm:mt-6">
                    <div className="grid gap-3 sm:gap-5 lg:grid-cols-2">
                      {submissions.map(renderSubmissionCard)}
                    </div>
                  </TabsContent>

                  <TabsContent value="message" className="mt-4 sm:mt-6">
                    {groupedSubmissions.message.length ? (
                      <div className="grid gap-3 sm:gap-5 lg:grid-cols-2">
                        {groupedSubmissions.message.map(renderSubmissionCard)}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/50 bg-card/40 p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
                        No message submissions yet.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="drawing" className="mt-6">
                    {groupedSubmissions.drawing.length ? (
                      <div className="grid gap-5 lg:grid-cols-2">
                        {groupedSubmissions.drawing.map(renderSubmissionCard)}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/50 bg-card/40 p-8 text-center text-sm text-muted-foreground">
                        No drawing submissions yet.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="other" className="mt-6">
                    {groupedSubmissions.other.length ? (
                      <div className="grid gap-5 lg:grid-cols-2">
                        {groupedSubmissions.other.map(renderSubmissionCard)}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/50 bg-card/40 p-8 text-center text-sm text-muted-foreground">
                        No submissions in this category yet.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
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

