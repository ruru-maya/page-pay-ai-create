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
    const { 
      productName, description, price, currency, availability, brandColor, imageUrls = [], 
      targetAudience, problemItSolves, customerJourney, uniqueStory, testimonialStyle 
    } = await req.json();

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
    const prompt = `You are an expert web developer creating a complete, professional HTML payment page. You MUST include ALL provided images and use the provided icon library for all icons.

CRITICAL REQUIREMENTS:
1. Use ALL provided image URLs in the HTML: ${imageList}
2. Use ONLY the SVG icons from the provided icon library below
3. Create a complete, self-contained HTML file with embedded CSS
4. Make the page visually stunning and conversion-optimized

PRODUCT DETAILS:
• Product: ${productName}
• Description: ${description || 'Premium product'}
• Price: ${price} ${currency || 'USD'}
• Availability: ${availability || 'Available now'}
• Brand Color: ${brandColor}

STORYTELLING CONTEXT:
• Target Audience: ${targetAudience || 'General consumers looking for quality solutions'}
• Problem It Solves: ${problemItSolves || 'Common challenges faced by the target audience'}
• Customer Journey: ${customerJourney || 'Transformation from problem to success'}
• Unique Story: ${uniqueStory || 'Innovative approach developed through expertise'}
• Testimonial Style: ${testimonialStyle || 'success'}

${imageInstructions}

MANDATORY IMAGE INTEGRATION:
- Use the first image as the hero/main product image with proper alt text
- Include ALL other images in product gallery, features, or testimonials
- Ensure images are properly sized and responsive
- Add loading="lazy" to all images except the hero image

ICON LIBRARY - USE THESE EXACT SVG PATHS:

<!-- Star Icon (for ratings, premium features) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>

<!-- Shield Icon (for security, trust, protection) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
</svg>

<!-- Check/Checkmark Icon (for features, benefits, completed items) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
</svg>

<!-- Heart Icon (for favorites, love, testimonials) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</svg>

<!-- Lightning/Bolt Icon (for speed, power, energy) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M7 2v11h3v9l7-12h-4l3-8z"/>
</svg>

<!-- User Icon (for testimonials, profiles, accounts) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
</svg>

<!-- Crown Icon (for premium, VIP, exclusive) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M5 16L3 14l5.5-4.5L12 13l3.5-3.5L21 14l-2 2H5zm2.5-10C7.5 4.34 8.84 3 10.5 3S13.5 4.34 13.5 6 12.16 9 10.5 9 7.5 7.66 7.5 6zm9 0C16.5 4.34 17.84 3 19.5 3S22.5 4.34 22.5 6 21.16 9 19.5 9 16.5 7.66 16.5 6zM12 4.5C12 3.12 13.12 2 14.5 2S17 3.12 17 4.5 15.88 7 14.5 7 12 5.88 12 4.5z"/>
</svg>

<!-- Gift Icon (for bonuses, offers, free items) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v4h2v8c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2v-8h2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
</svg>

<!-- Clock Icon (for time-limited offers, delivery time) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
</svg>

<!-- Dollar Sign Icon (for pricing, money, value) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
</svg>

<!-- Truck Icon (for delivery, shipping) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
</svg>

<!-- Lock Icon (for security, private, secure) -->
<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
</svg>

ICON USAGE INSTRUCTIONS:
1. Copy the exact SVG code from above - do NOT modify the paths
2. Apply your brand color using fill="currentColor" and set the text color in CSS
3. Adjust size using width and height classes (w-4 h-4, w-6 h-6, w-8 h-8, etc.)
4. Use contextually appropriate icons:
   - Star: for ratings, premium features, highlights
   - Shield: for security guarantees, protection, trust badges
   - Check: for feature lists, benefits, included items
   - Heart: for customer love, testimonials, favorites
   - Lightning: for speed, instant delivery, power
   - User: for testimonials, customer stories, accounts
   - Crown: for premium plans, VIP features, exclusive offers
   - Gift: for bonuses, free items, special offers
   - Clock: for time-limited offers, quick delivery
   - Dollar: for pricing, value propositions, money-back
   - Truck: for shipping, delivery, logistics
   - Lock: for security, privacy, exclusive access

MANDATORY ICON INTEGRATION:
- Use at least 5-8 different icons throughout the page
- Style all icons with your brand color
- Ensure icons enhance the message and aren't just decorative
- Add proper aria-labels for accessibility

--- Deliverables ---

1️⃣ Meta & Header  
• SEO-optimized \`<title>\` and \`<meta name="description">\` (≤ 160 chars) that weave in top keyword ideas drawn from the description.  
• Open Graph (\`og:*\`) and Twitter Card tags with optimized titles, descriptions, and your image URL.  
• A simple JSON-LD schema snippet (\`Product\`, \`Offer\`) referencing the product name, price, availability, and image.

2️⃣ Hero Section  
• Headline (H1) that directly addresses the target audience (${targetAudience}) and their core pain point (${problemItSolves}), featuring a compelling "hero narrative" that immediately resonates.  
• Subheadline (H2) with a story arc: Problem (${problemItSolves}) → Transformation (${customerJourney}) → Unique Solution (${uniqueStory}).  
• Full-bleed hero image using the provided image: include ideal aspect ratio, suggested \`srcset\` for retina and mobile, and lazy-load attributes.  
• Primary CTA button text that reflects the customer journey (e.g. "Start My Transformation," "Begin My Success Story") with micro-copy beneath that builds trust. Style rules:  
  - Background: ${brandColor};  
  - Font-size: 1.25rem;  
  - Padding: 0.75rem 1.5rem;  
  - Border-radius: 8px;  
  - Hover: 10% darker shade;  
  - Focus: outline with 3px solid high-contrast.

3️⃣ Story-Driven Features & Benefits  
• Three to six "feature cards" that follow the customer journey (${customerJourney}), each with:  
  - A 1-sentence "transformation moment" story that shows how this feature solves part of the main problem (${problemItSolves});  
  - Benefit-focused headline that speaks to the target audience (${targetAudience});  
  - Two-line body copy that continues the narrative arc;  
  - Contextually appropriate icon from the provided SVG library.  
• Layout: 2-column grid on desktop, 1-col on mobile, 32px gutter.  
• Subtle entrance animations (fade-up, 200ms delay between cards).

4️⃣ Social Proof & Trust Builders  
• Three compelling testimonials styled as ${testimonialStyle} stories: realistic names, titles/roles relevant to ${targetAudience}, with detailed "before vs. after" narratives that mirror the customer journey (${customerJourney}).  
• Star rating component (5-star SVG) with microdata (\`itemprop="reviewRating"\`) showing consistent 4.8-5.0 ratings.  
• "As featured in" bar: list 3 reputable outlets relevant to the target audience with placeholder logos + descriptive alt text.  
• Trust badge row: SSL-secure, money-back guarantee, free support icons using the provided SVG library.

5️⃣ Pricing & Packages  
• Clear, responsive pricing section that references the unique story (${uniqueStory}) and value proposition.  
• Use the price (${price} ${currency}) in a prominent font (2rem) with context about the transformation value.  
• Bulleted "What's included" list—tie each bullet back to solving the core problem (${problemItSolves}) and the customer journey.  
• Secondary CTA ("Choose Plan") styled in the brand color with micro-copy that continues the story narrative.  
• Section header with a mini-story about how customers like the target audience (${targetAudience}) achieved success.

6️⃣ Urgency & Scarcity  
• Line of dynamic text for availability ("Only X spots left!").  
• Countdown timer snippet (JS pseudo-code) set to a realistic deadline (e.g. 72 hours from page load).  
• Suggest an exit-intent popup with last-chance offer (10% off coupon).

7️⃣ FAQ & Objection Handling  
• Five FAQ items that address concerns specific to the target audience (${targetAudience}) and reinforce the story elements about solving their problem (${problemItSolves}).  
• Accordion markup (\`<details>\`/\`<summary>\`) with ARIA attributes for screen readers.  
• Each answer should reference elements from the unique story (${uniqueStory}) and customer journey (${customerJourney}).

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
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert web developer specializing in high-converting payment pages. Create a complete, self-contained HTML file with embedded CSS and inline SVG icons. CRITICAL: You must use ALL provided image URLs and embed all icons as SVG elements directly in the HTML. Do not reference external icon libraries.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 8000,
        temperature: 0.3,
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