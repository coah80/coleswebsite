import { useState, useRef, useEffect, useCallback } from 'react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { useToast } from '@/hooks/use-toast';
import {
  MessageCircle,
  Palette,
  Send,
  Heart,
  Smile,
  Sparkles,
  PenTool,
  RotateCcw
} from 'lucide-react';
// Removed Fabric.js import - using HTML5 Canvas instead
import { supabase } from '@/integrations/supabase/client';

const HISTORY_LIMIT = 25;

type CanvasSnapshot = {
  data: ImageData;
  background: string;
};

const SubmissionsSection = () => {
  const [activeTab, setActiveTab] = useState<'message' | 'drawing'>('message');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureEnding, setSignatureEnding] = useState('with love');
  const [signatureFont, setSignatureFont] = useState('dancing');
  const [brushColor, setBrushColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [colorMode, setColorMode] = useState<'brush' | 'background'>('brush');
  const [brushSize, setBrushSize] = useState(3);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [history, setHistory] = useState<CanvasSnapshot[]>([]);
  const activePointerIdRef = useRef<number | null>(null);
  const strokePointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const lastMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const { toast } = useToast();

  const signatureEndingOptions = [
    'thanks',
    'with love',
    'xoxo',
    'best wishes',
    'warmly',
    'cheers',
    'yours truly'
  ];

  // Slimmer set + plain print options
  const fontOptions = [
    { value: 'dancing', label: 'Dancing Script', className: 'font-dancing' },
    { value: 'caveat', label: 'Caveat', className: 'font-caveat' },
    { value: 'pacifico', label: 'Pacifico', className: 'font-pacifico' },
    { value: 'great-vibes', label: 'Great Vibes', className: 'font-great-vibes' },
    { value: 'inter', label: 'Inter (Print)', className: 'font-sans' },
    { value: 'poppins', label: 'Poppins (Print)', className: 'font-heading' },
    { value: 'nunito', label: 'Nunito (Print)', className: 'font-rounded' },
    { value: 'source-sans', label: 'Source Sans (Print)', className: 'font-body' }
  ];

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => {
        const trimmed =
          prev.length >= HISTORY_LIMIT ? prev.slice(prev.length - HISTORY_LIMIT + 1) : prev;
        return [...trimmed, { data: snapshot, background: backgroundColor }];
      });
    } catch (error) {
      console.error('Failed to capture canvas history', error);
    }
  }, [backgroundColor]);

  const undoLastStroke = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previous = history[history.length - 1];
    ctx.putImageData(previous.data, 0, 0);
    setHistory((prev) => prev.slice(0, -1));

    if (previous.background !== backgroundColor) {
      setBackgroundColor(previous.background);
    }
  }, [history, backgroundColor]);

  // Cooldown management
  const COOLDOWN_MINUTES = 1;
  const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;

  const checkCooldown = (): boolean => {
    const lastSubmissionTime = localStorage.getItem('lastSubmissionTime');
    if (!lastSubmissionTime) return true;
    
    const timeSince = Date.now() - parseInt(lastSubmissionTime);
    const timeLeft = COOLDOWN_MS - timeSince;
    
    if (timeLeft > 0) {
      setCooldownTimeLeft(Math.ceil(timeLeft / 1000));
      return false;
    }
    
    setCooldownTimeLeft(0);
    return true;
  };

  const setSubmissionTime = () => {
    localStorage.setItem('lastSubmissionTime', Date.now().toString());
    setCooldownTimeLeft(COOLDOWN_MS / 1000);
  };

  const formatCooldownTime = (seconds: number): string => {
    if (seconds <= 0) return '';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check cooldown on component mount and set up interval
  useEffect(() => {
    checkCooldown();
    
    const interval = setInterval(() => {
      if (cooldownTimeLeft > 0) {
        setCooldownTimeLeft(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownTimeLeft]);

  const submitMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "write something first",
        description: "can't send empty messages",
        variant: "destructive"
      });
      return;
    }

    if (!checkCooldown()) {
      toast({
        title: "slow down there",
        description: `wait ${formatCooldownTime(cooldownTimeLeft)} before sending another message`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .insert({
          type: 'message',
          content: message.trim(),
          signature_enabled: signatureEnabled,
          signature_text: signatureEnabled ? `${signatureEnding}, ${signatureName}` : null,
          signature_font: signatureEnabled ? signatureFont : null
        });

      if (error) throw error;

      setSubmissionTime();
      toast({
        title: "message sent",
        description: "coah will see it soon"
      });
      setMessage('');
    } catch (error) {
      toast({
        title: "something broke",
        description: "try again or whatever",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDrawing = async () => {
    if (!canvasRef.current) {
      console.log('No canvas available');
      return;
    }

    if (!checkCooldown()) {
      toast({
        title: "slow down there",
        description: `wait ${formatCooldownTime(cooldownTimeLeft)} before sending another drawing`,
        variant: "destructive"
      });
      return;
    }
    
    // Ensure background is applied before getting data URL
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create a new canvas to composite the background and drawing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // First draw the background
        tempCtx.fillStyle = backgroundColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Then draw the existing canvas content on top
        tempCtx.drawImage(canvas, 0, 0);
        
        // Get the data URL from the composite canvas
        const dataURL = tempCanvas.toDataURL('image/png');
        console.log('Generated dataURL with background:', dataURL.slice(0, 50) + '...');
        
        setIsSubmitting(true);
        try {
          const { error } = await supabase
            .from('submissions')
            .insert({
              type: 'drawing',
              content: dataURL
            });

          if (error) throw error;

          setSubmissionTime();
          toast({
            title: "drawing sent",
            description: "your art is on its way to coah"
          });
          
          // Clear canvas and reapply background
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          setHistory([]);
        } catch (error) {
          console.error('Error submitting drawing:', error);
          toast({
            title: "something broke",
            description: "try again or whatever",
            variant: "destructive"
          });
        } finally {
          setIsSubmitting(false);
        }
        return;
      }
    }
    // Fallback if temp canvas creation fails
    console.log('Fallback: submitting without background composite');
  };

  // Initialize HTML5 Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Set canvas size based on container
      const container = canvas.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;
        canvas.width = Math.min(containerWidth * 0.9, 600);
        canvas.height = (canvas.width * 3) / 4; // 4:3 aspect ratio
      } else {
        canvas.width = 400;
        canvas.height = 300;
      }
      
      console.log('Canvas initialized with size:', canvas.width, 'x', canvas.height, 'and background:', backgroundColor);
    }
  }, []);

  // Force initial background rendering by changing state
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Trigger the background change sequence that we know works
    const timer1 = setTimeout(() => {
      setBackgroundColor('#fffffe'); // Slightly off-white
    }, 100);
    
    const timer2 = setTimeout(() => {
      setBackgroundColor('#ffffff'); // Back to pure white
    }, 200);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []); // Run only once on mount

  // Handle background color changes and preserve existing drawings
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Save existing drawing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Apply new background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Restore drawing on top of new background
      ctx.putImageData(imageData, 0, 0);
      
      console.log('Background color applied:', backgroundColor);
    }
  }, [backgroundColor]);

  // Drawing functions
  const getRelativePosition = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }, []);

  const beginStroke = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      event.preventDefault();
      pushHistory();

      const startPoint = getRelativePosition(event);
      strokePointsRef.current = [startPoint];
      lastMidpointRef.current = startPoint;
      activePointerIdRef.current = event.pointerId;
      isDrawingRef.current = true;

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (_error) {
        // Some browsers throw if capture is not supported; ignore.
      }

      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(startPoint.x + 0.01, startPoint.y + 0.01);
      ctx.stroke();
    },
    [brushColor, brushSize, getRelativePosition, pushHistory]
  );

  const extendStroke = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || activePointerIdRef.current !== event.pointerId) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      event.preventDefault();

      const points = strokePointsRef.current;
      if (points.length === 0) {
        return;
      }

      const currentPoint = getRelativePosition(event);
      const previousPoint = points[points.length - 1];
      const midpoint = {
        x: (previousPoint.x + currentPoint.x) / 2,
        y: (previousPoint.y + currentPoint.y) / 2
      };

      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const startPoint = lastMidpointRef.current ?? previousPoint;
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.quadraticCurveTo(previousPoint.x, previousPoint.y, midpoint.x, midpoint.y);
      ctx.stroke();

      lastMidpointRef.current = midpoint;
      points.push(currentPoint);
    },
    [brushColor, brushSize, getRelativePosition]
  );

  const endStroke = useCallback(
    (event?: React.PointerEvent<HTMLCanvasElement>) => {
      const pointerId = event?.pointerId ?? activePointerIdRef.current;
      if (pointerId === null) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (canvas) {
        try {
          canvas.releasePointerCapture(pointerId);
        } catch (_error) {
          // Ignore if capture was not set
        }
      }

      if (event) {
        event.preventDefault();
      }

      if (ctx && strokePointsRef.current.length >= 2) {
        const points = strokePointsRef.current;
        const lastPoint = points[points.length - 1];
        const previousPoint = points[points.length - 2];

        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const startPoint = lastMidpointRef.current ?? previousPoint;
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.quadraticCurveTo(previousPoint.x, previousPoint.y, lastPoint.x, lastPoint.y);
        ctx.stroke();
      }

      isDrawingRef.current = false;
      activePointerIdRef.current = null;
      strokePointsRef.current = [];
      lastMidpointRef.current = null;
    },
    [brushColor, brushSize]
  );

  const handleColorChange = (color: string) => {
    if (colorMode === 'brush') {
      setBrushColor(color);
    } else {
      if (color !== backgroundColor) {
        pushHistory();
        setBackgroundColor(color);
      }
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      pushHistory();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const canUndo = history.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 bg-gradient-primary bg-clip-text text-transparent font-display">
          leave coah a message
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground font-rounded italic">
          send me something cool or just say hi
        </p>
      </div>

      {/* Tab Selection */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={activeTab === 'message' ? 'default' : 'secondary'}
          onClick={() => setActiveTab('message')}
          className="flex-1 max-w-xs text-sm sm:text-base font-heading font-medium"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          message
        </Button>
        <Button
          variant={activeTab === 'drawing' ? 'default' : 'secondary'}
          onClick={() => setActiveTab('drawing')}
          className="flex-1 max-w-xs text-sm sm:text-base font-heading font-medium"
        >
          <Palette className="mr-2 h-4 w-4" />
          drawing
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Input Area */}
        <div className="xl:col-span-2 space-y-4 lg:space-y-6">
          {activeTab === 'message' && (
            <Card className="bg-card/50 border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-accent" />
                  write something
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="yo coah, just wanted to say..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-32 sm:min-h-40 lg:min-h-48 bg-background/50 border-border/50 text-sm sm:text-base"
                  maxLength={500}
                />
                
                {/* Signature Section */}
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="signature"
                      checked={signatureEnabled}
                      onCheckedChange={(checked) => setSignatureEnabled(checked === true)}
                    />
                    <label htmlFor="signature" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      Add a signature
                    </label>
                  </div>
                  
                  {signatureEnabled && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Your name</label>
                          <Input
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder="Enter your name"
                            className="h-8"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Signature ending</label>
                            <Select value={signatureEnding} onValueChange={setSignatureEnding}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border border-border shadow-lg z-50">
                                {signatureEndingOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Font style</label>
                            <Select value={signatureFont} onValueChange={setSignatureFont}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border border-border shadow-lg z-50">
                                {fontOptions.map((font) => (
                                  <SelectItem key={font.value} value={font.value}>
                                    <span className={font.className}>{font.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      {/* Preview */}
                      {signatureName && (
                        <div className="pt-2 border-t border-border/30">
                          <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                          <div className={`text-right italic ${fontOptions.find(f => f.value === signatureFont)?.className} text-primary`}>
                            — {signatureEnding}, {signatureName}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {message.length}/500 characters
                  </span>
                  <Button 
                    onClick={submitMessage}
                    disabled={isSubmitting || !message.trim() || cooldownTimeLeft > 0}
                    className="shadow-link"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'sending...' : cooldownTimeLeft > 0 ? `wait ${formatCooldownTime(cooldownTimeLeft)}` : 'send'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'drawing' && (
            <Card className="bg-card/50 border-border/30">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                    <Sparkles className="h-5 w-5 text-accent" />
                    draw something
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">size:</span>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-16 sm:w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground w-6">{brushSize}px</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full border border-border/50 rounded-lg cursor-crosshair"
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      aspectRatio: '4/3',
                      minHeight: '250px',
                      maxHeight: '400px',
                      backgroundColor: backgroundColor, // Ensure CSS background matches
                      touchAction: 'none'
                    }}
                    onPointerDown={beginStroke}
                    onPointerMove={extendStroke}
                    onPointerUp={endStroke}
                    onPointerCancel={endStroke}
                    onPointerLeave={(event) => {
                      if (activePointerIdRef.current === event.pointerId) {
                        endStroke(event);
                      }
                    }}
                    onLostPointerCapture={(event) => {
                      if (activePointerIdRef.current === event.pointerId) {
                        endStroke(event);
                      }
                    }}
                    onContextMenu={(event) => event.preventDefault()}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={undoLastStroke}
                      disabled={!canUndo}
                      className="text-xs"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Undo
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={clearCanvas}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <ColorPicker
                      brushColor={brushColor}
                      backgroundColor={backgroundColor}
                      onChange={handleColorChange}
                      mode={colorMode}
                      onModeChange={setColorMode}
                    />
                    <span className="text-xs text-muted-foreground">
                      click and drag to draw
                    </span>
                  </div>
                  <Button 
                    onClick={submitDrawing}
                    disabled={isSubmitting || !canvasRef.current || cooldownTimeLeft > 0}
                    className="shadow-link"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'sending...' : cooldownTimeLeft > 0 ? `wait ${formatCooldownTime(cooldownTimeLeft)}` : 'send drawing'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="xl:col-span-1 space-y-4 lg:space-y-6">
          <Card className="bg-card/30 border-border/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smile className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">anonymous obvs</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                your messages and drawings are completely anonymous. i might share the cool ones but your identity stays secret, unless you want to reveal it.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <span className="text-2xl mb-2 block">🎨</span>
              <p className="text-sm font-medium mb-1">
                be creative
              </p>
              <p className="text-xs text-muted-foreground">
                send memes, doodles, compliments, or just say hi. i like hearing from people
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsSection;
