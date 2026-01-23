import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DrawingCanvas from './DrawingCanvas';

interface SubmissionsSectionProps {
  onSubmitSuccess?: () => void;
}

const SubmissionsSection = ({ onSubmitSuccess }: SubmissionsSectionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownTimeLeft] = useState(0);
  const { toast } = useToast();

  const formatCooldownTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleDrawingSubmit = async (drawingData: string, caption: string) => {
    setIsSubmitting(true);

    try {
      const submissionContent = JSON.stringify({
        drawing: drawingData,
        caption: caption.trim() || '',
      });

      const { error } = await supabase.from('submissions').insert({
        type: 'drawing',
        content: submissionContent,
        is_approved: false,
      });

      if (error) throw error;

      toast({
        title: 'Submission sent!',
        description: 'Your drawing has been submitted for review',
      });

      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your drawing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black lowercase tracking-tight text-foreground mb-2">
          draw something for me
        </h2>
        <p className="text-sm text-muted-foreground font-mono">
          create a drawing and i might feature it on my page
        </p>
      </div>

      <DrawingCanvas
        onSubmit={handleDrawingSubmit}
        isSubmitting={isSubmitting}
        cooldownTimeLeft={cooldownTimeLeft}
        formatCooldownTime={formatCooldownTime}
      />
    </div>
  );
};

export default SubmissionsSection;
