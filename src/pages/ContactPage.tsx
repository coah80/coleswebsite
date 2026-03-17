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

  if (isLandscape && activeTab === 'drawing') {
    return (
      <div className="fixed inset-0 z-[90] bg-ctp-base flex flex-col">

        <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-ctp-base/95 backdrop-blur-sm border-b border-ctp-surface1/30">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('message')}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono lowercase rounded-xl transition-all ${
                activeTab === 'message'
                  ? 'bg-ctp-mauve text-ctp-crust font-bold'
                  : 'bg-ctp-surface0/40 text-ctp-overlay1 hover:text-ctp-text'
              }`}
            >
              <MessageCircle className="w-2.5 h-2.5" />
              message
            </button>
            <button
              onClick={() => setActiveTab('drawing')}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono lowercase rounded-xl transition-all ${
                activeTab === 'drawing'
                  ? 'bg-ctp-mauve text-ctp-crust font-bold'
                  : 'bg-ctp-surface0/40 text-ctp-overlay1 hover:text-ctp-text'
              }`}
            >
              <Palette className="w-2.5 h-2.5" />
              drawing
            </button>
          </div>


          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-[9px] font-mono text-ctp-overlay1 hover:text-ctp-text transition-colors"
            >
              home
            </Link>
            <Link
              to="/portfolio"
              className="text-[9px] font-mono text-ctp-overlay1 hover:text-ctp-text transition-colors"
            >
              portfolio
            </Link>
            <span className="text-[9px] font-mono text-ctp-text bg-ctp-surface0/40 px-1.5 py-0.5 rounded-xl">
              say hi
            </span>
          </div>
        </div>


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
    <PageLayout title="say hi" allowScroll={true}>
      <motion.div
        ref={formRef}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-xl flex flex-col pb-8">
        <BrowserFrame title="submit://anonymous" className={activeTab === 'drawing' ? 'h-full flex flex-col' : ''}>

          <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('message')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-mono lowercase rounded-xl transition-colors ${
                activeTab === 'message'
                  ? 'bg-ctp-mauve text-ctp-crust font-bold'
                  : 'bg-ctp-surface0/40 text-ctp-overlay1 hover:text-ctp-text'
              }`}
            >
              <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              message
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('drawing')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-mono lowercase rounded-xl transition-colors ${
                activeTab === 'drawing'
                  ? 'bg-ctp-mauve text-ctp-crust font-bold'
                  : 'bg-ctp-surface0/40 text-ctp-overlay1 hover:text-ctp-text'
              }`}
            >
              <Palette className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              drawing
            </motion.button>
          </div>


          {activeTab === 'message' && (
            <div className="space-y-2 sm:space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="write something nice..."
                maxLength={5000}
                className="w-full h-20 sm:h-24 p-2 sm:p-3 bg-ctp-surface0/40 border border-ctp-surface1/50 rounded-xl resize-none text-ctp-text placeholder:text-ctp-overlay1 focus:border-ctp-mauve/50 focus:ring-1 focus:ring-ctp-mauve/30 outline-none font-body text-xs sm:text-sm"
              />


              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setSignatureEnabled(!signatureEnabled)}
                  className={`w-5 h-5 sm:w-4 sm:h-4 rounded border-2 transition-all ${
                    signatureEnabled ? 'bg-ctp-mauve border-ctp-mauve' : 'border-ctp-overlay1'
                  }`}
                />
                <span className="text-ctp-overlay1 font-data text-xs">add signature</span>
              </div>

              {signatureEnabled && (
                <div className="space-y-1.5 sm:space-y-2 p-2 sm:p-3 bg-ctp-surface0/20 rounded-xl">
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="your name"
                    maxLength={50}
                    className="w-full p-1.5 sm:p-2 bg-ctp-surface0/40 border border-ctp-surface1/50 rounded-xl text-ctp-text placeholder:text-ctp-overlay1 focus:border-ctp-mauve/50 focus:ring-1 focus:ring-ctp-mauve/30 outline-none font-body text-[10px] sm:text-xs"
                  />
                  <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                    {signatureEndingOptions.map((ending) => (
                      <button
                        key={ending}
                        onClick={() => setSignatureEnding(ending)}
                        className={`px-1.5 sm:px-2 py-1.5 sm:py-1 text-[10px] sm:text-[10px] font-mono rounded-full transition-all ${
                          signatureEnding === ending
                            ? 'bg-ctp-mauve text-ctp-crust'
                            : 'bg-ctp-surface0/40 text-ctp-overlay1 hover:text-ctp-text'
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
                        className={`px-1.5 sm:px-2 py-1.5 sm:py-1 text-[10px] sm:text-xs rounded-full transition-all ${font.className} ${
                          signatureFont === font.value
                            ? 'bg-ctp-mauve text-ctp-crust'
                            : 'bg-ctp-surface0/40 text-ctp-overlay1 hover:text-ctp-text'
                        }`}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>

                  {signatureName && (
                    <p className={`text-xs sm:text-sm text-center pt-1 text-ctp-mauve ${fontOptions.find(f => f.value === signatureFont)?.className}`}>
                      {signatureEnding}, {signatureName}
                    </p>
                  )}
                </div>
              )}


              <button
                onClick={handleMessageSubmit}
                disabled={isSubmitting || cooldownTimeLeft > 0 || !message.trim()}
                className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-heading font-bold text-[10px] sm:text-xs lowercase rounded-xl transition-all ${
                  submitSuccess
                    ? 'bg-ctp-green text-ctp-crust'
                    : cooldownTimeLeft > 0
                    ? 'bg-ctp-surface0/40 text-ctp-overlay1 cursor-not-allowed'
                    : 'bg-ctp-mauve text-ctp-crust hover:brightness-110'
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
