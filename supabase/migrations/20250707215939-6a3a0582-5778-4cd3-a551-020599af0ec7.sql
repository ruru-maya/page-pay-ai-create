-- Create a table to store generated payment pages
CREATE TABLE public.payment_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  product_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  availability TEXT,
  brand_color TEXT DEFAULT '#00C851',
  generated_html TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since these are payment pages that need to be publicly accessible)
CREATE POLICY "Payment pages are viewable by everyone" 
ON public.payment_pages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create payment pages" 
ON public.payment_pages 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payment_pages_updated_at
BEFORE UPDATE ON public.payment_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();