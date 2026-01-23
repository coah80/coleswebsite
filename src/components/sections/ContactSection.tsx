import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Send, Palette, MessageCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SlamText from '@/components/typography/SlamText';
import BrowserFrame from '@/components/decorations/BrowserFrame';

gsap.registerPlugin(ScrollTrigger);

const HISTORY_LIMIT = 25;

type CanvasSnapshot = {
  data: ImageData;
  background: string;
};

const ContactSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasAnimated = useRef(false);

  const [activeTab, setActiveTab] = useState<'message' | 'drawing'>('message');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureEnding, setSignatureEnding] = useState('with love');
  const [signatureFont, setSignatureFont] = useState('dancing');
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('#0a0a1a');
  const [brushSize, setBrushSize] = useState(3);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [history, setHistory] = useState<CanvasSnapshot[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const activePointerIdRef = useRef<number | null>(null);
  const strokePointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const lastMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);

  const signatureEndingOptions = ['thanks', 'with love', 'xoxo', 'best wishes', 'warmly', 'cheers', 'yours truly'];
  const fontOptions = [
    { value: 'dancing', label: 'Dancing Script', className: 'font-dancing' },
    { value: 'caveat', label: 'Caveat', className: 'font-caveat' },
    { value: 'pacifico', label: 'Pacifico', className: 'font-pacifico' },
    { value: 'great-vibes', label: 'Great Vibes', className: 'font-great-vibes' },
  ];

  // ScrollTrigger animation
  useEffect(() => {
    if (!formRef.current || hasAnimated.current) return;

    gsap.set(formRef.current, {
      y: 40,
      opacity: 0
    });

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 70%',
      onEnter: () => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        gsap.to(formRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'back.out(1.2)'
        });
      },
      once: true
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Canvas initialization
  useEffect(() => {
    if (activeTab !== 'drawing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [activeTab, backgroundColor]);

  // Cooldown timer
  useEffect(() => {
    const checkCooldown = () => {
      const lastSubmission = localStorage.getItem('lastSubmissionTime');
      if (lastSubmission) {
        const timeSince = Date.now() - parseInt(lastSubmission);
        const cooldownDuration = 60000;
        if (timeSince < cooldownDuration) {
          setCooldownTimeLeft(Math.ceil((cooldownDuration - timeSince) / 1000));
        } else {
          setCooldownTimeLeft(0);
        }
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => {
        const trimmed = prev.length >= HISTORY_LIMIT ? prev.slice(prev.length - HISTORY_LIMIT + 1) : prev;
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
  }, [history]);

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== null) return;
    activePointerIdRef.current = e.pointerId;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    
    pushHistory();
    const pos = getPointerPos(e);
    strokePointsRef.current = [pos];
    lastMidpointRef.current = null;
    isDrawingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activePointerIdRef.current || !isDrawingRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pos = getPointerPos(e);
    strokePointsRef.current.push(pos);

    if (strokePointsRef.current.length < 2) return;

    const points = strokePointsRef.current;
    const len = points.length;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;

    const p1 = points[len - 2];
    const p2 = points[len - 1];
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    ctx.beginPath();
    if (lastMidpointRef.current) {
      ctx.moveTo(lastMidpointRef.current.x, lastMidpointRef.current.y);
      ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
    } else {
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(mid.x, mid.y);
    }
    ctx.stroke();
    lastMidpointRef.current = mid;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    activePointerIdRef.current = null;
    isDrawingRef.current = false;
    strokePointsRef.current = [];
    lastMidpointRef.current = null;
  };

  const handleSubmit = async () => {
    if (cooldownTimeLeft > 0) return;
    setIsSubmitting(true);

    try {
      let content = '';
      let type = 'message';

      if (activeTab === 'message') {
        if (!message.trim()) {
          setIsSubmitting(false);
          return;
        }
        content = message;
        type = 'message';
      } else {
        const canvas = canvasRef.current;
        if (!canvas) {
          setIsSubmitting(false);
          return;
        }
        content = canvas.toDataURL('image/png');
        type = 'drawing';
      }

      const { error } = await supabase.from('submissions').insert({
        type,
        content,
        signature_enabled: activeTab === 'message' ? signatureEnabled : false,
        signature_text: activeTab === 'message' && signatureEnabled ? `${signatureEnding}, ${signatureName}` : null,
        signature_font: activeTab === 'message' && signatureEnabled ? signatureFont : null,
        is_approved: false
      });

      if (error) throw error;

      localStorage.setItem('lastSubmissionTime', Date.now().toString());
      setCooldownTimeLeft(60);
      setMessage('');
      setSignatureName('');
      setSignatureEnabled(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);

      // Clear canvas
      if (activeTab === 'drawing' && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const rect = canvasRef.current.getBoundingClientRect();
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, rect.width, rect.height);
        }
        setHistory([]);
      }
    } catch (error) {
      console.error('Error submitting:', error);
    }

    setIsSubmitting(false);
  };

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
          say hi
        </SlamText>
        <p className="mt-4 text-muted-foreground font-mono text-sm md:text-base">
          send me a message or draw something
        </p>
      </div>

      <div ref={formRef} className="w-full max-w-xl">
        <BrowserFrame title="submit://anonymous">
          {/* Tab switcher */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('message')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-mono lowercase rounded-lg transition-all ${
                activeTab === 'message'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              message
            </button>
            <button
              onClick={() => setActiveTab('drawing')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-mono lowercase rounded-lg transition-all ${
                activeTab === 'drawing'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette className="w-4 h-4" />
              drawing
            </button>
          </div>

          {/* Message form */}
          {activeTab === 'message' && (
            <div className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="write something nice..."
                className="w-full h-32 p-4 bg-muted/20 border border-border/30 rounded-lg resize-none focus:outline-none focus:border-foreground/50 font-mono text-sm placeholder:text-muted-foreground/50"
              />

              {/* Signature toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSignatureEnabled(!signatureEnabled)}
                  className={`w-5 h-5 rounded border-2 transition-all ${
                    signatureEnabled ? 'bg-foreground border-foreground' : 'border-muted-foreground'
                  }`}
                />
                <span className="text-sm font-mono text-muted-foreground">add signature</span>
              </div>

              {signatureEnabled && (
                <div className="space-y-3 p-4 bg-muted/10 rounded-lg">
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="your name"
                    className="w-full p-3 bg-muted/20 border border-border/30 rounded-lg focus:outline-none focus:border-foreground/50 font-mono text-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {signatureEndingOptions.map((ending) => (
                      <button
                        key={ending}
                        onClick={() => setSignatureEnding(ending)}
                        className={`px-3 py-1.5 text-xs font-mono rounded-full transition-all ${
                          signatureEnding === ending
                            ? 'bg-foreground text-background'
                            : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {ending}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {fontOptions.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => setSignatureFont(font.value)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-all ${font.className} ${
                          signatureFont === font.value
                            ? 'bg-foreground text-background'
                            : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Preview */}
                  {signatureName && (
                    <p className={`text-lg text-center pt-2 ${fontOptions.find(f => f.value === signatureFont)?.className}`}>
                      {signatureEnding}, {signatureName}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Drawing canvas */}
          {activeTab === 'drawing' && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-border/30">
                <canvas
                  ref={canvasRef}
                  className="w-full aspect-[4/3] touch-none cursor-crosshair"
                  style={{ backgroundColor }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
              </div>

              {/* Drawing controls */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">brush</span>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">size</span>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-20"
                    />
                  </label>
                </div>
                <button
                  onClick={undoLastStroke}
                  disabled={history.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  undo
                </button>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || cooldownTimeLeft > 0 || (activeTab === 'message' && !message.trim())}
            className={`w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 font-mono text-sm lowercase rounded-lg transition-all ${
              submitSuccess
                ? 'bg-green-500 text-white'
                : cooldownTimeLeft > 0
                ? 'bg-muted/30 text-muted-foreground cursor-not-allowed'
                : 'bg-foreground text-background hover:opacity-90'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitSuccess ? (
              'sent!'
            ) : cooldownTimeLeft > 0 ? (
              `wait ${cooldownTimeLeft}s`
            ) : isSubmitting ? (
              'sending...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                send {activeTab}
              </>
            )}
          </button>
        </BrowserFrame>
      </div>
    </section>
  );
};

export default ContactSection;
