export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";
export type TransactionType = "MAINTENANCE" | "SECURITY_CHARGE" | "PENALTY" | "EVENT" | "WATER" | "OTHER";
export type TransactionStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

export interface TransactionItem {
  id: number;
  receiptNumber: string;
  accountantId: number;
  accountantName?: string | null;
  accountantEmail?: string | null;
  payerId?: number | null;
  payerName: string;
  payerEmail?: string | null;
  flatId?: number | null;
  flatNumber?: string | null;
  blockName?: string | null;
  amount: string;
  transactionType: TransactionType;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  paymentDate: string;
  status: TransactionStatus;
  notes?: string | null;
  billingMonth?: string | null;
  paymentPlan?: "FULL" | "PARTIAL" | null;
  balanceRemaining?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  payerName: string;
  payerId?: number;
  flatId?: number;
  amount: string;
  transactionType: TransactionType;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
  billingMonth?: string;
  paymentPlan?: "FULL" | "PARTIAL";
  balanceRemaining?: string;
}

export interface TransactionFilterQuery {
  paymentMethod?: PaymentMethod;
  transactionType?: TransactionType;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionStats {
  totalAmountCollected: number;
  cashTotal: number;
  upiTotal: number;
  otherTotal: number;
  totalTransactionsCount: number;
  cashTransactionsCount: number;
  upiTransactionsCount: number;
}
