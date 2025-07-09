import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, description, price, availability, brandColor } = await req.json();

    console.log('Generating payment page for:', productName);

    // Create OpenAI prompt for generating payment page HTML
    const prompt = `You are a world-class conversion designer, copywriter and web developer.

Generate a modern, high-converting, SEO-optimized payment landing page in Vivid Money style for the following offer:

Product/service name: ${productName}
Description: ${description || 'Premium product'}
Price: $${price}
Availability: ${availability || 'Available now'}
Brand color: ${brandColor}
Images: no image provided

Requirements:
- Use brand color ${brandColor} as primary colors and clean, modern white background.
- Use 'Inter', 'Montserrat', or a similar sans-serif font.
- Include a footer banner with "Powered by Vivid Money" (always visible, sticky at the bottom) with purple background (#6A57FF).
- Large, bold H1 for product/service name, use H2 for sections.
- Beautiful card-like layout with soft shadows and rounded corners.
- Responsive/mobile-friendly design (use media queries).
- SEO meta tags: title, meta description, Open Graph, Twitter card, product structured data.
- Write a more compelling, user-friendly product description using persuasive, conversational language (expand and improve "${description || 'Premium product'}" if needed).
- Section for up to 3 product images (or placeholder image with description if none provided).
- "Pay Now" CTA button, styled in Vivid Money purple (#6A57FF) with hover effects.
- "${availability || 'Limited offer'}" highlighted prominently (e.g. "Only 5 left!" or similar urgency).
- Add at least one sample testimonial ("This was the easiest payment ever! – Happy customer").
- Include trust indicators and security badges.
- Add subtle animations and hover effects for modern feel.
- Include placeholder for payment widget with comment: <!-- PAYMENT_WIDGET_PLACEHOLDER -->
- Use modern CSS Grid/Flexbox layouts.
- Return a single, valid HTML file with embedded CSS, and nothing else.
- All text in English.
- Focus on conversion optimization with persuasive copy and clear value proposition.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert web developer specializing in high-converting payment pages. Create professional, modern HTML with embedded CSS that follows best practices for conversion optimization and user experience.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from OpenAI');
    }

    const generatedHtml = data.choices[0].message.content;

    // Store the generated page in the database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: savedPage, error: dbError } = await supabase
      .from('payment_pages')
      .insert({
        product_name: productName,
        description: description,
        price: parseFloat(price),
        availability: availability,
        brand_color: brandColor,
        generated_html: generatedHtml,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save payment page');
    }

    console.log('Payment page generated and saved with ID:', savedPage.id);

    return new Response(JSON.stringify({ 
      id: savedPage.id,
      generatedHtml,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-payment-page function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});