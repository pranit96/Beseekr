import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeckUploadZone } from '@/components/DeckUploadZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sidebar } from '@/components/Sidebar';
import { GlobalHeader } from '@/components/GlobalHeader';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2, Clock, FileSpreadsheet, Info } from 'lucide-react';
import { IndustryType, StageType } from '@/types/deck-to-model';
import { DeckOrdersSidebar } from '@/components/DeckOrdersSidebar';

// UI labels (matches your StageType/IndustryType)
const INDUSTRIES: IndustryType[] = ['SaaS', 'FinTech', 'E-commerce', 'Healthcare', 'Other'];
const STAGES: StageType[] = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Other'];

// Map UI labels → API values (must match backend validation)
const STAGE_UI_TO_API: Record<StageType, string> = {
  'Pre-seed': 'pre-seed',
  'Seed': 'seed',
  'Series A': 'series-a',
  'Series B': 'series-b',
  'Series C': 'series-c',
  'Growth': 'growth',
  'Other': 'other',
};

const INDUSTRY_UI_TO_API: Record<IndustryType, string> = {
  'SaaS': 'saas',
  'FinTech': 'fintech',
  'E-commerce': 'e-commerce',
  'Healthcare': 'healthcare',
  'Other': 'other',
};

export default function DeckUpload() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState<IndustryType | ''>('');
  const [otherIndustry, setOtherIndustry] = useState('');
  const [stage, setStage] = useState<StageType | ''>('');
  const [otherStage, setOtherStage] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      if (companyName.trim()) {
        formData.append('company_name', companyName.trim());
      }

      // --- Industry ---
      let finalIndustry = '';
      if (industry === 'Other' && otherIndustry.trim()) {
        finalIndustry = otherIndustry.trim();
      } else if (industry && industry !== 'Other') {
        finalIndustry = INDUSTRY_UI_TO_API[industry];
      }
      if (finalIndustry) {
        formData.append('industry', finalIndustry);
      }

      // --- Stage ---
      let finalStage = '';
      if (stage === 'Other' && otherStage.trim()) {
        finalStage = otherStage.trim();
      } else if (stage && stage !== 'Other') {
        finalStage = STAGE_UI_TO_API[stage];
      }
      if (finalStage) {
        formData.append('stage', finalStage);
      }

      if (notes.trim()) {
        formData.append('additional_notes', notes.trim());
      }

      const response = await apiClient.uploadDeck(formData);

      if (response.success) {
        setUploadSuccess(true);
        setOrderId(response.data.orderId);
        toast.success('Deck uploaded successfully!', {
          description: 'Your financial model is being generated'
        });
      }
    } catch (error: any) {
      toast.error('Upload failed', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAnother = () => {
    setSelectedFile(null);
    setCompanyName('');
    setIndustry('');
    setOtherIndustry('');
    setStage('');
    setOtherStage('');
    setNotes('');
    setUploadSuccess(false);
    setOrderId(null);
  };

  if (uploadSuccess && orderId) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <GlobalHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <CardTitle className="text-2xl">Upload Successful!</CardTitle>
                  </div>
                  <CardDescription>
                    Your pitch deck has been uploaded and is being processed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-background rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-mono">{orderId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Time:</span>
                      <span className="font-medium">3–5 minutes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-blue-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Processing
                      </span>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You can close this page and come back later. We'll notify you when your model is ready.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    <Button onClick={() => navigate(`/deck-to-model/orders/${orderId}`)} className="flex-1">
                      View Order Details
                    </Button>
                    <Button onClick={() => navigate('/deck-to-model/orders')} variant="outline" className="flex-1">
                      View All Orders
                    </Button>
                  </div>

                  <Button onClick={handleUploadAnother} variant="ghost" className="w-full">
                    Upload Another Deck
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <GlobalHeader />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold">Upload Pitch Deck</h1>
                <p className="text-muted-foreground mt-2">
                  Transform your pitch deck into a professional 3-statement financial model
                </p>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card className="border border-border/50 hover:border-border transition">
                  <CardContent className="pt-6">
                    <Clock className="h-7 w-7 text-blue-500 mb-2" />
                    <h3 className="font-semibold mb-1">Fast Processing</h3>
                    <p className="text-sm text-muted-foreground">Get your model in 3–5 minutes</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/50 hover:border-border transition">
                  <CardContent className="pt-6">
                    <FileSpreadsheet className="h-7 w-7 text-green-500 mb-2" />
                    <h3 className="font-semibold mb-1">Complete Model</h3>
                    <p className="text-sm text-muted-foreground">5 worksheets with full projections</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/50 hover:border-border transition">
                  <CardContent className="pt-6">
                    <CheckCircle2 className="h-7 w-7 text-purple-500 mb-2" />
                    <h3 className="font-semibold mb-1">7-Day Access</h3>
                    <p className="text-sm text-muted-foreground">Download anytime within 7 days</p>
                  </CardContent>
                </Card>
              </div>

              {/* Upload Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your Deck</CardTitle>
                  <CardDescription>
                    Upload your pitch deck and provide optional details to enhance the model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Upload */}
                  <DeckUploadZone
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    onClearFile={handleClearFile}
                    disabled={isUploading}
                  />

                  {/* Optional Fields */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name (Optional)</Label>
                      <Input
                        id="company-name"
                        placeholder="e.g., Acme Inc"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={isUploading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Industry */}
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry (Optional)</Label>
                        <Select
                          value={industry}
                          onValueChange={(value) => setIndustry(value as IndustryType)}
                          disabled={isUploading}
                        >
                          <SelectTrigger id="industry">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRIES.map((ind) => (
                              <SelectItem key={ind} value={ind}>
                                {ind}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {industry === 'Other' && (
                          <Input
                            className="mt-2"
                            placeholder="Specify your industry"
                            value={otherIndustry}
                            onChange={(e) => setOtherIndustry(e.target.value)}
                            disabled={isUploading}
                          />
                        )}
                      </div>

                      {/* Stage */}
                      <div className="space-y-2">
                        <Label htmlFor="stage">Stage (Optional)</Label>
                        <Select
                          value={stage}
                          onValueChange={(value) => setStage(value as StageType)}
                          disabled={isUploading}
                        >
                          <SelectTrigger id="stage">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((stg) => (
                              <SelectItem key={stg} value={stg}>
                                {stg}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {stage === 'Other' && (
                          <Input
                            className="mt-2"
                            placeholder="Specify your funding stage"
                            value={otherStage}
                            onChange={(e) => setOtherStage(e.target.value)}
                            disabled={isUploading}
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any specific requirements or context for the model..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={isUploading}
                        maxLength={1000}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground text-right">{notes.length}/1000 characters</p>
                    </div>
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="w-full"
                    size="lg"
                  >
                    {isUploading ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload & Generate Model'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* What You'll Get */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What You'll Get</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {[
                      { label: 'Summary Sheet', desc: 'Key metrics and financial overview' },
                      { label: 'Income Statement', desc: '5-year P&L projections' },
                      { label: 'Balance Sheet', desc: 'Assets, liabilities, and equity' },
                      { label: 'Cash Flow', desc: 'Operating, investing, and financing activities' },
                      { label: 'Assumptions', desc: 'Model assumptions with 3 scenarios' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>{item.label}:</strong> {item.desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </main>

          {/* Recent Orders Sidebar */}
          <aside className="w-80 border-l border-border p-6 overflow-y-auto bg-muted/10">
            <DeckOrdersSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}