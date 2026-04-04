import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  XCircle,
  ArrowRight,
  RefreshCcw,
  HelpCircle,
  CreditCard,
} from "lucide-react";

export function PaymentFailed() {
  const [searchParams] = useSearchParams();

  // Get payment details from URL
  const paymentId = searchParams.get("razorpay_payment_id");
  const paymentStatus = searchParams.get("razorpay_payment_link_status");
  const errorMessage =
    searchParams.get("error_description") || searchParams.get("error");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-lg w-full"
      >
        <div className="bg-background/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-8 sm:p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Failed Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                <XCircle className="h-12 w-12 text-white" />
              </div>
            </motion.div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Payment Failed
              </h1>
              <p className="text-muted-foreground">
                {errorMessage ||
                  "We couldn't process your payment. Please try again."}
              </p>
            </div>

            {/* Error Details */}
            {(paymentId || paymentStatus) && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 space-y-1">
                {paymentId && <p>Payment ID: {paymentId}</p>}
                {paymentStatus && <p>Status: {paymentStatus}</p>}
              </div>
            )}

            {/* Common Reasons */}
            <div className="text-left bg-muted/20 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                Common reasons for failure:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Insufficient funds in your account</li>
                <li>Card declined by your bank</li>
                <li>Incorrect card details</li>
                <li>Payment session expired</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link to="/dashboard/pricing">
                <Button
                  size="lg"
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 h-12 text-base"
                >
                  <RefreshCcw className="mr-2 h-5 w-5" />
                  Try Again
                </Button>
              </Link>

              <Link to="/dashboard/problems">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl h-12 text-base"
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Need help? Contact us at{" "}
              <a
                href="mailto:support@beseekr.com"
                className="text-primary hover:underline"
              >
                support@beseekr.com
              </a>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default PaymentFailed;
