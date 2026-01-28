import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Palette, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/PageLayout';
import BrowserFrame from '@/components/decorations/BrowserFrame';
import DrawingCanvas from '@/components/DrawingCanvas';

const ContactPage = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'message' | 'drawing'>('drawing');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureEnding, setSignatureEnding] = useState('with love');
  const [signatureFont, setSignatureFont] = useState('dancing');
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Detect landscape orientation - use aspect ratio > 1.3 and max height 600px for mobile landscape
  useEffect(() => {
    const checkLandscape = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      const isMobileSize = window.innerHeight < 600;
      const landscape = aspectRatio > 1.3 && isMobileSize;
      setIsLandscape(landscape);
    };
    
    checkLandscape();
    window.addEventListener('resize', checkLandscape);
    window.addEventListener('orientationchange', checkLandscape);
    
    return () => {
      window.removeEventListener('resize', checkLandscape);
      window.removeEventListener('orientationchange', checkLandscape);
    };
  }, []);

  const signatureEndingOptions = ['thanks', 'with love', 'xoxo', 'best wishes', 'warmly', 'cheers', 'yours truly'];
  const fontOptions = [
    { value: 'dancing', label: 'Dancing Script', className: 'font-dancing' },
    { value: 'caveat', label: 'Caveat', className: 'font-caveat' },
    { value: 'pacifico', label: 'Pacifico', className: 'font-pacifico' },
    { value: 'great-vibes', label: 'Great Vibes', className: 'font-great-vibes' },
  ];

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

  const formatCooldownTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleMessageSubmit = async () => {
    if (cooldownTimeLeft > 0 || !message.trim()) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('submissions').insert({
        type: 'message',
        content: message,
        signature_enabled: signatureEnabled,
        signature_text: signatureEnabled ? `${signatureEnding}, ${signatureName}` : null,
        signature_font: signatureEnabled ? signatureFont : null,
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
    } catch (error) {
      console.error('Error submitting:', error);
    }

    setIsSubmitting(false);
  };

  const handleDrawingSubmit = async (dataUrl: string, caption: string) => {
    if (cooldownTimeLeft > 0) return;
    setIsSubmitting(true);

    try {
      const content = JSON.stringify({ drawing: dataUrl, caption });
      
      const { error } = await supabase.from('submissions').insert({
        type: 'drawing',
        content,
        is_approved: false
      });

      if (error) throw error;

      localStorage.setItem('lastSubmissionTime', Date.now().toString());
      setCooldownTimeLeft(60);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting:', error);
    }

    setIsSubmitting(false);
  };

  // Landscape mode: minimal fullscreen layout
  if (isLandscape && activeTab === 'drawing') {
    return (
      <div className="fixed inset-0 z-[90] bg-background flex flex-col">
        {/* Minimal top bar with tabs and navigation */}
        <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-background/95 backdrop-blur-sm border-b border-border/30">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('message')}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono lowercase rounded transition-all ${
                activeTab === 'message'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircle className="w-2.5 h-2.5" />
              message
            </button>
            <button
              onClick={() => setActiveTab('drawing')}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono lowercase rounded transition-all ${
                activeTab === 'drawing'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette className="w-2.5 h-2.5" />
              drawing
            </button>
          </div>
          
          {/* Navigation links */}
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              className="text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              home
            </Link>
            <Link 
              to="/portfolio" 
              className="text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              portfolio
            </Link>
            <span className="text-[9px] font-mono text-foreground bg-foreground/10 px-1.5 py-0.5 rounded">
              say hi
            </span>
          </div>
        </div>
        
        {/* Drawing canvas takes rest of screen */}
        <div className="flex-1 min-h-0 p-2">
          <DrawingCanvas
            onSubmit={handleDrawingSubmit}
            isSubmitting={isSubmitting}
            cooldownTimeLeft={cooldownTimeLeft}
            formatCooldownTime={formatCooldownTime}
          />
        </div>
      </div>
    );
  }

  return (
    <PageLayout title="say hi">
      <motion.div 
        ref={formRef} 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={`mx-auto h-full flex flex-col overflow-auto pb-4 ${
        activeTab === 'drawing' ? 'max-w-4xl' : 'max-w-2xl'
      }`}>
        <BrowserFrame title="submit://anonymous" className={activeTab === 'drawing' ? 'h-full flex flex-col' : ''}>
          {/* Tab switcher */}
          <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('message')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-mono lowercase rounded-md sm:rounded-lg transition-colors ${
                activeTab === 'message'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              message
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('drawing')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-mono lowercase rounded-md sm:rounded-lg transition-colors ${
                activeTab === 'drawing'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              drawing
            </motion.button>
          </div>

          {/* Message form */}
          {activeTab === 'message' && (
            <div className="space-y-2 sm:space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="write something nice..."
                className="w-full h-20 sm:h-24 p-2 sm:p-3 bg-muted/20 border border-border/30 rounded-md sm:rounded-lg resize-none focus:outline-none focus:border-foreground/50 font-mono text-xs sm:text-sm placeholder:text-muted-foreground/50"
              />

              {/* Signature toggle */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setSignatureEnabled(!signatureEnabled)}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 transition-all ${
                    signatureEnabled ? 'bg-foreground border-foreground' : 'border-muted-foreground'
                  }`}
                />
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">add signature</span>
              </div>

              {signatureEnabled && (
                <div className="space-y-1.5 sm:space-y-2 p-2 sm:p-3 bg-muted/10 rounded-md sm:rounded-lg">
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="your name"
                    className="w-full p-1.5 sm:p-2 bg-muted/20 border border-border/30 rounded-md sm:rounded-lg focus:outline-none focus:border-foreground/50 font-mono text-[10px] sm:text-xs"
                  />
                  <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                    {signatureEndingOptions.map((ending) => (
                      <button
                        key={ending}
                        onClick={() => setSignatureEnding(ending)}
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-mono rounded-full transition-all ${
                          signatureEnding === ending
                            ? 'bg-foreground text-background'
                            : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {ending}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                    {fontOptions.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => setSignatureFont(font.value)}
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full transition-all ${font.className} ${
                          signatureFont === font.value
                            ? 'bg-foreground text-background'
                            : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                  
                  {signatureName && (
                    <p className={`text-xs sm:text-sm text-center pt-1 ${fontOptions.find(f => f.value === signatureFont)?.className}`}>
                      {signatureEnding}, {signatureName}
                    </p>
                  )}
                </div>
              )}

              {/* Submit button for message */}
              <button
                onClick={handleMessageSubmit}
                disabled={isSubmitting || cooldownTimeLeft > 0 || !message.trim()}
                className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs lowercase rounded-md sm:rounded-lg transition-all ${
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
                  `wait ${formatCooldownTime(cooldownTimeLeft)}`
                ) : isSubmitting ? (
                  'sending...'
                ) : (
                  <>
                    <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    send message
                  </>
                )}
              </button>
            </div>
          )}

          {/* Drawing canvas - the new fancy one! */}
          {activeTab === 'drawing' && (
            <DrawingCanvas
              onSubmit={handleDrawingSubmit}
              isSubmitting={isSubmitting}
              cooldownTimeLeft={cooldownTimeLeft}
              formatCooldownTime={formatCooldownTime}
            />
          )}
        </BrowserFrame>
      </motion.div>
    </PageLayout>
  );
};

export default ContactPage;
