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
    const { productName, description, price, availability, brandColor, imageUrls = [] } = await req.json();

    console.log('Generating payment page for:', productName);

    // Create image list for prompt
    const imageList = imageUrls.length > 0 
      ? imageUrls.map((url, index) => `Image ${index + 1}: ${url}`).join('\n- ')
      : 'no images provided';

    // Create OpenAI prompt for generating payment page HTML
    const prompt = `You are a world-class creative web designer, specializing in high-converting, visually dynamic landing pages for modern brands.

Your task: 
Generate a visually stunning, responsive, SEO-optimized HTML+CSS landing page in Vivid Money style for the following offer:

- Product/service name: ${productName}
- Description: ${description || 'Premium product'}
- Price: $${price}
- Availability: ${availability || 'Available now'}
- Brand color: ${brandColor}
- Images: ${imageList}

**Visual & UX requirements:**
- Use Vivid Money's branding: primary color #6A57FF, secondary #00DAB5, modern white backgrounds, bold headings, and official logo in the sticky footer.
- The landing page must be divided into 3-5 distinct "frames" or "cards" (sections), each visually separated as if they could be exported as Instagram carousel slides, or summarized into a single stylish card for Instagram post.
- Use large, bold H1 for the title, H2 for sections, playful but clean font (Inter/Montserrat).
- **Image usage:** Place images in creative, dynamic ways across the frames—mix shapes (circle, rounded square, blob, slanted mask, etc.), not just rectangles. At least one image should be displayed as a circle or custom shape, and consider overlapping or offset image+text sections for a modern look.
- Use soft shadows, gentle gradients, subtle animations (CSS transitions), and white space for a premium look.
- CTA "Pay Now" button should be elegant and visible but **not overpowering**—blend it into the design, not as the primary focal point.
- Each frame/section should be visually "shareable" (as carousel slide or Instagram card).
- Add at least one sample testimonial in a styled bubble.
- Highlight price and availability in an attractive but non-aggressive way.
- Responsive/mobile friendly layout (flex, grid, media queries).
- Add SEO tags: meta title, description, OG tags, Twitter card, product structured data.
- Return a single, valid HTML file with all embedded CSS (no external JS or CSS).
- All text in English.

If multiple images are provided, use them strategically in different frames/sections. Style the frames in the manner of popular Instagram carousel templates (e.g. Canva), with creative masks, gradients, and dynamic layouts.
Make the design visually delightful, modern, and highly brandable, suitable for social sharing.

Return only the complete HTML file.
Do not show AI responses in the preview`;

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