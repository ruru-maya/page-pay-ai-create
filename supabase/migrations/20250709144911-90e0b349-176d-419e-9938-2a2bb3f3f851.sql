-- Create storage bucket for payment page images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-images', 'payment-images', true);

-- Create storage policies for the payment-images bucket
CREATE POLICY "Anyone can view payment images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-images');

CREATE POLICY "Anyone can upload payment images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payment-images');

CREATE POLICY "Anyone can update payment images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'payment-images');

CREATE POLICY "Anyone can delete payment images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'payment-images');