import { apiClient } from "../../../lib/api-client";
import {
  CreateTransactionData,
  TransactionFilterQuery,
  TransactionItem,
  TransactionStats,
} from "../types/index";

const initialMockTransactions: TransactionItem[] = [
  {
    id: 1,
    receiptNumber: "RCP-2026-1001",
    accountantId: 2,
    accountantName: "Pooja Verma (Accountant)",
    accountantEmail: "accountant@society.com",
    payerId: 1,
    payerName: "Ramesh Sharma",
    payerEmail: "secretary@society.com",
    flatId: 1,
    flatNumber: "101",
    blockName: "Tower A (Emerald)",
    amount: "4000.00",
    transactionType: "MAINTENANCE",
    paymentMethod: "UPI",
    referenceNumber: "UPI/2026/893746281",
    paymentDate: "2026-09-18T11:30:00.000Z",
    status: "SUCCESS",
    notes: "September monthly dues settled via UPI",
    billingMonth: "September 2026",
    paymentPlan: "FULL",
    balanceRemaining: "0.00",
    createdAt: "2026-09-18T11:30:00.000Z",
    updatedAt: "2026-09-18T11:30:00.000Z",
  },
  {
    id: 2,
    receiptNumber: "RCP-2026-1002",
    accountantId: 2,
    accountantName: "Pooja Verma (Accountant)",
    accountantEmail: "accountant@society.com",
    payerId: 3,
    payerName: "Amit Patel",
    payerEmail: "amit.patel@gmail.com",
    flatId: 2,
    flatNumber: "102",
    blockName: "Tower A (Emerald)",
    amount: "2000.00",
    transactionType: "MAINTENANCE",
    paymentMethod: "CASH",
    referenceNumber: "CASH-REC-014",
    paymentDate: "2026-09-18T16:15:00.000Z",
    status: "SUCCESS",
    notes: "September maintenance partial pay at office counter",
    billingMonth: "September 2026",
    paymentPlan: "PARTIAL",
    balanceRemaining: "2000.00",
    createdAt: "2026-09-18T16:15:00.000Z",
    updatedAt: "2026-09-18T16:15:00.000Z",
  },
  {
    id: 3,
    receiptNumber: "RCP-2026-1003",
    accountantId: 2,
    accountantName: "Pooja Verma (Accountant)",
    accountantEmail: "accountant@society.com",
    payerId: 6,
    payerName: "Rajesh Malhotra",
    payerEmail: "rajesh@society.com",
    flatId: 3,
    flatNumber: "201",
    blockName: "Tower A (Emerald)",
    amount: "4000.00",
    transactionType: "MAINTENANCE",
    paymentMethod: "UPI",
    referenceNumber: "PAYTM/883719024",
    paymentDate: "2026-09-19T09:45:00.000Z",
    status: "SUCCESS",
    notes: "Base maintenance + security charge combined via Paytm UPI",
    billingMonth: "September 2026",
    paymentPlan: "FULL",
    balanceRemaining: "0.00",
    createdAt: "2026-09-19T09:45:00.000Z",
    updatedAt: "2026-09-19T09:45:00.000Z",
  },
];

export class TransactionService {
  private localTransactions: TransactionItem[] = [...initialMockTransactions];

  async getTransactions(query?: TransactionFilterQuery): Promise<TransactionItem[]> {
    try {
      const queryParams = new URLSearchParams();
      if (query?.paymentMethod) queryParams.append("paymentMethod", query.paymentMethod);
      if (query?.transactionType) queryParams.append("transactionType", query.transactionType);
      if (query?.search) queryParams.append("search", query.search);

      const endpoint = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await apiClient.get<{ transactions: TransactionItem[] }>(endpoint);
      if (res.data?.transactions) {
        return res.data.transactions;
      }
    } catch {
      // Fallback to local memory mock
    }

    let filtered = [...this.localTransactions];
    if (query?.paymentMethod) {
      filtered = filtered.filter((t) => t.paymentMethod === query.paymentMethod);
    }
    if (query?.transactionType) {
      filtered = filtered.filter((t) => t.transactionType === query.transactionType);
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.payerName.toLowerCase().includes(s) ||
          (t.accountantName && t.accountantName.toLowerCase().includes(s)) ||
          t.receiptNumber.toLowerCase().includes(s) ||
          (t.flatNumber && t.flatNumber.toLowerCase().includes(s)) ||
          (t.referenceNumber && t.referenceNumber.toLowerCase().includes(s)) ||
          (t.billingMonth && t.billingMonth.toLowerCase().includes(s))
      );
    }

    return filtered;
  }

  async createTransaction(data: CreateTransactionData): Promise<TransactionItem> {
    try {
      const res = await apiClient.post<TransactionItem>("/transactions", data);
      if (res.data) {
        const itemWithMeta: TransactionItem = {
          ...res.data,
          billingMonth: data.billingMonth || res.data.billingMonth,
          paymentPlan: data.paymentPlan || res.data.paymentPlan,
          balanceRemaining: data.balanceRemaining || res.data.balanceRemaining,
        };
        this.localTransactions.unshift(itemWithMeta);
        return itemWithMeta;
      }
    } catch {
      // Local fallback
    }

    const newId = Date.now();
    const newRecord: TransactionItem = {
      id: newId,
      receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      accountantId: 3,
      accountantName: "Vikas Sharma (Accountant)",
      accountantEmail: "accountant@society.com",
      payerName: data.payerName,
      flatId: data.flatId,
      flatNumber: data.flatId ? `Unit #${data.flatId}` : "Direct Resident",
      amount: parseFloat(data.amount).toFixed(2),
      transactionType: data.transactionType,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber || (data.paymentMethod === "CASH" ? "CASH-PAID" : "UPI/REF-NEW"),
      paymentDate: new Date(data.paymentDate).toISOString(),
      status: "SUCCESS",
      notes: data.notes,
      billingMonth: data.billingMonth,
      paymentPlan: data.paymentPlan,
      balanceRemaining: data.balanceRemaining,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.localTransactions.unshift(newRecord);
    return newRecord;
  }

  getStats(): TransactionStats {
    let totalAmountCollected = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let otherTotal = 0;
    let cashTransactionsCount = 0;
    let upiTransactionsCount = 0;

    for (const item of this.localTransactions) {
      if (item.status === "SUCCESS") {
        const val = parseFloat(item.amount) || 0;
        totalAmountCollected += val;
        if (item.paymentMethod === "CASH") {
          cashTotal += val;
          cashTransactionsCount += 1;
        } else if (item.paymentMethod === "UPI") {
          upiTotal += val;
          upiTransactionsCount += 1;
        } else {
          otherTotal += val;
        }
      }
    }

    return {
      totalAmountCollected,
      cashTotal,
      upiTotal,
      otherTotal,
      totalTransactionsCount: this.localTransactions.length,
      cashTransactionsCount,
      upiTransactionsCount,
    };
  }
}

export const transactionService = new TransactionService();
