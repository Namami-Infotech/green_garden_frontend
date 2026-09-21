"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, Smartphone, Banknote, Filter, Receipt } from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import { TransactionList } from "../../modules/transactions/components/TransactionList";
import { TransactionStats } from "../../modules/transactions/components/TransactionStats";
import { TransactionModal } from "../../modules/transactions/components/TransactionModal";
import { transactionService } from "../../modules/transactions/services/transaction.service";
import { flatService } from "../../modules/flats/services/flat.service";
import {
  CreateTransactionData,
  PaymentMethod,
  TransactionItem,
  TransactionStats as ITransactionStats,
  TransactionType,
} from "../../modules/transactions/types/index";
import { FlatItem } from "../../modules/flats/types/index";
import { useAuth } from "../../hooks/use-auth";
import { useToast } from "../../hooks/use-toast";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [stats, setStats] = useState<ITransactionStats>({
    totalAmountCollected: 0,
    cashTotal: 0,
    upiTotal: 0,
    otherTotal: 0,
    totalTransactionsCount: 0,
    cashTransactionsCount: 0,
    upiTransactionsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { hasRole, user } = useAuth();
  const { toast } = useToast();
  const isStaff = hasRole(["SECRETARY", "ACCOUNTANT"]);
  const isResident = user?.role === "USER";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txns, flatsRes] = await Promise.all([
        transactionService.getTransactions({
          search: search || undefined,
          paymentMethod: (methodFilter as PaymentMethod) || undefined,
          transactionType: (typeFilter as TransactionType) || undefined,
        }),
        flatService.getFlats(),
      ]);
      setTransactions(txns);
      setFlats(flatsRes.flats);
      setStats(transactionService.getStats());
    } catch (e) {
      console.error("Failed to load transactions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [methodFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateTransaction = async (data: CreateTransactionData) => {
    try {
      await transactionService.createTransaction(data);
      toast.success(
        `₹${Number(data.amount).toLocaleString("en-IN")} transaction recorded successfully!`,
        "Transaction Saved"
      );
      await fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to record transaction", "Transaction Error");
    }
  };

  return (
    <DashboardShell title="Society Transactions & Collections">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Top Summary Stats */}
        <TransactionStats stats={stats} />

        {/* Filters and Actions Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, maxWidth: "750px" }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "14px", top: "12px" }}
              />
              <input
                type="text"
                placeholder="Search payer, accountant, receipt #, or flat..."
                className="form-input"
                style={{ paddingLeft: "42px" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Payment Method Quick Filter */}
            <select
              className="form-select"
              style={{ width: "170px" }}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">All Modes (Cash & UPI)</option>
              <option value="UPI">📱 UPI / Online</option>
              <option value="CASH">💵 Cash Only</option>
            </select>

            {/* Category Filter */}
            <select
              className="form-select"
              style={{ width: "190px" }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="MAINTENANCE">Monthly Maintenance</option>
              <option value="SECURITY_CHARGE">Security Charge</option>
              <option value="PENALTY">Late Penalty</option>
              <option value="EVENT">Society Event</option>
            </select>
          </form>

          {isStaff ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Plus size={18} />
              <span>Record Payment (Staff)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              style={{
                backgroundColor: "#4f46e5",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.3)",
              }}
            >
              <Receipt size={18} />
              <span>Pay My Maintenance Dues</span>
            </button>
          )}
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
            Loading transactions register...
          </div>
        ) : (
          <TransactionList transactions={transactions} />
        )}

        {/* Modal */}
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTransaction}
          flats={flats}
        />
      </div>
    </DashboardShell>
  );
}
