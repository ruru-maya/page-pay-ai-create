import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Sparkles, Eye, Download, Palette, DollarSign, Package, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  productName: string;
  description: string;
  price: string;
  availability: string;
  brandColor: string;
  images: File[];
}

export default function PaymentPageGenerator() {
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    description: "",
    price: "",
    availability: "",
    brandColor: "#00C851",
    images: []
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [step, setStep] = useState(1);
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
          availability: formData.availability,
          brandColor: formData.brandColor,
          imageUrls: imageUrls,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate payment page');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate payment page');
      }
      
      setGeneratedHtml(data.generatedHtml);
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

  const handleDeploy = () => {
    toast({
      title: "Deploying...",
      description: "Your payment page is being deployed as a payment link"
    });
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
          <Label htmlFor="description">Description/What's included</Label>
          <Textarea
            id="description"
            placeholder="Complete course with 50+ lessons, downloadable resources, lifetime access..."
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="bg-secondary/50 border-border min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          Continue to Branding
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
          <CardTitle className="text-2xl">Preview & Deploy</CardTitle>
          <CardDescription>Your AI-generated payment page is ready!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-6">
            <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
              Edit Details
            </Button>
            <Button onClick={handleDeploy} className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300">
              <Download className="w-4 h-4 mr-2" />
              Deploy Payment Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-0 shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Generated Payment Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-secondary/20 rounded-lg p-4 max-h-96 overflow-auto">
            <iframe
              srcDoc={generatedHtml}
              className="w-full h-96 border-0 rounded"
              title="Payment Page Preview"
            />
          </div>
        </CardContent>
      </Card>
    </div>
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
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step >= stepNum 
                    ? "bg-gradient-primary text-primary-foreground shadow-glow" 
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && <Separator className="w-12 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
}