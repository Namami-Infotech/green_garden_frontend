"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  Check,
  Banknote,
  Smartphone,
  Receipt,
  Calendar,
  AlertCircle,
  User,
  Home,
  Search,
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react";
import { CreateTransactionData, PaymentMethod, TransactionItem } from "../types/index";
import { FlatItem } from "../../flats/types/index";
import { useAuth } from "../../../hooks/use-auth";
import { settingService } from "../../settings/services/setting.service";
import { transactionService } from "../services/transaction.service";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  flats: FlatItem[];
  onSubmit: (data: CreateTransactionData) => Promise<void>;
  initialFlatId?: number;
  initialPayerName?: string;
  initialPayerId?: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Month parser helper
export const parseMonthYear = (str: string): number => {
  if (!str) return 0;
  const parts = str.trim().split(" ");
  if (parts.length < 2) return 0;
  const mIndex = MONTH_NAMES.indexOf(parts[0]);
  const year = parseInt(parts[1], 10) || 0;
  return year * 12 + (mIndex >= 0 ? mIndex : 0);
};

// Format month integer to "Month Year" string
export const formatMonthYear = (val: number): string => {
  const year = Math.floor(val / 12);
  const mIndex = val % 12;
  return `${MONTH_NAMES[mIndex]} ${year}`;
};

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  flats,
  initialFlatId,
  initialPayerName,
  initialPayerId,
}: TransactionModalProps) {
  const { user } = useAuth();
  const isResident = user?.role === "USER";

  // Society dues settings
  const [monthlyDuePerUnit, setMonthlyDuePerUnit] = useState<number>(4000);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

  // User / Flat Selection & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFlatId, setSelectedFlatId] = useState<number | null>(null);
  const [payerName, setPayerName] = useState("");
  const [payerId, setPayerId] = useState<number | undefined>(undefined);
  const [showDropdown, setShowDropdown] = useState(false);

  // Number of months to pay
  const [monthCount, setMonthCount] = useState<number>(1);
  const [customMonthInput, setCustomMonthInput] = useState<string>("1");

  // Payment method: UPI vs CASH
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Previous transactions list for calculating last paid month
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  // General form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Load Settings (Base rate + security fund)
  useEffect(() => {
    if (!isOpen) return;
    async function loadConfigAndTxns() {
      try {
        setLoadingSettings(true);
        const [config, txns] = await Promise.all([
          settingService.getSettings(),
          transactionService.getTransactions().catch(() => []),
        ]);
        const base = Number(config.monthlyMaintenanceRate) || 3500;
        const sec = Number(config.monthlySecurityCharge) || 500;
        setMonthlyDuePerUnit(base + sec);
        setRecentTransactions(txns);
      } catch (err) {
        console.error("Failed to load settings or transactions", err);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadConfigAndTxns();
  }, [isOpen]);

  // 2. Initialize Selection
  useEffect(() => {
    if (!isOpen) return;

    if (isResident && user) {
      setPayerName(user.name);
      setPayerId(user.id);
      const userFlat = flats.find(
        (f) =>
          f.residentId === user.id ||
          f.ownerId === user.id ||
          f.residentName?.toLowerCase() === user.name.toLowerCase() ||
          f.ownerName?.toLowerCase() === user.name.toLowerCase()
      );
      if (initialFlatId) {
        setSelectedFlatId(initialFlatId);
      } else if (userFlat) {
        setSelectedFlatId(userFlat.id);
      }
      setSearchTerm(userFlat ? `Unit ${userFlat.flatNumber} - ${user.name}` : user.name);
    } else {
      if (initialFlatId) {
        setSelectedFlatId(initialFlatId);
        const found = flats.find((f) => f.id === initialFlatId);
        const name = initialPayerName || found?.residentName || found?.ownerName || "";
        setPayerName(name);
        setPayerId(initialPayerId || found?.residentId || found?.ownerId || undefined);
        setSearchTerm(found ? `Unit ${found.flatNumber} - ${name || "Unassigned"}` : name);
      } else if (initialPayerName) {
        const found = flats.find(
          (f) =>
            (initialPayerId && (f.residentId === initialPayerId || f.ownerId === initialPayerId)) ||
            (f.residentName && f.residentName.trim().toLowerCase() === initialPayerName.trim().toLowerCase()) ||
            (f.ownerName && f.ownerName.trim().toLowerCase() === initialPayerName.trim().toLowerCase())
        );
        if (found) {
          setSelectedFlatId(found.id);
          setPayerName(initialPayerName);
          setPayerId(initialPayerId || found.residentId || found.ownerId || undefined);
          setSearchTerm(`Unit ${found.flatNumber} - ${initialPayerName}`);
        } else {
          setSelectedFlatId(null);
          setPayerName(initialPayerName);
          setPayerId(initialPayerId);
          setSearchTerm(initialPayerName);
        }
      } else {
        setSelectedFlatId(null);
        setPayerName("");
        setPayerId(undefined);
        setSearchTerm("");
      }
    }
    setMonthCount(1);
    setCustomMonthInput("1");
    setError(null);
    setReferenceNumber("");
  }, [isOpen, initialFlatId, initialPayerName, initialPayerId, flats, isResident, user]);

  // Build searchable items list (from Flats & residents/owners)
  const searchableUnits = useMemo(() => {
    return flats.map((flat) => {
      const resident = flat.residentName?.trim();
      const owner = flat.ownerName?.trim();
      const unitLabel = `${flat.blockName ? `${flat.blockName} ` : ""}Unit ${flat.flatNumber}`;
      const primaryName = resident || owner || "Unassigned Resident";
      const secondaryInfo = resident && owner && resident !== owner ? `(Owner: ${owner})` : "";
      return {
        flatId: flat.id,
        flatNumber: flat.flatNumber,
        blockName: flat.blockName,
        payerName: primaryName,
        payerId: flat.residentId || flat.ownerId || undefined,
        displayLabel: `${unitLabel} — ${primaryName} ${secondaryInfo}`.trim(),
        searchText: `${unitLabel} ${primaryName} ${owner || ""} ${flat.flatNumber}`.toLowerCase(),
      };
    });
  }, [flats]);

  const filteredUnits = useMemo(() => {
    if (!searchTerm.trim()) return searchableUnits;
    const term = searchTerm.toLowerCase();
    return searchableUnits.filter((u) => u.searchText.includes(term));
  }, [searchableUnits, searchTerm]);

  // Determine the Last Paid Month for the currently selected flat / payer
  const lastPaidMonthInfo = useMemo(() => {
    if (!selectedFlatId && !payerName.trim()) {
      return null;
    }

    // Filter successful transactions for this flat or payer
    const userTxns = recentTransactions.filter((t) => {
      const matchFlat = selectedFlatId && t.flatId === selectedFlatId;
      const matchPayer =
        (payerId && t.payerId === payerId) ||
        (payerName && t.payerName.toLowerCase() === payerName.toLowerCase());
      return (matchFlat || matchPayer) && t.status === "SUCCESS";
    });

    if (userTxns.length === 0) {
      return null;
    }

    // Find the highest toMonth (or fromMonth / billingMonth)
    let maxMonthVal = 0;
    let maxMonthStr = "";

    for (const txn of userTxns) {
      const targetStr = txn.toMonth || txn.fromMonth || txn.billingMonth;
      if (targetStr) {
        const val = parseMonthYear(targetStr);
        if (val > maxMonthVal) {
          maxMonthVal = val;
          maxMonthStr = targetStr;
        }
      }
    }

    return maxMonthVal > 0 ? { val: maxMonthVal, str: maxMonthStr } : null;
  }, [selectedFlatId, payerName, payerId, recentTransactions]);

  // Compute From Month and To Month based on last paid month and monthCount
  const { startMonthStr, endMonthStr, currentMonthVal } = useMemo(() => {
    const now = new Date();
    const currentVal = now.getFullYear() * 12 + now.getMonth();

    let startVal: number;
    if (lastPaidMonthInfo) {
      // Agle month se shuru hoga
      startVal = lastPaidMonthInfo.val + 1;
    } else {
      // Pehla transaction hai -> Current month se shuru
      startVal = currentVal;
    }

    const count = Math.max(1, monthCount);
    const endVal = startVal + count - 1;

    return {
      startMonthVal: startVal,
      endMonthVal: endVal,
      startMonthStr: formatMonthYear(startVal),
      endMonthStr: formatMonthYear(endVal),
      currentMonthVal: currentVal,
    };
  }, [lastPaidMonthInfo, monthCount]);

  // Total amount to pay
  const totalAmountToPay = monthlyDuePerUnit * Math.max(1, monthCount);

  // Handle month count selection (e.g. 1, 3, 6, 12, or custom)
  const handleSelectMonthCount = (count: number) => {
    setMonthCount(count);
    setCustomMonthInput(String(count));
  };

  const handleCustomMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomMonthInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setMonthCount(num);
    }
  };

  const handleSelectUnit = (unit: typeof searchableUnits[0]) => {
    setSelectedFlatId(unit.flatId);
    setPayerName(unit.payerName);
    setPayerId(unit.payerId);
    setSearchTerm(unit.displayLabel);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!payerName.trim()) {
      setError("Please select a User / Flat.");
      return;
    }

    if (monthCount < 1) {
      setError("Please select at least 1 month duration.");
      return;
    }

    setLoading(true);
    try {
      const billingPeriodLabel =
        startMonthStr === endMonthStr ? startMonthStr : `${startMonthStr} to ${endMonthStr}`;
      
      const payload: CreateTransactionData = {
        payerName: payerName.trim(),
        payerId: payerId,
        flatId: selectedFlatId || undefined,
        amount: totalAmountToPay.toFixed(2),
        transactionType: "MAINTENANCE",
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        paymentDate: new Date().toISOString(),
        notes: `Paid for ${monthCount} month(s) [${billingPeriodLabel}] via ${paymentMethod}`,
        billingMonth: billingPeriodLabel,
        fromMonth: startMonthStr,
        toMonth: endMonthStr,
        paymentPlan: "FULL",
        balanceRemaining: "0.00",
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: isResident
                  ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                  : "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isResident ? <User size={20} color="#ffffff" /> : <Receipt size={20} color="#ffffff" />}
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {isResident ? "Pay Society Maintenance" : "Collect / Record Payment"}
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Monthly Rate: <strong>₹{monthlyDuePerUnit.toLocaleString("en-IN")}</strong> / month
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. SELECT USER / FLAT DROPDOWN FIELD */}
          <div className="form-group" style={{ margin: 0 }}>
            <label
              htmlFor="txn-select-unit"
              className="form-label"
              style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Home size={15} color="#059669" />
              Select User / Flat Unit *
            </label>
            <select
              id="txn-select-unit"
              className="form-select"
              value={selectedFlatId ? String(selectedFlatId) : ""}
              disabled={isResident}
              onChange={(e) => {
                const idNum = Number(e.target.value);
                const found = searchableUnits.find((u) => u.flatId === idNum);
                if (found) {
                  setSelectedFlatId(found.flatId);
                  setPayerName(found.payerName);
                  setPayerId(found.payerId);
                  setSearchTerm(found.displayLabel);
                } else {
                  setSelectedFlatId(null);
                  setPayerName("");
                  setPayerId(undefined);
                  setSearchTerm("");
                }
              }}
              required
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                padding: "10px 14px",
                borderColor: "#cbd5e1",
                backgroundColor: isResident ? "#f8fafc" : "#ffffff",
                cursor: isResident ? "not-allowed" : "pointer",
              }}
            >
              <option value="">-- Choose Flat Unit / Resident --</option>
              {searchableUnits.map((u) => (
                <option key={u.flatId} value={u.flatId}>
                  {u.displayLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Previous History Banner (Purane transaction ke bad se calculation) */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={15} color="#6366f1" />
              <span style={{ color: "#475569" }}>
                Last Paid Month:{" "}
                <strong style={{ color: lastPaidMonthInfo ? "#059669" : "#64748b" }}>
                  {lastPaidMonthInfo ? lastPaidMonthInfo.str : "None (Starting from Current Month)"}
                </strong>
              </span>
            </div>
          </div>

          {/* 2. NUMBER OF MONTHS SELECTOR (1 to 12 Months Dropdown) */}
          <div className="form-group" style={{ margin: 0 }}>
            <label
              htmlFor="month-count-select"
              className="form-label"
              style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Calendar size={15} color="#059669" />
              Select Number of Months (1 to 12) *
            </label>
            <select
              id="month-count-select"
              className="form-select"
              value={monthCount}
              onChange={(e) => handleSelectMonthCount(Number(e.target.value))}
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                padding: "10px 14px",
                borderColor: "#cbd5e1",
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? "Month" : "Months"}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Billing Range & Amount Calculated Display */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
              border: "1px solid #a7f3d0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "0.725rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>
                Payment Covering ({monthCount} {monthCount === 1 ? "Month" : "Months"})
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                {startMonthStr === endMonthStr ? (
                  startMonthStr
                ) : (
                  <span>
                    {startMonthStr} <span style={{ color: "#059669" }}>→</span> {endMonthStr}
                  </span>
                )}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.7rem", color: "#047857", fontWeight: 600 }}>Total Payable</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#065f46" }}>
                ₹{totalAmountToPay.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* 3. PAYMENT MODE (ONLINE / UPI vs CASH) */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>
              Payment Mode *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "11px",
                  borderRadius: "10px",
                  border: paymentMethod === "UPI" ? "2px solid #6366f1" : "1px solid #cbd5e1",
                  backgroundColor: paymentMethod === "UPI" ? "rgba(99, 102, 241, 0.08)" : "#ffffff",
                  color: paymentMethod === "UPI" ? "#4f46e5" : "#334155",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Smartphone size={16} />
                <span>UPI / QR / Online</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "11px",
                  borderRadius: "10px",
                  border: paymentMethod === "CASH" ? "2px solid #10b981" : "1px solid #cbd5e1",
                  backgroundColor: paymentMethod === "CASH" ? "rgba(16, 185, 129, 0.08)" : "#ffffff",
                  color: paymentMethod === "CASH" ? "#059669" : "#334155",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Banknote size={16} />
                <span>Cash Payment</span>
              </button>
            </div>
          </div>

          {/* Optional Reference / UTR Number for Online / Cash receipt */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "0.8rem" }}>
              {paymentMethod === "UPI" ? "UPI Ref / UTR Number (Optional)" : "Cash Receipt Book No. (Optional)"}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={paymentMethod === "UPI" ? "e.g. UPI/893710245" : "e.g. BOOK-04/RCP-12"}
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          {/* Submit Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !payerName.trim()}>
              <Check size={18} />
              {loading
                ? "Processing..."
                : `Confirm Payment (₹${totalAmountToPay.toLocaleString("en-IN")})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
