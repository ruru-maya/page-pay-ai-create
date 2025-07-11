import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, ExternalLink, Smartphone, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentPagePreview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentPage, setPaymentPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const { toast } = useToast();

  const pageId = searchParams.get('id');

  useEffect(() => {
    if (!pageId) {
      navigate('/');
      return;
    }

    const fetchPaymentPage = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_pages')
          .select('*')
          .eq('id', pageId)
          .single();

        if (error) {
          throw error;
        }

        setPaymentPage(data);
      } catch (error) {
        console.error('Error fetching payment page:', error);
        toast({
          title: "Error",
          description: "Failed to load payment page",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentPage();
  }, [pageId, navigate, toast]);

  const handleOpenInNewWindow = () => {
    if (!paymentPage?.generated_html) return;

    const newWindow = window.open('', '_blank', 'width=1200,height=800');
    if (newWindow) {
      newWindow.document.write(paymentPage.generated_html);
      newWindow.document.close();
      
      toast({
        title: "Opened Successfully!",
        description: "Your payment page has been opened in a new window"
      });
    } else {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site and try again",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment page...</p>
        </div>
      </div>
    );
  }

  if (!paymentPage) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Payment page not found</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Generator
            </Button>
            
            <Card className="bg-gradient-card border-0 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-2xl">Payment Page Preview</CardTitle>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleOpenInNewWindow}
                    className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Window
                  </Button>
                  
                  <div className="flex bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('desktop')}
                      className="px-3"
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      Desktop
                    </Button>
                    <Button
                      variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('mobile')}
                      className="px-3"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Mobile
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card className="bg-gradient-card border-0 shadow-elegant">
            <CardHeader>
              <CardTitle>Generated Payment Page: {paymentPage.product_name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {viewMode === 'desktop' ? 'Desktop View (1200px width)' : 'Mobile View (375px width)'}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center bg-secondary/20 rounded-lg p-4">
                <div 
                  className={`
                    transition-all duration-300 ease-in-out
                    ${viewMode === 'desktop' 
                      ? 'w-full max-w-[1200px]' 
                      : 'w-[375px]'
                    }
                  `}
                >
                  <iframe
                    srcDoc={paymentPage.generated_html}
                    className={`
                      w-full border-0 rounded shadow-lg
                      ${viewMode === 'desktop' ? 'h-[600px]' : 'h-[700px]'}
                    `}
                    title="Payment Page Preview"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}