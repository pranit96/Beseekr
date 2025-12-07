// src/pages/Privacy.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Shield, Eye, Lock, Server, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              beseekr
            </span>
          </div>
          <Button onClick={() => navigate('/auth')} variant="outline" size="sm">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your data.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: October 14, 2024
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 glass text-center">
            <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">End-to-End Encryption</h3>
            <p className="text-sm text-muted-foreground">
              Your conversations are encrypted and secure
            </p>
          </Card>
          <Card className="p-6 glass text-center">
            <Eye className="w-10 h-10 text-accent mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Data Selling</h3>
            <p className="text-sm text-muted-foreground">
              We never sell your personal information
            </p>
          </Card>
          <Card className="p-6 glass text-center">
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
                <li>• Conversation metadata (timestamps, agent interactions)</li>
                <li>• Feature usage patterns</li>
                <li>• Performance and error logs</li>
                <li>• Device and browser information</li>
              </ul>
            </Card>

            <Card className="p-6 glass">
              <h3 className="text-lg font-semibold mb-3">Conversation Content</h3>
              <p className="text-muted-foreground mb-4">
                Your conversations with AI agents are:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Encrypted in transit and at rest</li>
                <li>• Used only to provide our services</li>
                <li>• Never shared with third parties for marketing</li>
                <li>• Anonymized for service improvements (opt-in only)</li>
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
                  <strong className="text-foreground">Provide Services:</strong> We use your information to deliver and improve beseekr's features, including AI agent orchestration, conversation management, and personalized experiences.
                </p>
                <p>
                  <strong className="text-foreground">Communication:</strong> We may send you service updates, security alerts, and account-related notifications. Marketing communications are opt-in only.
                </p>
                <p>
                  <strong className="text-foreground">Security:</strong> We monitor for suspicious activity and implement measures to protect your account from unauthorized access.
                </p>
                <p>
                  <strong className="text-foreground">Analytics:</strong> We analyze usage patterns to improve features, fix bugs, and optimize performance. All analytics data is aggregated and anonymized.
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
                  <li>• <strong className="text-foreground">Encryption:</strong> All data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit</li>
                  <li>• <strong className="text-foreground">Access Controls:</strong> Strict access controls limit who can view your data</li>
                  <li>• <strong className="text-foreground">Regular Audits:</strong> We conduct regular security audits and vulnerability assessments</li>
                  <li>• <strong className="text-foreground">Secure Infrastructure:</strong> Our systems are hosted on secure, certified cloud platforms</li>
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
                  <a href="mailto:privacy@beseekr.com" className="text-primary hover:underline">
                    privacy@beseekr.com
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
                <li>• Legal obligations may require us to retain certain data longer</li>
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
                  <strong className="text-foreground">AI Providers:</strong> OpenAI and Anthropic for AI model access (data processing agreements in place)
                </li>
                <li>
                  <strong className="text-foreground">Cloud Hosting:</strong> Secure cloud infrastructure providers
                </li>
                <li>
                  <strong className="text-foreground">Analytics:</strong> Privacy-focused analytics tools (no personal data shared)
                </li>
              </ul>
              <p className="mt-4">
                All third-party services are carefully vetted and comply with data protection regulations.
              </p>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
            <Card className="p-6 glass">
              <p className="text-muted-foreground">
                beseekr is not intended for users under 13 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
              </p>
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
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Email:</strong>{' '}
                  <a href="mailto:privacy@beseekr.com" className="text-primary hover:underline">
                    privacy@beseekr.com
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">Support:</strong>{' '}
                  <a href="mailto:support@beseekr.com" className="text-primary hover:underline">
                    support@beseekr.com
                  </a>
                </p>
              </div>
            </Card>
          </section>
        </div>

        <div className="text-center mt-16">
          <Button onClick={() => navigate('/auth')} size="lg" className="gap-2">
            Get Started with beseekr
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Privacy;