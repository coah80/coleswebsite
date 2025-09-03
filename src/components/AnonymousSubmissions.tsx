import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Palette, Send, PenTool } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SubmissionsSection = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureEnding, setSignatureEnding] = useState('with love');
  const [signatureFont, setSignatureFont] = useState('dancing');
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

  const fontOptions = [
    { value: 'dancing', label: 'Dancing Script', className: 'font-dancing' },
    { value: 'pacifico', label: 'Pacifico', className: 'font-pacifico' },
    { value: 'great-vibes', label: 'Great Vibes', className: 'font-great-vibes' },
    { value: 'caveat', label: 'Caveat', className: 'font-caveat' },
  ];

  const handleMessageSubmit = async () => {
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .insert([
          {
            type: 'message',
            content: message.trim(),
            signature_enabled: signatureEnabled,
            signature_text: signatureEnabled ? `${signatureEnding}, ${signatureName}` : null,
            signature_font: signatureEnabled ? signatureFont : null
          }
        ]);

      if (error) throw error;

      setMessage('');
      toast({
        title: "Message sent! 💌",
        description: "Thanks for reaching out! Your message has been submitted.",
      });
    } catch (error) {
      toast({
        title: "Oops!",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DrawingCanvas = () => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

    const initCanvas = (canvasElement: HTMLCanvasElement) => {
      setCanvas(canvasElement);
      const ctx = canvasElement.getContext('2d');
      setContext(ctx);
      
      if (ctx) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDrawing(true);
      if (context && canvas) {
        const rect = canvas.getBoundingClientRect();
        context.beginPath();
        context.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !context || !canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      context.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      context.stroke();
    };

    const stopDrawing = () => {
      setIsDrawing(false);
    };

    const clearCanvas = () => {
      if (context && canvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const submitDrawing = async () => {
      if (!canvas) return;
      
      setIsSubmitting(true);
      try {
        const dataURL = canvas.toDataURL();
        const { error } = await supabase
          .from('submissions')
          .insert([
            {
              type: 'drawing',
              content: dataURL
            }
          ]);

        if (error) throw error;

        clearCanvas();
        toast({
          title: "Drawing submitted! 🎨",
          description: "Your artwork has been sent! Thanks for sharing your creativity.",
        });
      } catch (error) {
        toast({
          title: "Oops!",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="space-y-4">
        <canvas
          ref={initCanvas}
          width={400}
          height={300}
          className="border-2 border-dashed border-border rounded-lg bg-card cursor-crosshair w-full max-w-md mx-auto block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={clearCanvas}>
            Clear
          </Button>
          <Button onClick={submitDrawing} disabled={isSubmitting} className="shadow-glow">
            <Palette className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Drawing'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <section className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Leave me something! 
          </h2>
          <p className="text-lg text-muted-foreground">
            Send me a message or draw something fun! Everything is anonymous, so feel free to be creative 🎨
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Heart className="h-5 w-5 text-accent" />
              Anonymous Submissions
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="message" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="message" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Message
                </TabsTrigger>
                <TabsTrigger value="drawing" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Drawing
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="message" className="space-y-4">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Write me something nice, share a thought, ask a question, or just say hi! ✨"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-32 resize-none"
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
                    <span className="text-sm text-muted-foreground">
                      {message.length}/500 characters
                    </span>
                    <Button 
                      onClick={handleMessageSubmit}
                      disabled={!message.trim() || isSubmitting}
                      className="shadow-glow"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="drawing" className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Draw anything you want! Doodles, art, or just scribbles - I love seeing what people create 🎨
                  </p>
                  <DrawingCanvas />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Fun instructions */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            💡 Pro tip: I read everything! Feel free to share anything on your mind
          </p>
          <p className="text-xs text-muted-foreground">
            All submissions are anonymous and stored securely
          </p>
        </div>
      </div>
    </section>
  );
};

export default SubmissionsSection;