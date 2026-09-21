"use client";

import React from "react";
import { Banknote, Smartphone, Receipt, UserCheck, Calendar } from "lucide-react";
import { TransactionItem } from "../types/index";
import { usePagination } from "../../../hooks/use-pagination";
import { Pagination } from "../../../components/Pagination";

interface TransactionListProps {
  transactions: TransactionItem[];
  pageSize?: number;
}

export function TransactionList({ transactions, pageSize = 10 }: TransactionListProps) {
  const { paginatedItems: paginatedTransactions, paginationProps } = usePagination(
    transactions,
    pageSize
  );

  if (transactions.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: "48px",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}
      >
        <Receipt size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
        <h3 style={{ fontSize: "1.1rem", color: "#0f172a", marginBottom: "6px" }}>No Transactions Found</h3>
        <p style={{ fontSize: "0.9rem" }}>No payment records match the selected search or filter criteria.</p>
      </div>
    );
  }

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getMethodBadge = (method: string, refNum?: string | null) => {
    if (method === "UPI") {
      return (
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "0.75rem",
              fontWeight: 700,
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              color: "#4f46e5",
              border: "1px solid rgba(99, 102, 241, 0.25)",
            }}
          >
            <Smartphone size={13} />
            UPI
          </span>
          {refNum && (
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px", fontFamily: "monospace" }}>
              {refNum}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 700,
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            color: "#059669",
            border: "1px solid rgba(16, 185, 129, 0.25)",
          }}
        >
          <Banknote size={13} />
          CASH
        </span>
        {refNum && (
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px", fontFamily: "monospace" }}>
            {refNum}
          </div>
        )}
      </div>
    );
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "SECURITY_CHARGE":
        return <span className="badge" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>Security Fund</span>;
      case "PENALTY":
        return <span className="badge" style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>Late Penalty</span>;
      case "EVENT":
        return <span className="badge" style={{ backgroundColor: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff" }}>Festival / Event</span>;
      default:
        return <span className="badge" style={{ backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }}>Maintenance</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ overflowX: "auto" }}>
      <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
            <th style={{ textAlign: "left", padding: "14px 18px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>
              Receipt #
            </th>
            <th style={{ textAlign: "left", padding: "14px 18px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>
              Payer (Resident / Flat)
            </th>
            <th style={{ textAlign: "left", padding: "14px 18px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>
              Month & Plan
            </th>
            <th style={{ textAlign: "left", padding: "14px 18px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>
              Accountant (Collector)
            </th>
            <th style={{ textAlign: "left", padding: "14px 18px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>
              Payment Mode
            </th>
            <th style={{ textAlign: "left", padding: "14px 18px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>
              Payment Date
            </th>
            <th style={{ textAlign: "left", padding: "14px 18px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>
              Category
            </th>
            <th style={{ textAlign: "right", padding: "14px 18px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedTransactions.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.15s" }}>
              {/* Receipt */}
              <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                  {t.receiptNumber}
                </div>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#059669",
                    backgroundColor: "#ecfdf5",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    display: "inline-block",
                    marginTop: "3px",
                  }}
                >
                  PAID & VERIFIED
                </span>
              </td>

              {/* Payer & Flat */}
              <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>
                  {t.payerName}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {t.flatNumber ? `${t.blockName ? t.blockName + " - " : ""}${t.flatNumber}` : "Direct Resident"}
                </div>
              </td>

              {/* Month & Plan */}
              <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#0f172a", fontSize: "0.825rem" }}>
                  <Calendar size={13} color="#059669" />
                  <span>{t.billingMonth || "Monthly Dues"}</span>
                </div>
                <div style={{ marginTop: "4px" }}>
                  {t.paymentPlan === "PARTIAL" ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "2px 7px",
                        borderRadius: "5px",
                        fontSize: "0.675rem",
                        fontWeight: 700,
                        backgroundColor: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fde68a",
                      }}
                    >
                      <span>Partial Pay</span>
                      {t.balanceRemaining && Number(t.balanceRemaining) > 0 && (
                        <span>(₹{Number(t.balanceRemaining).toLocaleString("en-IN")} due)</span>
                      )}
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "2px 7px",
                        borderRadius: "5px",
                        fontSize: "0.675rem",
                        fontWeight: 700,
                        backgroundColor: "#ecfdf5",
                        color: "#065f46",
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      <span>Full Pay</span>
                    </span>
                  )}
                </div>
              </td>

              {/* Accountant / Collector */}
              <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <UserCheck size={14} color="#059669" />
                  <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>
                    {t.accountantName || "Society Accountant"}
                  </span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "20px" }}>
                  {t.accountantEmail || "Verified Staff"}
                </div>
              </td>

              {/* Payment Mode: Cash vs UPI */}
              <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                {getMethodBadge(t.paymentMethod, t.referenceNumber)}
              </td>

              {/* Date */}
              <td style={{ padding: "16px 18px", verticalAlign: "middle" }} suppressHydrationWarning>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#334155", fontWeight: 500 }}>
                  <Calendar size={14} color="#64748b" />
                  <span suppressHydrationWarning>{formatDateTime(t.paymentDate)}</span>
                </div>
                {t.notes && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px", fontStyle: "italic", maxWidth: "260px" }}>
                    "{t.notes}"
                  </div>
                )}
              </td>

              {/* Category */}
              <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                {getCategoryBadge(t.transactionType)}
              </td>

              {/* Amount */}
              <td style={{ padding: "16px 18px", verticalAlign: "middle", textAlign: "right" }}>
                <span
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#059669",
                  }}
                >
                  ₹{parseFloat(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Common Pagination */}
      <Pagination {...paginationProps} itemLabel="transactions" />
    </div>
  );
}
