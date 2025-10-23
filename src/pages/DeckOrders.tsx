import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Download, Eye, RefreshCw, FileText, Calendar, Building2, MoreVertical, Trash2 } from 'lucide-react';
import { DeckOrder } from '@/types/deck-to-model';
import { formatDistanceToNow } from 'date-fns';
import { DeckOrdersSidebar } from '@/components/DeckOrdersSidebar';
import { DeckMetricsCard } from '@/components/DeckMetricsCard';

export default function DeckOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DeckOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<DeckOrder | null>(null);

  const fetchOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const response = await apiClient.getDeckOrders({ limit: 50, offset: 0 });
      
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
      }
    } catch (error: any) {
      toast.error('Failed to load orders', {
        description: error.message
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto-refresh if any order is processing
    const interval = setInterval(() => {
      const hasProcessing = orders.some(o => o.status === 'processing' || o.status === 'pending');
      if (hasProcessing) {
        fetchOrders(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orders]);

  const handleDownload = async (order: DeckOrder) => {
    if (order.status !== 'delivered') {
      toast.error('Model not ready yet');
      return;
    }

    setDownloadingIds(prev => new Set(prev).add(order.id));

    try {
      const blob = await apiClient.downloadDeckModel(order.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = order.excel_filename || `Financial_Model_${order.company_name || 'Untitled'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (error: any) {
      if (error.message.includes('expired') || error.message.includes('410')) {
        toast.error('File has expired', {
          description: 'Contact support to regenerate your model'
        });
      } else {
        toast.error('Download failed', {
          description: error.message
        });
      }
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  const getDaysRemaining = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleDeleteClick = (order: DeckOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only allow deletion of completed, failed, or expired orders
    if (order.status === 'processing' || order.status === 'pending') {
      toast.error('Cannot delete orders that are currently processing');
      return;
    }
    
    setOrderToDelete(order);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    setDeletingId(orderToDelete.id);

    try {
      const response = await apiClient.deleteDeckOrder(orderToDelete.id);
      
      if (response.success) {
        toast.success('Order deleted successfully');
        
        // Remove from local state
        setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));
      }
    } catch (error: any) {
      toast.error('Failed to delete order', {
        description: error.message
      });
    } finally {
      setDeletingId(null);
      setOrderToDelete(null);
    }
  };

  const canDelete = (order: DeckOrder): boolean => {
    return order.status === 'delivered' || order.status === 'failed' || order.status === 'expired';
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-muted-foreground">Loading orders...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Financial Models</h1>
                <p className="text-muted-foreground">
                  {orders.length} {orders.length === 1 ? 'model' : 'models'} total
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchOrders(true)}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={() => navigate('/deck-to-model/upload')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload New Deck
                </Button>
              </div>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No models yet</h3>
                  <p className="text-muted-foreground mb-6 text-center max-w-md">
                    Upload your first pitch deck to generate a professional financial model
                  </p>
                  <Button onClick={() => navigate('/deck-to-model/upload')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Your First Deck
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const daysRemaining = getDaysRemaining(order.expires_at);
                  const isDownloading = downloadingIds.has(order.id);

                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold truncate">
                                {order.company_name || 'Untitled Model'}
                              </h3>
                              <OrderStatusBadge
                                status={order.status}
                                processingStage={order.processing_stage}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="truncate">{order.pdf_filename}</span>
                              </div>
                              
                              {order.company_name && order.industry && (
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  <span>{order.industry}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>

                            {order.status === 'delivered' && daysRemaining !== null && (
                              <div className="mt-2">
                                <p className={`text-xs ${
                                  daysRemaining <= 1 ? 'text-red-500' :
                                  daysRemaining <= 3 ? 'text-yellow-500' :
                                  'text-green-500'
                                }`}>
                                  {daysRemaining > 0
                                    ? `Expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`
                                    : 'Expired'}
                                </p>
                              </div>
                            )}

                            {order.status === 'failed' && order.error_message && (
                              <p className="text-sm text-destructive mt-2">
                                Error: {order.error_message}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            {order.status === 'delivered' && (
                              <Button
                                onClick={() => handleDownload(order)}
                                disabled={isDownloading}
                                size="sm"
                              >
                                {isDownloading ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/deck-to-model/orders/${order.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Details
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => handleDeleteClick(order, e)}
                                  disabled={!canDelete(order) || deletingId === order.id}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {deletingId === order.id ? 'Deleting...' : 'Delete Order'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            </div>
          </main>
          
          {/* Sidebar with metrics */}
          <aside className="w-80 border-l border-border p-6 overflow-y-auto space-y-6">
            <DeckMetricsCard />
            <DeckOrdersSidebar />
          </aside>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the order for{' '}
              <strong>{orderToDelete?.company_name || 'Untitled'}</strong>?
              {orderToDelete?.status === 'delivered' && (
                <span className="block mt-2 text-yellow-600">
                  Warning: The Excel file will no longer be available for download.
                </span>
              )}
              <span className="block mt-2">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
