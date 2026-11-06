export interface Transfer {
  id: string;
  idempotencyKey?: string;
  fromWalletId: string;
  toWalletId: string;
  amount: string;
  currency: 'EGP' | 'USD' | 'EUR' | 'GBP';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  failureReason?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransferDTO {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency?: Transfer['currency'];
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}
