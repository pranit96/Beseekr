import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { DeckOrder } from '@/types/deck-to-model';
import { Download, Eye, FileText, TrendingUp, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface DeckOrdersSidebarProps {
  currentOrderId?: string;
}

export function DeckOrdersSidebar({ currentOrderId }: DeckOrdersSidebarProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DeckOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<DeckOrder | null>(null);

  useEffect(() => {
    fetchOrders();

    // Auto-refresh if any order is processing
    const interval = setInterval(() => {
      const hasProcessing = orders.some(o => o.status === 'processing' || o.status === 'pending');
      if (hasProcessing) {
        fetchOrders();
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.getDeckOrders({ limit: 10, offset: 0 });
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      // Silent fail for sidebar
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (order: DeckOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (order.status !== 'delivered') {
      toast.error('Model not ready yet');
      return;
    }

    setDownloadingIds(prev => new Set(prev).add(order.id));

    try {
      const blob = await apiClient.downloadDeckModel(order.id);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = order.excel_filename || `Financial_Model_${order.company_name || 'Untitled'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (error: any) {
      toast.error('Download failed', {
        description: error.message
      });
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
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
        
        // If we're on the detail page of the deleted order, navigate away
        if (currentOrderId === orderToDelete.id) {
          navigate('/deck-to-model/orders');
        }
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
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Orders
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const isActive = currentOrderId === order.id;
                const isDownloading = downloadingIds.has(order.id);

                return (
                  <div
                    key={order.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }`}
                    onClick={() => navigate(`/deck-to-model/orders/${order.id}`)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm truncate flex-1">
                          {order.company_name || 'Untitled'}
                        </h4>
                        <OrderStatusBadge
                          status={order.status}
                          processingStage={order.processing_stage}
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        {order.industry && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{order.industry}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>

                      <div className="flex gap-1 pt-1">
                        {order.status === 'delivered' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs"
                            onClick={(e) => handleDownload(order, e)}
                            disabled={isDownloading}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            {isDownloading ? 'Downloading...' : 'Download'}
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/deck-to-model/orders/${order.id}`);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
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
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

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
    </Card>
  );
}
