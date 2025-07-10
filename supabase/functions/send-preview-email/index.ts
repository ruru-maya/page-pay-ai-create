import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get('RESEND_API_KEY');

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
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const { email, pageId, productName } = await req.json();

    if (!email || !pageId) {
      throw new Error('Email and page ID are required');
    }

    console.log('Sending preview link to:', email, 'for page:', pageId);

    // Create the preview link
    const previewLink = `${Deno.env.get('SUPABASE_URL')?.replace('ympfxxxhiippgtioozky.supabase.co', 'e4ca2914-4534-4623-ab77-9ba3b153f892.lovableproject.com') || 'https://e4ca2914-4534-4623-ab77-9ba3b153f892.lovableproject.com'}/preview?id=${pageId}`;

    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: "Payment Page Generator <onboarding@resend.dev>",
      to: [email],
      subject: `Your payment page for ${productName} is ready!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Your Payment Page Preview</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .header {
              background: linear-gradient(135deg, #6A57FF, #00DAB5);
              color: white;
              padding: 30px 20px;
              border-radius: 12px;
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              margin-bottom: 20px;
            }
            .preview-button {
              display: inline-block;
              background: linear-gradient(135deg, #6A57FF, #00DAB5);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
            }
            .link-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              word-break: break-all;
              font-family: monospace;
            }
            .footer {
              text-align: center;
              color: #64748b;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Your Payment Page is Ready!</h1>
            <p>Your "${productName}" payment page has been generated</p>
          </div>
          
          <div class="content">
            <h2>Hi there!</h2>
            <p>Your AI-generated payment page for <strong>${productName}</strong> has been created and is ready for preview.</p>
            
            <p><strong>What's included:</strong></p>
            <ul>
              <li>✅ Mobile-responsive design</li>
              <li>✅ SEO-optimized HTML</li>
              <li>✅ Modern, conversion-focused layout</li>
              <li>✅ Custom branding with your colors</li>
              <li>✅ Professional styling</li>
            </ul>

            <div style="text-align: center;">
              <a href="${previewLink}" class="preview-button">
                View Your Payment Page
              </a>
            </div>

            <p><strong>Direct Link:</strong></p>
            <div class="link-box">
              ${previewLink}
            </div>

            <p style="font-size: 14px; color: #666;">
              You can share this link with others or bookmark it for future access. The page will remain available at this URL.
            </p>
          </div>

          <div class="footer">
            <p>Generated by Payment Page Generator</p>
            <p>Need help? Contact our support team</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      messageId: emailResponse.data?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-preview-email function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});