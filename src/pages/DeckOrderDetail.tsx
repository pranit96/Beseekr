import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { GlobalHeader } from "@/components/GlobalHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import {
  Download,
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  TrendingUp,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { OrderDetail } from "@/types/deck-to-model";
import { formatDistanceToNow, format } from "date-fns";
import { DeckOrdersSidebar } from "@/components/DeckOrdersSidebar";

export default function DeckOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOrder = async (showRefreshing = false) => {
    if (!orderId) return;

    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const response = await apiClient.getDeckOrder(orderId);

      if (response.success && response.data) {
        setOrder(response.data);
      }
    } catch (error: any) {
      toast.error("Failed to load order", {
        description: error.message,
      });
      if (error.message.includes("not found")) {
        navigate("/deck-to-model/orders");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order) return;

    // Auto-refresh if processing
    if (order.status === "processing" || order.status === "pending") {
      const interval = setInterval(() => {
        fetchOrder(true);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [order?.status]);

  const handleDownload = async () => {
    if (!order || order.status !== "delivered") return;

    setDownloading(true);

    try {
      const blob = await apiClient.downloadDeckModel(order.id);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        order.excel_filename ||
        `Financial_Model_${order.company_name || "Untitled"}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch (error: any) {
      if (error.message.includes("expired") || error.message.includes("410")) {
        toast.error("File has expired", {
          description: "Contact support to regenerate your model",
        });
      } else {
        toast.error("Download failed", {
          description: error.message,
        });
      }
    } finally {
      setDownloading(false);
    }
  };

  const getDaysRemaining = (): number | null => {
    if (!order?.expires_at) return null;
    const now = new Date();
    const expiry = new Date(order.expires_at);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getProgressSteps = () => {
    const steps = [
      { label: "Uploaded", completed: true, timestamp: order?.created_at },
      { label: "Extracting Data", completed: false, timestamp: null },
      { label: "Generating Model", completed: false, timestamp: null },
      { label: "Creating Excel", completed: false, timestamp: null },
      { label: "Ready", completed: false, timestamp: order?.delivered_at },
    ];

    if (order?.status === "delivered") {
      return steps.map((s) => ({ ...s, completed: true }));
    }

    if (order?.status === "processing") {
      const stage = order.processing_stage?.toLowerCase() || "";
      if (stage.includes("extract")) {
        steps[1].completed = true;
      } else if (stage.includes("generat")) {
        steps[1].completed = true;
        steps[2].completed = true;
      } else if (stage.includes("excel") || stage.includes("creat")) {
        steps[1].completed = true;
        steps[2].completed = true;
        steps[3].completed = true;
      }
    }

    return steps;
  };

  const handleDeleteClick = () => {
    if (
      order &&
      (order.status === "processing" || order.status === "pending")
    ) {
      toast.error("Cannot delete orders that are currently processing");
      return;
    }
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!order) return;

    setDeleting(true);

    try {
      const response = await apiClient.deleteDeckOrder(order.id);

      if (response.success) {
        toast.success("Order deleted successfully");
        navigate("/deck-to-model/orders");
      }
    } catch (error: any) {
      toast.error("Failed to delete order", {
        description: error.message,
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const canDelete = (): boolean => {
    if (!order) return false;
    return (
      order.status === "delivered" ||
      order.status === "failed" ||
      order.status === "expired"
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <GlobalHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-muted-foreground">
                Loading order details...
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <GlobalHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Order Not Found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    The order you're looking for doesn't exist or you don't have
                    access to it.
                  </p>
                  <Button onClick={() => navigate("/deck-to-model/orders")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Orders
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();
  const progressSteps = getProgressSteps();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <GlobalHeader />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/deck-to-model/orders")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Orders
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fetchOrder(true)}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Button
                    onClick={() => navigate("/deck-to-model/upload")}
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Another
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleDeleteClick}
                        disabled={!canDelete() || deleting}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleting ? "Deleting..." : "Delete Order"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Order Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {order.company_name || "Untitled Model"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        Order ID:{" "}
                        <span className="font-mono text-xs">{order.id}</span>
                      </CardDescription>
                    </div>
                    <OrderStatusBadge
                      status={order.status}
                      processingStage={order.processing_stage}
                      className="text-base px-4 py-2"
                    />
                  </div>
                </CardHeader>
              </Card>

              {/* Progress Timeline */}
              {(order.status === "processing" ||
                order.status === "pending" ||
                order.status === "delivered") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Processing Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {progressSteps.map((step, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              step.completed ? "bg-green-500" : "bg-muted"
                            }`}
                          >
                            {step.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`font-medium ${step.completed ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {step.label}
                            </p>
                            {step.timestamp && (
                              <p className="text-xs text-muted-foreground">
                                {format(
                                  new Date(step.timestamp),
                                  "MMM d, yyyy h:mm a",
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.processing_progress !== null &&
                      order.processing_progress !== undefined && (
                        <div className="mt-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">
                              {order.processing_progress}%
                            </span>
                          </div>
                          <Progress value={order.processing_progress} />
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

              {/* Download Section */}
              {order.status === "delivered" && (
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-green-500" />
                      Your Financial Model is Ready!
                    </CardTitle>
                    <CardDescription>
                      Download your Excel file with complete 3-statement
                      projections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleDownload}
                      disabled={downloading}
                      size="lg"
                      className="w-full"
                    >
                      {downloading ? (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-5 w-5" />
                          Download Excel File
                        </>
                      )}
                    </Button>

                    {daysRemaining !== null && (
                      <Alert
                        className={
                          daysRemaining <= 1
                            ? "border-red-500/50 bg-red-500/10"
                            : daysRemaining <= 3
                              ? "border-yellow-500/50 bg-yellow-500/10"
                              : "border-green-500/50 bg-green-500/10"
                        }
                      >
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          {daysRemaining > 0 ? (
                            <>
                              File available for{" "}
                              <strong>
                                {daysRemaining} more{" "}
                                {daysRemaining === 1 ? "day" : "days"}
                              </strong>
                              {daysRemaining <= 3 && " - Download soon!"}
                            </>
                          ) : (
                            "File has expired. Contact support to regenerate."
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    <p className="text-sm text-muted-foreground text-center">
                      You can download this file multiple times within the
                      availability period
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Failed Status */}
              {order.status === "failed" && (
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="h-5 w-5" />
                      Processing Failed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.error_message && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {order.error_message}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => navigate("/deck-to-model/upload")}
                        className="flex-1"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Again
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Contact Support
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Company Name
                        </p>
                        <p className="font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {order.company_name || "Not provided"}
                        </p>
                      </div>
                      {order.industry && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Industry
                          </p>
                          <p className="font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {order.industry}
                          </p>
                        </div>
                      )}
                      {order.stage && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Stage
                          </p>
                          <p className="font-medium">{order.stage}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Uploaded File
                        </p>
                        <p className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="truncate">{order.pdf_filename}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Upload Date
                        </p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(
                            new Date(order.created_at),
                            "MMM d, yyyy h:mm a",
                          )}
                        </p>
                      </div>
                      {order.delivered_at && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Completed
                          </p>
                          <p className="font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            {formatDistanceToNow(new Date(order.delivered_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {order.additional_notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Additional Notes
                      </p>
                      <p className="text-sm">{order.additional_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* What's Included */}
              {order.status === "delivered" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      What's Included in Your Model
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Summary Sheet:</strong> Key metrics and
                          financial overview
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Income Statement:</strong> 5-year P&L
                          projections
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Balance Sheet:</strong> Assets, liabilities,
                          and equity
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Cash Flow:</strong> Operating, investing, and
                          financing activities
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Assumptions:</strong> Model assumptions with 3
                          scenarios (Conservative, Base, Optimistic)
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>

          {/* Sidebar with recent orders */}
          <aside className="w-80 border-l border-border p-6 overflow-y-auto">
            <DeckOrdersSidebar currentOrderId={orderId} />
          </aside>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the order for{" "}
              <strong>{order?.company_name || "Untitled"}</strong>?
              {order?.status === "delivered" && (
                <span className="block mt-2 text-yellow-600">
                  Warning: The Excel file will no longer be available for
                  download.
                </span>
              )}
              <span className="block mt-2">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
