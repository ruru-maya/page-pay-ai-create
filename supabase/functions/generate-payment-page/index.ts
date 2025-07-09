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
    const prompt = `You are a top-tier creative web designer and copywriter specialising in social-media-ready landing pages.

Your task:
Generate a visually stunning, mobile-first, SEO-optimized HTML+CSS landing page styled for Vivid Money users, for the following offer:

- Product/service name: ${productName}
- Description: ${description || 'Premium product'}
- Price: $${price}
- Availability: ${availability || 'Available now'}
- Brand color: ${brandColor}
- Images: ${imageList}

**Requirements:**
- Divide the landing page into exactly same number as the number of images of separate "frames" or "slides" as if for an Instagram carousel. 
- Each frame/slide must prominently feature **one photo** (from imageUrls) in a unique, creative way (use different shapes: one circular, one with a blob mask, one with a rounded rectangle, etc.).
- Each slide should have a distinct focus, for example:
  1. **Slide 1:** Catchy, persuasive headline and hero image that creates instant desire. 
  2. **Slide 2:** Visual presentation of features, benefits, and what's included, with dynamic image placement and creative typography.
  3. **Slide 3:** Price, availability, a persuasive testimonial, and a subtle but clear "Pay Now" CTA.
- **Text must be highly persuasive, conversational, and energetic.** Use engaging microcopy and short, impactful sentences. Each sentence should go to new line.
- Layout should be visually dynamic, using Vivid Money's primary (#6A57FF) and secondary (#00DAB5) colors, lots of white space, and modern, soft card-style backgrounds.
- Integrate the Vivid Money logo in the sticky footer with "Powered by Vivid Money."
- Highlight the price and offer in an attractive but non-pushy manner.
- All design must be "Instagram-shareable" — each slide looks great on its own, with well-balanced visuals and text.
- draw inspiration from top Instagram carousel templates
- The "Pay Now" button should be present but not overpowering (use as a stylish element).
- Responsive/mobile friendly, use modern CSS (grid, flex, media queries).
- Add SEO meta tags (title, description, OG, Twitter card, product schema).
- Output only a single, valid HTML file with embedded CSS.

**Special Instructions:**
- Make sure each of the slides/frames uses a different photo from the list, with no photo repeated.
- Do NOT place all photos on a single frame.
- Make the copy fun, memorable, and tailored for a social-media audience.
- All text must be in English.

Return ONLY the full HTML file with embedded CSS (no extra text).`;

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