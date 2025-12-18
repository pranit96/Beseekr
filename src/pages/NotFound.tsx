import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { createLogger } from "@/services/logging";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const logger = createLogger('NotFound');

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    logger.error("User attempted to access non-existent route", { pathname: location.pathname });
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate('/dashboard/problems');
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard/problems');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-6 sm:space-y-8">
        {/* Cute Dog Image - Different images for light/dark mode */}
        <div className="relative mx-auto w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 animate-bounce-slow">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl scale-75" />
          {/* Light mode image */}
          <img
            src="/images/404-dog.png"
            alt="Cute confused puppy"
            className="dark:hidden relative w-full h-full object-contain drop-shadow-2xl"
            loading="eager"
          />
          {/* Dark mode image */}
          <img
            src="/images/404-dog-dark.png"
            alt="Cute confused puppy"
            className="hidden dark:block relative w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(139,92,246,0.3)]"
            loading="eager"
          />
        </div>

        {/* 404 Text */}
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse-subtle">
            404
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
            Oops! Page not found
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Looks like this page went on a walk and got lost. Don't worry, our pup is on the case!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
          <Button
            onClick={handleGoHome}
            size="lg"
            className="w-full sm:w-auto min-w-[160px] bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
          <Button
            onClick={handleGoBack}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto min-w-[160px] border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Attempted Path (for debugging context) */}
        <div className="pt-4 sm:pt-6">
          <p className="text-xs text-muted-foreground/60">
            Attempted path: <code className="px-2 py-1 bg-muted/50 rounded text-xs font-mono">{location.pathname}</code>
          </p>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
