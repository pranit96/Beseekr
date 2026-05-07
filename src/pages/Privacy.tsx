// src/pages/Privacy.tsx
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";

const Privacy = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Logo className="text-xl" />
          {!user ? (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          ) : (
            <div className="w-[88px]" />
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/50 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your privacy and data security are our top priorities. Learn how we
            handle your data in our autonomous AI agent platform.
          </p>
          <p className="text-sm text-muted-foreground mt-6 font-medium">
            Effective Date: December 13, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-10">
          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground border-b border-border/50 pb-2 mb-4">
              1. Information We Collect
            </h2>
            <div className="text-muted-foreground space-y-4 leading-relaxed">
              <p>
                When you use Beseekr, we collect essential information to
                provide our autonomous multi-agent services. This includes your
                account information (name, email) and the data you explicitly
                provide when creating workflows, configuring agents, or chatting
                with the system.
              </p>
              <p>
                We also collect necessary technical data such as API key
                configurations (which are securely encrypted and never logged in
                plain text), workflow execution logs, and usage metrics to
                ensure the stability and reliability of our orchestration
                engine.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground border-b border-border/50 pb-2 mb-4">
              2. How We Use Your Data
            </h2>
            <div className="text-muted-foreground space-y-4 leading-relaxed">
              <p>
                Your data is strictly used to operate the Beseekr platform. We
                use your prompts, attached files, and configurations solely as
                context for the AI agents you invoke.
              </p>
              <p>
                We do <strong>not</strong> use your private workflow data to
                train our own foundational AI models. We use anonymized system
                metrics to improve our load balancing, reduce latency, and
                prevent rate-limiting across our agent pools.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground border-b border-border/50 pb-2 mb-4">
              3. AI Providers & Third Parties
            </h2>
            <div className="text-muted-foreground space-y-4 leading-relaxed">
              <p>
                To provide our multi-agent capabilities, your prompts and
                contextual data are securely transmitted to our partner LLM
                providers (e.g., OpenAI, Anthropic, Groq) via API. These
                providers process the data strictly to generate responses and
                are bound by enterprise data processing agreements that prohibit
                them from using your data to train their models.
              </p>
              <p>
                We do not share your personally identifiable information with
                these AI providers. We only share the contextual data necessary
                to execute the specific tasks you assign to the agents.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground border-b border-border/50 pb-2 mb-4">
              4. Data Security & Storage
            </h2>
            <div className="text-muted-foreground space-y-4 leading-relaxed">
              <p>
                All data, including your conversation history, saved workflows,
                and uploaded files, is encrypted both in transit (TLS 1.3) and
                at rest (AES-256). Our infrastructure is built on secure,
                certified cloud platforms with strict access controls.
              </p>
              <p>
                API keys that you provide for external integrations or specific
                LLM access are heavily encrypted before storage and are only
                decrypted in memory at the exact moment an agent requires them
                for execution.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground border-b border-border/50 pb-2 mb-4">
              5. Data Retention & Your Rights
            </h2>
            <div className="text-muted-foreground space-y-4 leading-relaxed">
              <p>
                You retain full control over your data. You may delete
                individual conversations, workflows, or your entire account at
                any time. Upon account deletion, all associated personal data
                and workflow history is permanently purged from our active
                databases within 30 days.
              </p>
              <p>
                You also have the right to request an export of your data in a
                portable format via your Profile Settings.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground border-b border-border/50 pb-2 mb-4">
              6. Contact Us
            </h2>
            <div className="text-muted-foreground space-y-4 leading-relaxed">
              <p>
                If you have any questions or concerns regarding this Privacy
                Policy or our data practices, please contact our support team.
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:support@beseekr.com"
                  className="text-primary hover:underline"
                >
                  support@beseekr.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                © {new Date().getFullYear()} Beseekr. All rights reserved.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
