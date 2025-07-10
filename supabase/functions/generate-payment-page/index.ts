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
    const { productName, description, price, availability, brandColor, imageUrls = [], logoUrl, logoPosition } = await req.json();

    console.log('Generating payment page for:', productName);

    // Create image list for prompt
    const imageList = imageUrls.length > 0 
      ? imageUrls.map((url, index) => `Image ${index + 1}: ${url}`).join('\n- ')
      : 'no images provided';
    
    // Create logo info for prompt
    const logoInfo = logoUrl ? `Logo URL: ${logoUrl}\nLogo Position: ${logoPosition || 'top-center'}` : 'no logo provided';

    // Create OpenAI prompt for generating payment page HTML
    const prompt = `## **Phased Instructions for AI Landing Page Generation**

### **Phase 1: Initial Page Setup & Branding**

**Step 1.**
Set up a complete HTML5 landing page with embedded CSS (no external assets or JS).
Use mobile-first, responsive layout principles.

**Step 2.**
Apply Vivid Money branding throughout:

* Primary color: \`#6A57FF\` (purple)
* Secondary color: \`#00DAB5\` (turquoise)
* Modern, clean sans-serif font (Inter, Montserrat, or similar)
* Predominantly white background, with color highlights, gradients, and accents
* Official Vivid Money logo ([https://brand.vivid.money/logo/logo-icon.svg](https://brand.vivid.money/logo/logo-icon.svg)) in a sticky footer at the bottom with:
  \`"Powered by Vivid Money"\`

### **Phase 2: Visual Structure & Layout (Landing Page)**

You are an elite web designer and conversion copywriter.

Your task:
Generate a modern, visually stunning, mobile-first HTML landing page with embedded CSS.
The page must feature compelling, SEO-optimized, persuasive copy, and a scroll-friendly, highly engaging layout.
Inputs:

Product/Service Name: {productName}

Description: {description}

Price: {price}

Availability: {availability}

Brand Color: {brandColor} (hex or css color)

Image: {image} (public URL)

Instructions and Requirements:

1. Visual Design & Branding
Use a clean, modern design with plenty of white space and brand color ({brandColor}) for highlights, buttons, and accents.

Choose a contemporary, sans-serif font (Inter, Montserrat, or similar).

The layout must be mobile-friendly, fully responsive, and look great on all devices.

Add a visually prominent hero section at the top, using the provided image ({image}) in a creative way (e.g., masked shape, circle, or overlay).

Use soft shadows, rounded corners, and subtle gradients to give the page depth and energy.

If possible, include the brand color as a gradient or background accent.

2. Copywriting & Sections — Enhanced for Engagement and Persuasion
Headline (H1):
Write a bold, emotionally charged, eye-catching headline that includes {productName}.
The headline should speak directly to the audience’s desires or pain points, promising a benefit or solution that’s impossible to ignore.

Subheadline / Summary:
Immediately below the headline, add a longer, highly persuasive subheadline or summary (at least 2–3 sentences) using and expanding on {description}.
This summary should:

Clearly state who the offer is for and why it’s unique.

Highlight how it can transform, improve, or delight the customer’s life.

Spark curiosity or excitement, using energetic and relatable language.

Benefits & What’s Included:
Create a prominent, detailed section listing the main benefits, features, and everything that’s included.
Use bullet points, icons, or visually separated blocks for clarity.
For each benefit or feature:

Write a 1–2 sentence description emphasizing why it matters and how it helps the customer.

Use lively, conversational copy that feels personal and encouraging.

Go beyond basics—paint a picture of the positive impact and emotional reward.

Price & Availability:
Clearly present the price and availability (e.g., “Only 5 left!” or “Special price until {date}”), using friendly, attractive styling.
Instead of just stating numbers, explain the value—why this offer is worth the investment, how much customers save, or what they risk missing if they wait.
Frame the pricing in a positive, inviting tone.

Call to Action (CTA):
Place a strong, clear call-to-action button (e.g., “Pay Now”, “Get Started”, or “Secure My Spot”) styled in {brandColor}.
Above or below the button, add a persuasive line or microcopy explaining what happens next (e.g., “Checkout is 100% secure and only takes a minute!” or “Don’t miss out—secure your offer today!”).
The button should be highly visible but harmoniously blended into the overall design, avoiding aggressive or pushy tactics.

Social Proof / Testimonial (“Why buy now?”):
Add a compelling, authentic-sounding testimonial from a happy customer, or a “Why buy now?” section.
This should use narrative, storytelling copy (2–3 sentences), focusing on the relief, excitement, or results experienced.
Optionally, highlight urgency or FOMO (“I almost missed out, but I’m so glad I grabbed this when I did!”).

Footer for Brand Confidence:
Finish the page with a visually distinct footer.
Reassure visitors about the brand’s reliability, support, and quality—e.g., “Trusted by thousands of satisfied customers,” or “Questions? Our friendly team is here to help.”
Keep the tone warm, professional, and confidence-inspiring.

General copywriting rules:
Make every section engaging, energetic, and customer-focused.
Use more words and storytelling to create an emotional connection and answer objections before they arise.
Write as if speaking directly to one person, using “you” language and inviting action.

3. Image Use
Use the input image ({image}) creatively—display it in a main hero section and/or again in a secondary, dynamic layout (e.g., as a circular photo, blob shape, or as part of a card).

Make sure the image is displayed at high quality and is responsive.

4. SEO & Technical
Add full SEO meta tags:

Title (with {productName})

Description (from {description}, improved for SEO)

Open Graph & Twitter card tags (for sharing)

Product structured data (JSON-LD)

Embed all CSS within a <style> tag—do not use any external CSS or JS.

The HTML should be 100% valid and ready to use as a standalone landing page.

All text must be in English.

5. Output Instructions
Output ONLY the complete HTML file with all embedded CSS (no explanations or extra commentary).

All copy should be persuasive, positive, and focused on driving conversions.

INPUTS:

Product/Service Name: {productName}

Description: {description}

Price: {price}

Availability: {availability}

Brand Color: {brandColor}




### **INPUTS TO USE**

* Product/service name: \`${productName}\`
* Description: \`${description || 'Premium product'}\`
* Price: \`$${price}\`
* Availability: \`${availability || 'Available now'}\`
* Brand color: \`${brandColor}\`
* Images: \`${imageList}\`
* Business Logo: \`${logoInfo}\`

---

**Special Instructions:**
- If a business logo is provided, place it in the specified position using CSS positioning:
  - top-left: position absolute, top-4, left-4
  - top-center: position absolute, top-4, left-1/2, transform -translate-x-1/2
  - top-right: position absolute, top-4, right-4
  - bottom-left: position absolute, bottom-4, left-4
  - bottom-center: position absolute, bottom-4, left-1/2, transform -translate-x-1/2
  - bottom-right: position absolute, bottom-4, right-4
  The logo should be styled with max-width: 120px, height: auto, and z-index: 10.

Return ONLY the complete HTML (for preview in a new browser window).`;

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