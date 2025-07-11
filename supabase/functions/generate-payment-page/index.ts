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
    const prompt = `You are an expert web developer creating a complete, professional HTML payment page. You MUST include ALL provided images.

CRITICAL REQUIREMENTS:
1. Use ALL provided image URLs in the HTML: ${imageList}
2. Create a complete, self-contained HTML file with embedded CSS
3. Make the page visually stunning and conversion-optimized
4. DO NOT include any icons or SVG elements

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

DESIGN REQUIREMENTS:
- Focus on clean, minimalist design without icons
- Use typography, spacing, and color to create visual hierarchy
- Rely on well-designed buttons, borders, and backgrounds for visual elements
- Use text-based indicators instead of icons (e.g., "✓" instead of check icons)

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
  - Clean, typography-focused design without icons.  
• Layout: 2-column grid on desktop, 1-col on mobile, 32px gutter.  
• Subtle entrance animations (fade-up, 200ms delay between cards).

4️⃣ Social Proof & Trust Builders  
• Three compelling testimonials styled as ${testimonialStyle} stories: realistic names, titles/roles relevant to ${targetAudience}, with detailed "before vs. after" narratives that mirror the customer journey (${customerJourney}).  
• Star rating display using text characters (★★★★★) with microdata (\`itemprop="reviewRating"\`) showing consistent 4.8-5.0 ratings.  
• "As featured in" bar: list 3 reputable outlets relevant to the target audience with text-based design.  
• Trust badge row: SSL-secure, money-back guarantee, free support using text-based badges and styling.

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
• Social follow links with descriptive text labels.  
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
• List any additional image assets you'd source (with alt-text and ideal specs).  
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
            content: 'You are an expert web developer specializing in high-converting payment pages. Create a complete, self-contained HTML file with embedded CSS. CRITICAL: You must use ALL provided image URLs and DO NOT include any icons or SVG elements. Focus on clean, typography-driven design.' 
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