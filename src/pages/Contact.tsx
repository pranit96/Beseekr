import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { useTranslation } from "react-i18next";
import {
  Send,
  Loader2,
  Mail,
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function Contact() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: user?.full_name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });

  // SEO - Update page meta tags
  useEffect(() => {
    document.title = "Contact Us - Get in Touch | beseekr";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Have questions about beseekr? Contact our team for support, feedback, or partnership inquiries. We typically respond within 24-48 hours.",
      );
    }
    return () => {
      document.title = "beseekr - Discover Validated Startup Problems";
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show API error message (e.g., "Message must be at least 10 characters")
        const errorMessage =
          data?.error || data?.message || "Failed to send message";
        toast.error(errorMessage);
        return;
      }

      setIsSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Contact form error:", error);
      // Only fallback to mailto for network errors (fetch failed)
      toast.error("Network error. Opening email client...");
      const mailtoLink = `mailto:hello@support.beseekr.com?subject=${encodeURIComponent(formData.subject || "Contact Form")}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
      window.open(mailtoLink, "_blank");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
        {/* Ambient background effects */}
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />

        <GlobalHeader />

        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <Card className="p-8 sm:p-12 glass border-border/50">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">
                {t("contact.messageSent", "Message Sent!")}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t(
                  "contact.sentDesc",
                  "Thank you for reaching out. We'll get back to you within 24-48 hours.",
                )}
              </p>
              <Button onClick={() => navigate("/")} className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("contact.backHome", "Back to Home")}
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />

      <GlobalHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 sm:py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6 animate-float">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
            {t("contact.subtitle", "Let's get in touch.")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t(
              "contact.desc",
              "Have a question, feedback, or need support? Drop us a line.",
            )}
          </p>
        </motion.div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="p-6 sm:p-8 glass border-border/50 shadow-soft">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("contact.name", "Name")} *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="rounded-xl bg-background/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("contact.email", "Email")} *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="rounded-xl bg-background/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">
                  {t("contact.subject", "Subject")}
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  className="rounded-xl bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  {t("contact.message", "Message")} *
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us what's on your mind..."
                  className="rounded-xl min-h-[150px] resize-none bg-background/50"
                  required
                />
                <p
                  className={`text-xs ${formData.message.length < 10 ? "text-muted-foreground" : "text-green-500"}`}
                >
                  {t("contact.minChar", {
                    count: formData.message.length,
                    defaultValue: `${formData.message.length}/10 characters minimum`,
                  })}
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl h-12 bg-primary text-primary-foreground hover:opacity-90 hover-scale-sm transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("contact.sending", "Sending...")}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("contact.send", "Send Message")}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Or reach us directly at
              </p>
              <a
                href="mailto:hello@support.beseekr.com"
                className="inline-flex items-center gap-2 text-primary hover:underline hover-scale-sm transition-all"
              >
                <Mail className="h-4 w-4" />
                hello@support.beseekr.com
              </a>
            </div>
          </Card>
        </motion.div>
      </main>

      {/* FOOTER */}
      <GlobalFooter />
    </div>
  );
}

export default Contact;
