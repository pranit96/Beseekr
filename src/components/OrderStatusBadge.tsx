import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, CheckCircle2, XCircle, Archive } from "lucide-react";
import { OrderStatus } from "@/types/deck-to-model";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  processingStage?: string | null;
  className?: string;
}

export function OrderStatusBadge({
  status,
  processingStage,
  className,
}: OrderStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          icon: Clock,
          variant: "secondary" as const,
          className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
        };
      case "processing":
        return {
          label: processingStage || "Processing",
          icon: Loader2,
          variant: "default" as const,
          className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          animate: true,
        };
      case "delivered":
        return {
          label: "Ready",
          icon: CheckCircle2,
          variant: "default" as const,
          className: "bg-green-500/10 text-green-500 border-green-500/20",
        };
      case "failed":
        return {
          label: "Failed",
          icon: XCircle,
          variant: "destructive" as const,
          className: "bg-red-500/10 text-red-500 border-red-500/20",
        };
      case "expired":
        return {
          label: "Expired",
          icon: Archive,
          variant: "secondary" as const,
          className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
        };
      default:
        return {
          label: status,
          icon: Clock,
          variant: "secondary" as const,
          className: "",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      <Icon
        className={`h-3 w-3 mr-1 ${config.animate ? "animate-spin" : ""}`}
      />
      {config.label}
    </Badge>
  );
}
