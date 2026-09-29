"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  Smartphone,
  Receipt,
  UserCheck,
  Calendar,
  ChevronDown,
  Layers,
} from "lucide-react";
import { TransactionItem, TransactionType } from "../types/index";
import { usePagination } from "../../../hooks/use-pagination";
import { Pagination } from "../../../components/Pagination";
import { useAuth } from "../../../hooks/use-auth";
import { transactionService } from "../services/transaction.service";

interface TransactionListProps {
  transactions: TransactionItem[];
  pageSize?: number;
  onTransactionUpdated?: (updated: TransactionItem) => void;
}

const CATEGORY_UPDATE_OPTIONS = [
  {
    type: "BOTH" as TransactionType,
    label: "Both (Base Maintenance + Security Charge)",
    notePrefix: "Base Maint & Security",
    color: "#059669",
    bg: "#ecfdf5",
  },
  {
    type: "MAINTENANCE" as TransactionType,
    label: "Base Maintenance Only",
    notePrefix: "Base Maint Only",
    color: "#059669",
    bg: "#ecfdf5",
  },
  {
    type: "SECURITY_CHARGE" as TransactionType,
    label: "Security Charge Only",
    notePrefix: "Security Charge Only",
    color: "#1d4ed8",
    bg: "#eff6ff",
  },
];

export function TransactionList({
  transactions,
  pageSize = 10,
  onTransactionUpdated,
}: TransactionListProps) {
  const { user } = useAuth();
  const canEdit = user?.role === "SECRETARY" || user?.role === "ACCOUNTANT";

  const [items, setItems] = useState<TransactionItem[]>(transactions);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    setItems(transactions);
  }, [transactions]);

  const { paginatedItems: paginatedTransactions, paginationProps } = usePagination(
    items,
    pageSize
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".category-dropdown-container")) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleUpdateCategory = async (
    txn: TransactionItem,
    newType: TransactionType,
    customNotePrefix?: string
  ) => {
    setUpdatingId(txn.id);
    setActiveDropdownId(null);
    try {
      let updatedNotes = txn.notes || "";
      if (customNotePrefix) {
        // Clean previous tag and prepend new note tag
        const cleaned = updatedNotes
          .replace(/^(Base Maint|Security Charge|Combined Maint & Security|Late Penalty|Festival \/ Event|Water Charges)[^;]*;?\s*/i, "")
          .trim();
        updatedNotes = cleaned ? `${customNotePrefix}; ${cleaned}` : customNotePrefix;
      }

      const res = await transactionService.updateTransaction(txn.id, {
        transactionType: newType,
        notes: updatedNotes,
      });

      if (res) {
        setItems((prev) => prev.map((t) => (t.id === res.id ? res : t)));
        onTransactionUpdated?.(res);
      }
    } catch (err) {
      console.error("Failed to update transaction category", err);
    } finally {
      setUpdatingId(null);
    }
  };

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

  const renderCategoryContent = (t: TransactionItem) => {
    const type = t.transactionType;
    const notes = (t.notes || "").toLowerCase();

    // Check if Base Maintenance is included
    const hasBase =
      notes.includes("base") ||
      (type === "MAINTENANCE" && !notes.includes("security charge only"));

    // Check if Security Charge is included
    const hasSecurity =
      type === "SECURITY_CHARGE" ||
      notes.includes("security") ||
      notes.includes("combined");

    // Both selected
    const isBoth =
      type === "BOTH" ||
      (hasBase && hasSecurity) ||
      (notes.includes("base") && notes.includes("security")) ||
      notes.includes("combined");

    const hasPenalty = notes.includes("late interest") || notes.includes("penalty");

    return (
      <div style={{ display: "inline-flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
          {isBoth ? (
            <>
              <span
                className="badge"
                style={{
                  backgroundColor: "#ecfdf5",
                  color: "#065f46",
                  border: "1px solid #a7f3d0",
                  fontSize: "0.72rem",
                  padding: "3px 8px",
                }}
              >
                Base Maintenance
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  fontSize: "0.72rem",
                  padding: "3px 8px",
                }}
              >
                Security Charge
              </span>
            </>
          ) : type === "SECURITY_CHARGE" || (hasSecurity && !hasBase) ? (
            <span
              className="badge"
              style={{
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                fontSize: "0.72rem",
                padding: "3px 8px",
              }}
            >
              Security Charge
            </span>
          ) : (
            <span
              className="badge"
              style={{
                backgroundColor: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #a7f3d0",
                fontSize: "0.72rem",
                padding: "3px 8px",
              }}
            >
              Base Maintenance
            </span>
          )}
        </div>

        {/* Late Interest indicator pill if applicable */}
        {hasPenalty && (
          <span
            className="badge"
            style={{
              backgroundColor: "#fffbeb",
              color: "#b45309",
              border: "1px solid #fde68a",
              fontSize: "0.68rem",
              padding: "2px 6px",
            }}
          >
            + Late Interest
          </span>
        )}
      </div>
    );
  };

  if (items.length === 0) {
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

  return (
    <div className="glass-panel" style={{ padding: 0, overflow: "visible" }}>
      <div className="table-scroll-wrapper" style={{ overflowX: "auto" }}>
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
                {t.fromMonth && t.toMonth && t.fromMonth !== t.toMonth ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 700, color: "#0f172a", fontSize: "0.8rem" }}>
                    <Calendar size={13} color="#059669" />
                    <span>{t.fromMonth}</span>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>→</span>
                    <span>{t.toMonth}</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#0f172a", fontSize: "0.825rem" }}>
                    <Calendar size={13} color="#059669" />
                    <span>{t.fromMonth || t.billingMonth || "Monthly Dues"}</span>
                  </div>
                )}
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
              </td>

              {/* Category (Interactive & Detailed) */}
              <td style={{ padding: "16px 18px", verticalAlign: "middle", position: "relative" }}>
                <div className="category-dropdown-container" style={{ position: "relative", display: "inline-block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {renderCategoryContent(t)}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setActiveDropdownId(activeDropdownId === t.id ? null : t.id)}
                        title="Change Category"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "3px 4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#94a3b8",
                          borderRadius: "4px",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#0f172a";
                          e.currentTarget.style.backgroundColor = "#f1f5f9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#94a3b8";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    )}
                  </div>

                  {/* Quick Category Update Dropdown for Staff */}
                  {activeDropdownId === t.id && (
                    <div
                      className="animate-fade-in"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        zIndex: 60,
                        minWidth: "245px",
                        backgroundColor: "#ffffff",
                        borderRadius: "10px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        border: "1px solid #e2e8f0",
                        padding: "6px",
                        marginTop: "4px",
                      }}
                    >
                      <div
                        style={{
                          padding: "6px 8px 4px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#64748b",
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Layers size={12} color="#059669" />
                        <span>Update Category</span>
                      </div>
                      {CATEGORY_UPDATE_OPTIONS.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleUpdateCategory(t, opt.type, opt.notePrefix)}
                          disabled={updatingId === t.id}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "7px 10px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#1e293b",
                            transition: "background 0.1s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: opt.color,
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                            />
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
      </div>

      {/* Common Pagination */}
      <Pagination {...paginationProps} itemLabel="transactions" />
    </div>
  );
}
