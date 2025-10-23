// Deck-to-Model Types

export interface DeckOrder {
  id: string;
  company_name: string | null;
  industry: string | null;
  stage: string | null;
  additional_notes: string | null;
  status: 'pending' | 'processing' | 'delivered' | 'failed' | 'expired';
  pdf_filename: string;
  pdf_file_size: number;
  excel_filename: string | null;
  excel_file_size: number | null;
  created_at: string;
  delivered_at: string | null;
  expires_at: string | null;
  error_message: string | null;
  processing_stage: string | null;
  processing_progress: number | null;
}

export interface OrderDetail extends DeckOrder {
  processingTimeSeconds?: number;
  isProcessing: boolean;
  isReady: boolean;
  isFailed: boolean;
  downloadUrl?: string;
  expiration?: {
    expiresAt: string;
    daysRemaining: number;
    isExpired: boolean;
    retentionDays: number;
    message: string;
  };
  jobProgress?: {
    stage: string;
    progress: number;
    estimatedTimeRemaining?: string;
  };
}

export interface OrdersListResponse {
  orders: DeckOrder[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface UploadResponse {
  orderId: string;
  status: string;
  estimatedTime: string;
  checkStatusUrl: string;
}

export interface UserMetrics {
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  averageProcessingTime: number;
}

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'failed' | 'expired';
export type IndustryType = 'SaaS' | 'FinTech' | 'E-commerce' | 'Healthcare' | 'Other';
export type StageType = 'Pre-seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C' | 'Growth' | 'Other';
