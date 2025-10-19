type BatchRequest<T> = {
  id: string;
  resolve: (value: T) => void;
  reject: (error: any) => void;
};

class RequestBatcher<T> {
  private queue: BatchRequest<T>[] = [];
  private timer: NodeJS.Timeout | null = null;
  private batchDelay: number;
  private maxBatchSize: number;

  constructor(
    private batchFn: (ids: string[]) => Promise<T[]>,
    options: { batchDelay?: number; maxBatchSize?: number } = {}
  ) {
    this.batchDelay = options.batchDelay || 50;
    this.maxBatchSize = options.maxBatchSize || 10;
  }

  request(id: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, resolve, reject });

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  private async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.queue.splice(0, this.maxBatchSize);
    if (batch.length === 0) return;

    try {
      const ids = batch.map(req => req.id);
      const results = await this.batchFn(ids);
      
      batch.forEach((req, index) => {
        req.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(req => req.reject(error));
    }
  }
}

export const createBatcher = <T>(
  batchFn: (ids: string[]) => Promise<T[]>,
  options?: { batchDelay?: number; maxBatchSize?: number }
) => new RequestBatcher(batchFn, options);
