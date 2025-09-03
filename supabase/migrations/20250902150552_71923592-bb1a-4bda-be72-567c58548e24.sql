-- Create table for anonymous submissions (drawings and messages)
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('drawing', 'message')),
  content TEXT NOT NULL, -- For messages, this is the text. For drawings, this is the drawing data
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_approved BOOLEAN DEFAULT false,
  admin_notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert submissions (anonymous)
CREATE POLICY "Anyone can submit anonymously" 
ON public.submissions 
FOR INSERT 
WITH CHECK (true);

-- Only allow reading approved submissions publicly
CREATE POLICY "Anyone can view approved submissions" 
ON public.submissions 
FOR SELECT 
USING (is_approved = true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();