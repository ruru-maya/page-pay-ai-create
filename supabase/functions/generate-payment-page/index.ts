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
    const { productName, description, price, currency, availability, brandColor, imageUrls = [], logoUrl, logoPosition } = await req.json();

    console.log('Generating payment page for:', productName);

    // Create image list for prompt
    const imageList = imageUrls.length > 0 
      ? imageUrls.map((url, index) => `Image ${index + 1}: ${url}`).join('\n- ')
      : 'no images provided';
    
    const imageInstructions = imageUrls.length > 0 
      ? `You MUST use ALL ${imageUrls.length} provided images throughout the payment page. Distribute them strategically:
- Use the first image as the main hero image
- Use additional images in the features section, testimonials, or product showcase
- Create an image gallery if multiple product images are provided
- Ensure every uploaded image is visible and adds value to the conversion story`
      : 'Use placeholder images or create a visually appealing page without images';
    
    // Create OpenAI prompt for generating payment page HTML
    const prompt = `You are an award-winning UX/UI designer, conversion copywriter, and front-end developer with deep SEO, accessibility (WCAG 2.1), and analytics expertise. Your mission is to transform minimal inputs into a full landing page blueprint that tells a rich brand story and maximizes sign-ups/sales.

--- Inputs (must use only these) ---
• Product/Service Name: ${productName}
• Description: ${description || 'Premium product'}
• Price: ${price} ${currency || 'USD'}
• Currency: ${currency || 'USD'}
• Availability: ${availability || 'Available now'}
• Brand Color: ${brandColor} (hex or CSS variable)
• Image URLs: ${imageList}

--- CRITICAL IMAGE USAGE REQUIREMENTS ---
${imageInstructions}

--- Deliverables ---

1️⃣ Meta & Header  
• SEO-optimized \`<title>\` and \`<meta name="description">\` (≤ 160 chars) that weave in top keyword ideas drawn from the description.  
• Open Graph (\`og:*\`) and Twitter Card tags with optimized titles, descriptions, and your image URL.  
• A simple JSON-LD schema snippet (\`Product\`, \`Offer\`) referencing the product name, price, availability, and image.

2️⃣ Hero Section  
• Headline (H1) that taps into your audience's core desire or pain, featuring a "hero narrative" (1–2 sentences) that sets the scene.  
• Subheadline (H2) with a mini-story arc (Problem → Epiphany → Solution).  
• Full-bleed hero image using the provided image: include ideal aspect ratio, suggested \`srcset\` for retina and mobile, and lazy-load attributes.  
• Primary CTA button text (e.g. "Start My Journey," "Claim Product Now") with micro-copy beneath (e.g. "No credit card required"). Style rules:  
  - Background: ${brandColor};  
  - Font-size: 1.25rem;  
  - Padding: 0.75rem 1.5rem;  
  - Border-radius: 8px;  
  - Hover: 10% darker shade;  
  - Focus: outline with 3px solid high-contrast.

3️⃣ Story-Driven Features & Benefits  
• Three to six "feature cards," each with:  
  - A 1-sentence "dramatic moment" story that shows transformation;  
  - Benefit-focused headline;  
  - Two-line body copy;  
  - Icon/image suggestion (120×120 px SVG or PNG).  
• Layout: 2-column grid on desktop, 1-col on mobile, 32px gutter.  
• Subtle entrance animations (fade-up, 200ms delay between cards).

4️⃣ Social Proof & Trust Builders  
• Three scroll-stopping testimonials: name, title/role, 2-sentence story of "before vs. after."  
• Star rating component (5-star SVG) with microdata (\`itemprop="reviewRating"\`).  
• "As featured in" bar: list 3 reputable outlets (use placeholder logos + real alt text).  
• Trust badge row: SSL-secure, money-back guarantee, free support icons.

5️⃣ Pricing & Packages  
• Clear, responsive pricing table: single offer or 2-tier split (e.g. Standard vs. Premium).  
• Use the price in a prominent font (2rem).  
• Bulleted "What's included" list—tie each bullet back to the core story.  
• Secondary CTA ("Choose Plan") styled in the brand color with subtle box-shadow.  
• Section header telling a micro-anecdote about how customers used their purchase.

6️⃣ Urgency & Scarcity  
• Line of dynamic text for availability ("Only X spots left!").  
• Countdown timer snippet (JS pseudo-code) set to a realistic deadline (e.g. 72 hours from page load).  
• Suggest an exit-intent popup with last-chance offer (10% off coupon).

7️⃣ FAQ & Objection Handling  
• Five FAQ items that neutralize top objections (price, ease of use, support, results, guarantees).  
• Accordion markup (\`<details>\`/\`<summary>\`) with ARIA attributes for screen readers.

8️⃣ Footer & Legal  
• Compact footer with links: Privacy Policy, Terms of Service, Returns, Contact.  
• Social follow icons with \`aria-label\`.  
• Small print about data privacy (GDPR, CCPA compliance).

9️⃣ Analytics & Optimization  
• Include snippet placement for Google Analytics (or GA4), Facebook Pixel, and a custom "conversion" event on CTA click.  
• JavaScript pseudo-code for A/B testing headline variants and recording metrics.  
• Performance tips: compress images, minify CSS/JS, preload key assets.

🔟 Responsive & Accessibility  
• Mobile first breakpoints: 320px, 480px, 768px, 1024px, 1280px.  
• Ensure 4.5:1 contrast ratio for text against backgrounds (check with brand color).  
• Include skip-nav link (\`<a href="#main-content">Skip to content</a>\`).  
• Use semantic HTML5: \`<header>\`, \`<main id="main-content">\`, \`<section>\`, \`<aside>\`, \`<footer>\`.  

--- Output Format ---  
• For each section, start with a 2–3 sentence rationale explaining how it drives conversions through storytelling, FOMO, social proof, or usability.  
• Supply ready-to-use HTML snippets (with placeholders replaced by your generated copy) and accompanying CSS rules (using the brand color).  
• Provide JSON-LD, microdata, and JS pseudo-code where specified.  
• List any additional image or icon assets you'd source (with alt-text and ideal specs).  
• Conclude with a brief launch checklist: SEO, performance, analytics, A/B test plan.

Return ONLY the complete HTML file with all embedded CSS (no explanations or extra commentary).`;

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