import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ReactNode } from "react";

interface GlobalFooterProps {
  children?: ReactNode;
  className?: string;
}

export function GlobalFooter({ children, className = "" }: GlobalFooterProps) {
  const { t } = useTranslation();

  return (
    <footer
      className={`relative z-10 border-t border-border/50 bg-background mt-auto ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left - Brand & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                © {new Date().getFullYear()} beseekr.{" "}
                {t("footer.allRightsReserved", "All rights reserved.")}
              </span>
            </div>

            {/* Slot for feature-specific extensions */}
            {children && (
              <div className="flex items-center gap-4 border-l border-border/50 pl-4 h-4 hidden sm:flex">
                {children}
              </div>
            )}
          </div>

          {/* Right - Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm">
            <Link
              to="/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("footer.about", "About")}
            </Link>
            <Link
              to="/contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("footer.contact", "Contact")}
            </Link>
            <Link
              to="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("footer.privacy", "Privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
