import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Send, Palette, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/PageLayout';
import BrowserFrame from '@/components/decorations/BrowserFrame';
import DrawingCanvas from '@/components/DrawingCanvas';

const ContactPage = () => {
  const formRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'message' | 'drawing'>('message');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureEnding, setSignatureEnding] = useState('with love');
  const [signatureFont, setSignatureFont] = useState('dancing');
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const signatureEndingOptions = ['thanks', 'with love', 'xoxo', 'best wishes', 'warmly', 'cheers', 'yours truly'];
  const fontOptions = [
    { value: 'dancing', label: 'Dancing Script', className: 'font-dancing' },
    { value: 'caveat', label: 'Caveat', className: 'font-caveat' },
    { value: 'pacifico', label: 'Pacifico', className: 'font-pacifico' },
    { value: 'great-vibes', label: 'Great Vibes', className: 'font-great-vibes' },
  ];

  // Animate form on mount
  useEffect(() => {
    if (!formRef.current) return;
    
    gsap.set(formRef.current, { opacity: 0, y: 30 });
    gsap.to(formRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.4)',
      delay: 1.8
    });
  }, []);

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

  return (
    <PageLayout title="say hi">
      <div ref={formRef} className={`mx-auto h-full flex flex-col overflow-auto ${
        activeTab === 'drawing' ? 'max-w-4xl' : 'max-w-2xl'
      }`}>
        <BrowserFrame title="submit://anonymous" className={activeTab === 'drawing' ? 'h-full flex flex-col' : ''}>
          {/* Tab switcher */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('message')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono lowercase rounded-lg transition-all ${
                activeTab === 'message'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              message
            </button>
            <button
              onClick={() => setActiveTab('drawing')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono lowercase rounded-lg transition-all ${
                activeTab === 'drawing'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette className="w-3 h-3" />
              drawing
            </button>
          </div>

          {/* Message form */}
          {activeTab === 'message' && (
            <div className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="write something nice..."
                className="w-full h-24 p-3 bg-muted/20 border border-border/30 rounded-lg resize-none focus:outline-none focus:border-foreground/50 font-mono text-sm placeholder:text-muted-foreground/50"
              />

              {/* Signature toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSignatureEnabled(!signatureEnabled)}
                  className={`w-4 h-4 rounded border-2 transition-all ${
                    signatureEnabled ? 'bg-foreground border-foreground' : 'border-muted-foreground'
                  }`}
                />
                <span className="text-xs font-mono text-muted-foreground">add signature</span>
              </div>

              {signatureEnabled && (
                <div className="space-y-2 p-3 bg-muted/10 rounded-lg">
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="your name"
                    className="w-full p-2 bg-muted/20 border border-border/30 rounded-lg focus:outline-none focus:border-foreground/50 font-mono text-xs"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {signatureEndingOptions.map((ending) => (
                      <button
                        key={ending}
                        onClick={() => setSignatureEnding(ending)}
                        className={`px-2 py-1 text-[10px] font-mono rounded-full transition-all ${
                          signatureEnding === ending
                            ? 'bg-foreground text-background'
                            : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {ending}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {fontOptions.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => setSignatureFont(font.value)}
                        className={`px-2 py-1 text-xs rounded-full transition-all ${font.className} ${
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
                    <p className={`text-sm text-center pt-1 ${fontOptions.find(f => f.value === signatureFont)?.className}`}>
                      {signatureEnding}, {signatureName}
                    </p>
                  )}
                </div>
              )}

              {/* Submit button for message */}
              <button
                onClick={handleMessageSubmit}
                disabled={isSubmitting || cooldownTimeLeft > 0 || !message.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 font-mono text-xs lowercase rounded-lg transition-all ${
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
                    <Send className="w-3 h-3" />
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
      </div>
    </PageLayout>
  );
};

export default ContactPage;
