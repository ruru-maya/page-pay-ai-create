import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentPageRequest {
  productName: string;
  description?: string;
  price: string;
  availability?: string;
  brandColor: string;
  imageUrls?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, description, price, availability, brandColor, imageUrls }: PaymentPageRequest = await req.json();

    console.log('Generating payment page for:', productName);

    const prompt = `Create a modern, responsive HTML payment page for the following product:

Product Name: ${productName}
Description: ${description || 'No description provided'}
Price: $${price}
Availability: ${availability || 'Available now'}
Brand Color: ${brandColor}
${imageUrls && imageUrls.length > 0 ? `Images: ${imageUrls.join(', ')}` : 'No images provided'}

Requirements:
1. Create a complete HTML page with embedded CSS (no external stylesheets)
2. Use modern, clean design with the provided brand color as the primary color
3. Make it mobile-responsive using CSS Grid/Flexbox
4. Include a professional header with the product name
5. Display the product description prominently
6. Show the price clearly with a call-to-action button
7. If images are provided, display them in an attractive gallery
8. Include trust indicators and testimonial placeholders
9. Add a simple footer
10. Use the brand color for buttons, highlights, and accent elements
11. Ensure good contrast and readability
12. Add subtle animations and hover effects
13. Include meta tags for proper display

The page should be conversion-optimized and look professional. Return only the complete HTML code without any markdown formatting or explanations.`;

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
            content: 'You are an expert web developer and designer who creates high-converting payment pages. Always return complete, valid HTML with embedded CSS.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const generatedHtml = data.choices[0].message.content;

    console.log('Payment page generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      generatedHtml: generatedHtml 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-payment-page function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});