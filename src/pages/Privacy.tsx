// src/pages/Privacy.tsx
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Shield, Eye, Lock, Server, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Link to="/dashboard/problems" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              beseekr
            </span>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your data on beseekr.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: December 8, 2024
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mb-12 sm:mb-16">
          <Card className="p-6 glass text-center">
            <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Secure Data</h3>
            <p className="text-sm text-muted-foreground">
              Your data is encrypted and protected
            </p>
          </Card>
          <Card className="p-6 glass text-center">
            <Eye className="w-10 h-10 text-accent mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Data Selling</h3>
            <p className="text-sm text-muted-foreground">
              We never sell your personal information
            </p>
          </Card>
          <Card className="p-6 glass text-center sm:col-span-2 md:col-span-1">
            <Users className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Your Control</h3>
            <p className="text-sm text-muted-foreground">
              Export or delete your data anytime
            </p>
          </Card>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Server className="w-6 h-6 text-primary" />
              What is beseekr?
            </h2>
            <Card className="p-6 glass">
              <p className="text-muted-foreground">
                beseekr is a SaaS platform that helps entrepreneurs and product builders discover real-world problems worth solving. Our platform aggregates and analyzes discussions from various online communities to identify business opportunities, pain points, and unmet needs. Users can browse problems, validate their ideas, and track opportunities using our research tools.
              </p>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Server className="w-6 h-6 text-primary" />
              Information We Collect
            </h2>
            <Card className="p-6 glass mb-6">
              <h3 className="text-lg font-semibold mb-3">Account Information</h3>
              <p className="text-muted-foreground mb-4">
                When you create an account, we collect:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Your name and email address</li>
                <li>• Password (encrypted and never stored in plain text)</li>
                <li>• Account preferences and settings</li>
              </ul>
            </Card>

            <Card className="p-6 glass mb-6">
              <h3 className="text-lg font-semibold mb-3">Usage Data</h3>
              <p className="text-muted-foreground mb-4">
                To improve our services, we collect:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Problems you view and save to your watchlist</li>
                <li>• Idea validation reports you generate</li>
                <li>• Feature usage patterns and preferences</li>
                <li>• Device and browser information</li>
              </ul>
            </Card>

            <Card className="p-6 glass">
              <h3 className="text-lg font-semibold mb-3">Research & Validation Data</h3>
              <p className="text-muted-foreground mb-4">
                When you use our research features:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Ideas submitted for validation are stored securely</li>
                <li>• Validation reports are tied to your account</li>
                <li>• Research history is retained for your reference</li>
              </ul>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              How We Use Your Information
            </h2>
            <Card className="p-6 glass">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Provide Services:</strong> We use your information to deliver problem discovery, idea validation, and research features.
                </p>
                <p>
                  <strong className="text-foreground">Personalization:</strong> We personalize your experience by remembering your preferences, watchlist, and research history.
                </p>
                <p>
                  <strong className="text-foreground">Communication:</strong> We may send you service updates, new problem alerts (if opted in), and account-related notifications.
                </p>
                <p>
                  <strong className="text-foreground">Analytics:</strong> We analyze usage patterns to improve features, fix bugs, and optimize performance. All analytics data is aggregated and anonymized.
                </p>
              </div>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-primary" />
              Payment Information
            </h2>
            <Card className="p-6 glass">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Payment Processing:</strong> We use Razorpay to process payments. We do not store your full credit card details on our servers.
                </p>
                <p>
                  <strong className="text-foreground">Subscription Data:</strong> We store your subscription status, plan type, and billing history for account management purposes.
                </p>
                <p>
                  <strong className="text-foreground">Razorpay:</strong> Razorpay handles all payment data in accordance with PCI DSS compliance standards. Please review <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Razorpay's Privacy Policy</a> for details.
                </p>
              </div>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              Data Security
            </h2>
            <Card className="p-6 glass">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="space-y-2">
                  <li>• <strong className="text-foreground">Encryption:</strong> All data is encrypted using AES-256 at rest and TLS 1.3 in transit</li>
                  <li>• <strong className="text-foreground">Access Controls:</strong> Strict access controls limit who can view your data</li>
                  <li>• <strong className="text-foreground">Secure Infrastructure:</strong> Our systems are hosted on secure, certified cloud platforms</li>
                  <li>• <strong className="text-foreground">Regular Audits:</strong> We conduct regular security assessments</li>
                </ul>
              </div>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              Your Rights and Choices
            </h2>
            <Card className="p-6 glass">
              <div className="space-y-4 text-muted-foreground">
                <p>You have the following rights regarding your data:</p>
                <ul className="space-y-3">
                  <li>
                    <strong className="text-foreground">Access:</strong> Request a copy of all your data at any time
                  </li>
                  <li>
                    <strong className="text-foreground">Correction:</strong> Update or correct your personal information
                  </li>
                  <li>
                    <strong className="text-foreground">Deletion:</strong> Delete your account and all associated data permanently
                  </li>
                  <li>
                    <strong className="text-foreground">Export:</strong> Download your data in a portable format
                  </li>
                  <li>
                    <strong className="text-foreground">Opt-Out:</strong> Unsubscribe from marketing communications
                  </li>
                </ul>
                <p className="mt-4">
                  To exercise any of these rights, visit your Profile Settings or contact us at{' '}
                  <a href="mailto:hello@support.beseekr.com" className="text-primary hover:underline">
                    hello@support.beseekr.com
                  </a>
                </p>
              </div>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
            <Card className="p-6 glass">
              <p className="text-muted-foreground mb-4">
                We retain your data for as long as your account is active. When you delete your account:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Your personal data is permanently deleted within 30 days</li>
                <li>• Anonymized analytics data may be retained for service improvement</li>
                <li>• Backup copies are purged within 90 days</li>
              </ul>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
            <Card className="p-6 glass">
              <p className="text-muted-foreground mb-4">
                We use select third-party services to operate beseekr:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground">AI Providers:</strong> For idea validation and analysis features
                </li>
                <li>
                  <strong className="text-foreground">Razorpay:</strong> For secure payment processing
                </li>
                <li>
                  <strong className="text-foreground">Cloud Hosting:</strong> Secure cloud infrastructure providers
                </li>
                <li>
                  <strong className="text-foreground">Analytics:</strong> Privacy-focused analytics (Vercel Analytics)
                </li>
              </ul>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <Card className="p-6 glass">
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically. When we make significant changes, we'll notify you via email or through the platform. Continued use of beseekr after changes indicates your acceptance of the updated policy.
              </p>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <Card className="p-6 glass">
              <p className="text-muted-foreground mb-4">
                If you have questions or concerns about this Privacy Policy, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Email:</strong>{' '}
                  <a href="mailto:hello@support.beseekr.com" className="text-primary hover:underline">
                    hello@support.beseekr.com
                  </a>
                </p>
              </div>
            </Card>
          </section>
        </div>

        <div className="text-center mt-12 sm:mt-16">
          <Link to="/dashboard/problems">
            <Button size="lg" className="gap-2">
              Explore Problems
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>© {new Date().getFullYear()} beseekr. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <Link
                to="/dashboard/problems"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Discover Problems
              </Link>
              <Link
                to="/dashboard/pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <a
                href="mailto:hello@support.beseekr.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;