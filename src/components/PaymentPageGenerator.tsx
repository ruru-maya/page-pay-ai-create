import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Sparkles, Eye, Palette, DollarSign, Package, Clock, ImageIcon, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormData {
  productName: string;
  description: string;
  price: string;
  currency: string;
  availability: string;
  brandColor: string;
  images: File[];
  // Storytelling fields
  targetAudience: string;
  problemItSolves: string;
  customerJourney: string;
  uniqueStory: string;
  testimonialStyle: string;
}

// EU currencies with their symbols and codes
const EU_CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
];

export default function PaymentPageGenerator() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    description: "",
    price: "",
    currency: "EUR",
    availability: "",
    brandColor: "#00C851",
    images: [],
    // Storytelling fields
    targetAudience: "",
    problemItSolves: "",
    customerJourney: "",
    uniqueStory: "",
    testimonialStyle: "success"
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [generatedPageId, setGeneratedPageId] = useState<string>("");
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, images: files }));
  };

  const uploadImages = async (): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    for (const file of formData.images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('payment-images')
        .upload(fileName, file);
      
      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload ${file.name}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-images')
        .getPublicUrl(fileName);
      
      imageUrls.push(publicUrl);
    }
    
    return imageUrls;
  };


  const handleGenerate = async () => {
    if (!formData.productName || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least product name and price",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (formData.images.length > 0) {
        toast({
          title: "Uploading Images...",
          description: `Uploading ${formData.images.length} image(s)`,
        });
        imageUrls = await uploadImages();
      }

      const { data, error } = await supabase.functions.invoke('generate-payment-page', {
        body: {
          productName: formData.productName,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          availability: formData.availability,
          brandColor: formData.brandColor,
          imageUrls: imageUrls,
          // Storytelling data
          targetAudience: formData.targetAudience,
          problemItSolves: formData.problemItSolves,
          customerJourney: formData.customerJourney,
          uniqueStory: formData.uniqueStory,
          testimonialStyle: formData.testimonialStyle,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate payment page');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate payment page');
      }
      
      // Save the generated page to database
      const { data: savedPage, error: saveError } = await supabase
        .from('payment_pages')
        .insert({
          product_name: formData.productName,
          description: formData.description,
          price: parseFloat(formData.price),
          availability: formData.availability,
          brand_color: formData.brandColor,
          generated_html: data.generatedHtml,
        })
        .select()
        .single();

      if (saveError) {
        throw new Error('Failed to save payment page');
      }

      setGeneratedPageId(savedPage.id);
      setStep(3);
      
      toast({
        title: "Payment Page Generated!",
        description: "Your AI-powered payment page is ready for preview"
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
    setIsGenerating(false);
  };


  const handleSendEmail = async () => {
    if (!userEmail || !generatedPageId) return;

    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-preview-email', {
        body: {
          email: userEmail,
          pageId: generatedPageId,
          productName: formData.productName,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send email');
      }

      setEmailSent(true);
      toast({
        title: "Preview sent!",
        description: "Check your inbox for the payment page preview link."
      });
    } catch (error) {
      console.error('Email send error:', error);
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
    setIsSendingEmail(false);
  };


  const renderStep1 = () => (
    <Card className="bg-gradient-card border-0 shadow-elegant">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <Package className="w-6 h-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Product Information</CardTitle>
        <CardDescription>Tell us about your product or service</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="productName">Product/Service Name *</Label>
          <Input
            id="productName"
            placeholder="Premium Web Design Course"
            value={formData.productName}
            onChange={(e) => handleInputChange("productName", e.target.value)}
            className="bg-secondary/50 border-border"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Basic Description</Label>
          <Textarea
            id="description"
            placeholder="Complete course with 50+ lessons, downloadable resources, lifetime access..."
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="bg-secondary/50 border-border min-h-[80px]"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Storytelling Enhancement</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                placeholder="Busy entrepreneurs, creative professionals..."
                value={formData.targetAudience}
                onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="problemItSolves">Problem It Solves</Label>
              <Input
                id="problemItSolves"
                placeholder="Lack of time to learn web design properly..."
                value={formData.problemItSolves}
                onChange={(e) => handleInputChange("problemItSolves", e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerJourney">Customer Success Journey</Label>
            <Textarea
              id="customerJourney"
              placeholder="From struggling with DIY websites to creating professional designs in weeks..."
              value={formData.customerJourney}
              onChange={(e) => handleInputChange("customerJourney", e.target.value)}
              className="bg-secondary/50 border-border min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uniqueStory">Unique Story/Origin</Label>
            <Textarea
              id="uniqueStory"
              placeholder="Created by industry veterans after 10 years of teaching Fortune 500 companies..."
              value={formData.uniqueStory}
              onChange={(e) => handleInputChange("uniqueStory", e.target.value)}
              className="bg-secondary/50 border-border min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testimonialStyle">Testimonial Style</Label>
            <Select
              value={formData.testimonialStyle}
              onValueChange={(value) => handleInputChange("testimonialStyle", value)}
            >
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="success">Success Stories</SelectItem>
                <SelectItem value="transformation">Before/After Transformation</SelectItem>
                <SelectItem value="emotional">Emotional Journey</SelectItem>
                <SelectItem value="professional">Professional Achievement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="price"
                type="number"
                placeholder="99"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleInputChange("currency", value)}
            >
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {EU_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="availability"
                placeholder="Limited time offer"
                value={formData.availability}
                onChange={(e) => handleInputChange("availability", e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={() => setStep(2)} 
          className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          disabled={!formData.productName || !formData.price}
        >
          Continue to Branding & Assets
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="bg-gradient-card border-0 shadow-elegant">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <Palette className="w-6 h-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Branding & Assets</CardTitle>
        <CardDescription>Customize the look and feel of your payment page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="brandColor">Brand Color</Label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              id="brandColor"
              value={formData.brandColor}
              onChange={(e) => handleInputChange("brandColor", e.target.value)}
              className="w-12 h-12 rounded-lg border border-border cursor-pointer"
            />
            <Input
              value={formData.brandColor}
              onChange={(e) => handleInputChange("brandColor", e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="images">Product Images (optional)</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <Upload className="mx-auto w-8 h-8 text-muted-foreground mb-2" />
            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label
              htmlFor="images"
              className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
            >
              Click to upload images or drag and drop
            </label>
            {formData.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.images.map((file, index) => (
                  <Badge key={index} variant="secondary">
                    {file.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setStep(1)}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Payment Page
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-0 shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
            <Eye className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Preview & Share</CardTitle>
          <CardDescription>Your AI-generated payment page is ready!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-6">
            <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
              Edit Details
            </Button>
            <Button 
              onClick={() => navigate(`/preview?id=${generatedPageId}`)}
              className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Preview
            </Button>
            <Button onClick={() => setStep(4)} className="flex-1 bg-accent hover:bg-accent/90 transition-all duration-300">
              <Mail className="w-4 h-4 mr-2" />
              Share via Email
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-0 shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your payment page for <strong>{formData.productName}</strong> has been generated successfully!
            </p>
            <p className="text-sm text-muted-foreground">
              Click "View Preview" to see your page in full screen or "Share via Email" to send the link to someone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );


  const renderStep4 = () => (
    <Card className="bg-gradient-card border-0 shadow-elegant">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Share Your Preview</CardTitle>
        <CardDescription>
          {emailSent 
            ? "Preview link sent successfully!" 
            : "Enter an email to share your payment page preview link."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!emailSent ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep(3)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleSendEmail}
                disabled={!userEmail || isSendingEmail}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                {isSendingEmail ? (
                  <>
                    <Mail className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Preview Link
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-muted-foreground">
              Check your inbox at <strong>{userEmail}</strong>
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEmailSent(false);
                  setUserEmail('');
                  setStep(1);
                }}
                className="flex-1"
              >
                Create Another
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            AI Payment Page Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create beautiful, conversion-optimized payment pages in seconds
          </p>
          
          <div className="flex justify-center items-center gap-4 mt-6">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step >= stepNum 
                    ? "bg-gradient-primary text-primary-foreground shadow-glow" 
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && <Separator className="w-12 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
}