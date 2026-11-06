export interface Wallet {
  id: string;
  userId: string;
  currency: 'EGP' | 'USD' | 'EUR' | 'GBP';
  balance: string; // NUMERIC returned as string from pg
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWalletDTO {
  userId: string;
  currency?: Wallet['currency'];
}
