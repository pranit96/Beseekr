import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function GlobalFooter() {
  return (
    <footer className="relative z-10 border-t border-border/50 bg-background mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left - Brand & Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              © {new Date().getFullYear()} beseekr. All rights reserved.
            </span>
          </div>

          {/* Center - Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm">
            {/* <Link
              to="/dashboard/problems"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse Problems
            </Link>
            <Link
              to="/dashboard/validate"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Validate Ideas
            </Link>
            <Link
              to="/dashboard/pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link> */}
            <Link
              to="/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
