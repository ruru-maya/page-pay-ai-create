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

---

### **Phase 1: Initial Page Setup & Branding**

**Step 1.**
Set up a complete HTML5 landing page with embedded CSS (no external assets or JS).
Use mobile-first, responsive layout principles.

**Step 2.**
Apply Vivid Money branding throughout:

* Primary color: \`#6A57FF\` (purple)
* Secondary color: \`#00DAB5\` (turquoise)
* Modern, clean sans-serif font (Inter, Montserrat, or similar)
* Predominantly white background, color highlights, and accents
* Official Vivid Money logo ([https://brand.vivid.money/logo/logo-icon.svg](https://brand.vivid.money/logo/logo-icon.svg)) in a sticky footer at the bottom with:
  \`"Powered by Vivid Money"\`

---

### **Phase 2: Visual Structure & Layout (Carousel Concept)**

**Step 3.**
Divide the landing page into **exactly 3 visually distinct "frames" or "slides"**, each designed to work as a shareable Instagram carousel slide or a unified responsive web landing page.
Each frame should be styled as a modern card/section, with ample white space, soft shadows, and rounded corners.

**Step 4.**
For each slide:

* **Frame 1: Hero & Headline**

  * Use the first image from \`{imageUrls}\` as a hero image, creatively shaped (circle, blob, or other dynamic mask).
  * Write a bold, persuasive headline (H1) to spark instant desire for the offer.
  * Add a supporting subheadline or microcopy.
* **Frame 2: Features & Benefits**

  * Use the second image, styled in a different shape (rounded rectangle, slanted mask, or overlay).
  * Present the product/service features, benefits, and inclusions using creative layout—icons, split text, columns, etc.
  * Copy should be energetic, social-friendly, and benefit-focused.
* **Frame 3: Social Proof, Price, and CTA**

  * Use the third image, uniquely styled (e.g., rotated, masked, or with testimonial overlay).
  * Display the price and availability attractively, not aggressively.
  * Add at least one persuasive testimonial in a styled speech bubble or card.
  * Place a **"Pay Now"** CTA button, matching Vivid Money's palette, elegant but not overwhelming.

**Step 5.**
Each slide must feature **only one unique photo** from the \`{imageUrls}\` (no repeats, no combining).

---

### **Phase 3: Persuasive Copywriting & Social-Ready Design**

**Step 6.**

* All copy must be highly persuasive, fun, energetic, and conversational—short impactful sentences and microcopy for social media.
* Every slide should be designed to look great as a standalone Instagram carousel image or as part of the full landing page.

**Step 7.**

* Use modern typography, color contrast, and harmonious layouts (no clutter, no overwhelming elements).

---

### **Phase 4: Technical & Presentation Requirements**

**Step 8.**

* Add standard SEO meta tags: title, meta description, Open Graph, Twitter card, and product structured data.
* Ensure the page is fully responsive and mobile-first (flex, grid, media queries).
* Embed all CSS in the \`<style>\` tag inside the HTML file.

**Step 9.**

* Present the HTML so it can be rendered in a new browser window for user preview.
* Each frame must be individually exportable as an Instagram carousel image.
* No photo may appear in more than one frame.
* All content must be in English.
* The "Pay Now" button must be visually present but not overpowering.

---

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