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
  Clock,
  Percent,
  Shield,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
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

  // Society financial policy rates (from Settings)
  const [baseMaintenanceRate, setBaseMaintenanceRate] = useState<number>(500);
  const [securityChargeRate, setSecurityChargeRate] = useState<number>(600);
  const [latePaymentAnnualRate, setLatePaymentAnnualRate] = useState<number>(15);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

  // Selection options: Fee Components to include
  const [includeBaseMaintenance, setIncludeBaseMaintenance] = useState<boolean>(true);
  const [includeSecurityCharge, setIncludeSecurityCharge] = useState<boolean>(true);
  const [applyLateInterest, setApplyLateInterest] = useState<boolean>(true);

  // User / Flat Selection & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFlatId, setSelectedFlatId] = useState<number | null>(null);
  const [payerName, setPayerName] = useState("");
  const [payerId, setPayerId] = useState<number | undefined>(undefined);

  // Month Selection: custom start month (or null to use auto-recommended start month)
  const [customStartMonthVal, setCustomStartMonthVal] = useState<number | null>(null);
  const [monthCount, setMonthCount] = useState<number>(1);

  // Payment method: UPI vs CASH
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Previous transactions list for calculating last paid month
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);

  // General form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Load Settings (Base rate + security charge + late interest)
  useEffect(() => {
    if (!isOpen) return;
    async function loadConfigAndTxns() {
      try {
        setLoadingSettings(true);
        const [config, txns] = await Promise.all([
          settingService.getSettings(),
          transactionService.getTransactions().catch(() => []),
        ]);
        
        const base = Number(config.monthlyMaintenanceRate);
        const sec = Number(config.monthlySecurityCharge);
        const interest = Number(config.latePaymentPenaltyPercent);

        setBaseMaintenanceRate(!isNaN(base) && base >= 0 ? base : 500);
        setSecurityChargeRate(!isNaN(sec) && sec >= 0 ? sec : 600);
        setLatePaymentAnnualRate(!isNaN(interest) && interest >= 0 ? interest : 15);
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
    setCustomStartMonthVal(null);
    setIncludeBaseMaintenance(true);
    setIncludeSecurityCharge(true);
    setApplyLateInterest(true);
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

  // Current Month calculation
  const currentMonthVal = useMemo(() => {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth();
  }, []);

  // Recommended next month value
  const recommendedStartMonthVal = useMemo(() => {
    if (lastPaidMonthInfo) {
      return lastPaidMonthInfo.val + 1;
    }
    return currentMonthVal;
  }, [lastPaidMonthInfo, currentMonthVal]);

  // Active start month value (custom or recommended)
  const activeStartMonthVal = customStartMonthVal !== null ? customStartMonthVal : recommendedStartMonthVal;

  // Selected Billing Range
  const { startMonthStr, endMonthStr, endMonthVal } = useMemo(() => {
    const count = Math.max(1, monthCount);
    const endVal = activeStartMonthVal + count - 1;
    return {
      startMonthStr: formatMonthYear(activeStartMonthVal),
      endMonthStr: formatMonthYear(endVal),
      endMonthVal: endVal,
    };
  }, [activeStartMonthVal, monthCount]);

  // Monthly dues based on selected components
  const selectedMonthlyRate = useMemo(() => {
    let rate = 0;
    if (includeBaseMaintenance) rate += baseMaintenanceRate;
    if (includeSecurityCharge) rate += securityChargeRate;
    return rate;
  }, [includeBaseMaintenance, includeSecurityCharge, baseMaintenanceRate, securityChargeRate]);

  // Base and Security total amounts
  const baseSubtotal = (includeBaseMaintenance ? baseMaintenanceRate : 0) * monthCount;
  const securitySubtotal = (includeSecurityCharge ? securityChargeRate : 0) * monthCount;
  const principalTotal = baseSubtotal + securitySubtotal;

  // Overdue months and Late Interest calculation based on Policy Rate
  const { overdueMonthsCount, calculatedLateInterest, lateMonthsDetail } = useMemo(() => {
    let overdueCount = 0;
    let totalInterest = 0;
    const details: { monthStr: string; monthsLate: number; interest: number }[] = [];

    // Monthly interest factor = (Annual Interest % / 100) / 12
    const monthlyInterestRate = (latePaymentAnnualRate / 100) / 12;

    for (let i = 0; i < monthCount; i++) {
      const mVal = activeStartMonthVal + i;
      if (mVal < currentMonthVal) {
        const monthsLate = currentMonthVal - mVal;
        overdueCount++;
        // Interest on selected monthly dues for this overdue month
        const monthInterest = selectedMonthlyRate * monthlyInterestRate * monthsLate;
        totalInterest += monthInterest;
        details.push({
          monthStr: formatMonthYear(mVal),
          monthsLate,
          interest: monthInterest,
        });
      }
    }

    return {
      overdueMonthsCount: overdueCount,
      calculatedLateInterest: Math.round(totalInterest * 100) / 100,
      lateMonthsDetail: details,
    };
  }, [activeStartMonthVal, monthCount, currentMonthVal, latePaymentAnnualRate, selectedMonthlyRate]);

  // Final total amount to pay
  const finalPayableAmount = useMemo(() => {
    const interestToAdd = applyLateInterest ? calculatedLateInterest : 0;
    return principalTotal + interestToAdd;
  }, [principalTotal, applyLateInterest, calculatedLateInterest]);

  // Generate selectable start month options (last 24 months to next 12 months)
  const startMonthOptions = useMemo(() => {
    const list: { val: number; label: string }[] = [];
    const minVal = currentMonthVal - 24;
    const maxVal = currentMonthVal + 12;

    for (let v = minVal; v <= maxVal; v++) {
      const name = formatMonthYear(v);
      let tag = "";
      if (v === recommendedStartMonthVal) {
        tag = " — (Recommended / Next Due)";
      } else if (v === currentMonthVal) {
        tag = " — (Current Month)";
      } else if (v < currentMonthVal) {
        const diff = currentMonthVal - v;
        tag = ` — (${diff} mo overdue)`;
      }
      list.push({
        val: v,
        label: `${name}${tag}`,
      });
    }
    return list;
  }, [currentMonthVal, recommendedStartMonthVal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!payerName.trim()) {
      setError("Please select a User / Flat.");
      return;
    }

    if (!includeBaseMaintenance && !includeSecurityCharge) {
      setError("Please select at least one fee component (Base Maintenance or Security Charge).");
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
      
      // Determine transaction type
      let txnType: "MAINTENANCE" | "SECURITY_CHARGE" | "BOTH" = "MAINTENANCE";
      if (includeBaseMaintenance && includeSecurityCharge) {
        txnType = "BOTH";
      } else if (!includeBaseMaintenance && includeSecurityCharge) {
        txnType = "SECURITY_CHARGE";
      } else {
        txnType = "MAINTENANCE";
      }

      // Build descriptive notes
      const notesParts: string[] = [];
      if (includeBaseMaintenance) notesParts.push(`Base Maint: ₹${baseSubtotal}`);
      if (includeSecurityCharge) notesParts.push(`Security: ₹${securitySubtotal}`);
      if (applyLateInterest && calculatedLateInterest > 0) {
        notesParts.push(`Late Interest (${latePaymentAnnualRate}% p.a.): ₹${calculatedLateInterest.toFixed(2)}`);
      }

      const notes = `Paid for ${monthCount} mo [${billingPeriodLabel}] (${notesParts.join(", ")}) via ${paymentMethod}`;

      const payload: CreateTransactionData = {
        payerName: payerName.trim(),
        payerId: payerId,
        flatId: selectedFlatId || undefined,
        amount: finalPayableAmount.toFixed(2),
        transactionType: txnType,
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        paymentDate: new Date().toISOString(),
        notes: notes,
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
          maxWidth: "540px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
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
                Maintenance: <strong>₹{baseMaintenanceRate}</strong> | Security: <strong>₹{securityChargeRate}</strong> | Late Interest: <strong>{latePaymentAnnualRate}% p.a.</strong>
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
            gap: "16px",
            overflowY: "auto",
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
                  setCustomStartMonthVal(null);
                } else {
                  setSelectedFlatId(null);
                  setPayerName("");
                  setPayerId(undefined);
                  setSearchTerm("");
                  setCustomStartMonthVal(null);
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

          {/* Previous History Banner */}
          <div
            style={{
              padding: "8px 12px",
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
              <Clock size={14} color="#6366f1" />
              <span style={{ color: "#475569" }}>
                Last Paid Month:{" "}
                <strong style={{ color: lastPaidMonthInfo ? "#059669" : "#64748b" }}>
                  {lastPaidMonthInfo ? lastPaidMonthInfo.str : "None (Starting afresh)"}
                </strong>
              </span>
            </div>
            {lastPaidMonthInfo && (
              <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 600 }}>
                Next due: {formatMonthYear(lastPaidMonthInfo.val + 1)}
              </span>
            )}
          </div>

          {/* 2. SELECT FEE COMPONENTS (Base Maintenance, Security Charge) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
              <Layers size={15} color="#059669" />
              Select Fee Charges to Include *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {/* Base Maintenance Toggle */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: includeBaseMaintenance ? "2px solid #059669" : "1px solid #cbd5e1",
                  backgroundColor: includeBaseMaintenance ? "rgba(5, 150, 105, 0.05)" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  type="checkbox"
                  checked={includeBaseMaintenance}
                  onChange={(e) => setIncludeBaseMaintenance(e.target.checked)}
                  style={{ marginTop: "3px", width: "16px", height: "16px", cursor: "pointer", accentColor: "#059669" }}
                />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: includeBaseMaintenance ? "#065f46" : "#334155" }}>
                    Base Maintenance
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 700 }}>
                    ₹{baseMaintenanceRate.toLocaleString("en-IN")}<span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500 }}>/mo</span>
                  </div>
                </div>
              </label>

              {/* Security Charge Toggle */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: includeSecurityCharge ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                  backgroundColor: includeSecurityCharge ? "rgba(59, 130, 246, 0.05)" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  type="checkbox"
                  checked={includeSecurityCharge}
                  onChange={(e) => setIncludeSecurityCharge(e.target.checked)}
                  style={{ marginTop: "3px", width: "16px", height: "16px", cursor: "pointer", accentColor: "#3b82f6" }}
                />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: includeSecurityCharge ? "#1e40af" : "#334155" }}>
                    Security Charge
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700 }}>
                    ₹{securityChargeRate.toLocaleString("en-IN")}<span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500 }}>/mo</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 3. MONTH DURATION & STARTING MONTH SELECTOR */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label
                htmlFor="txn-start-month-select"
                className="form-label"
                style={{ fontWeight: 700, fontSize: "0.825rem", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Calendar size={14} color="#059669" />
                Start From Month *
              </label>
              <select
                id="txn-start-month-select"
                className="form-select"
                value={activeStartMonthVal}
                onChange={(e) => setCustomStartMonthVal(Number(e.target.value))}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  padding: "8px 10px",
                  borderColor: "#cbd5e1",
                }}
              >
                {startMonthOptions.map((opt) => (
                  <option key={opt.val} value={opt.val}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label
                htmlFor="month-count-select"
                className="form-label"
                style={{ fontWeight: 700, fontSize: "0.825rem", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Clock size={14} color="#059669" />
                Duration (Months) *
              </label>
              <select
                id="month-count-select"
                className="form-select"
                value={monthCount}
                onChange={(e) => setMonthCount(Number(e.target.value))}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  padding: "8px 10px",
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
          </div>

          {/* 4. LATE PAYMENT INTEREST POLICY SECTION */}
          {overdueMonthsCount > 0 ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={16} color="#d97706" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400e" }}>
                    Late Payment Detected ({overdueMonthsCount} overdue {overdueMonthsCount === 1 ? "month" : "months"})
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.725rem",
                    fontWeight: 700,
                    backgroundColor: "#fef3c7",
                    color: "#b45309",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {latePaymentAnnualRate}% p.a.
                </span>
              </div>

              <div style={{ fontSize: "0.785rem", color: "#78350f", lineHeight: "1.4" }}>
                Calculated according to Society Financial Policies ({latePaymentAnnualRate}% annual interest on overdue monthly dues).
              </div>

              {/* Late Interest Checkbox / Waiver toggle */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  border: "1px solid #fef08a",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={applyLateInterest}
                    onChange={(e) => setApplyLateInterest(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#d97706" }}
                  />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#451a03" }}>
                    Apply Late Payment Interest
                  </span>
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: applyLateInterest ? "#b45309" : "#94a3b8" }}>
                  +₹{calculatedLateInterest.toFixed(2)}
                </span>
              </label>
            </div>
          ) : (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.8rem",
                color: "#166534",
              }}
            >
              <CheckCircle2 size={15} color="#16a34a" />
              <span>
                <strong>On-Time / Advance Payment:</strong> No late payment interest applicable (0% penalty).
              </span>
            </div>
          )}

          {/* 5. DYNAMIC BILLING BREAKDOWN & TOTAL CALCULATION CARD */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
              border: "1px solid #a7f3d0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.725rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>
                  Billing Coverage ({monthCount} {monthCount === 1 ? "Month" : "Months"})
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
                <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#065f46" }}>
                  ₹{finalPayableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Itemized Breakdown */}
            <div
              style={{
                borderTop: "1px dashed #6ee7b7",
                paddingTop: "6px",
                marginTop: "2px",
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                fontSize: "0.75rem",
                color: "#047857",
              }}
            >
              {includeBaseMaintenance && (
                <span>
                  Base Maint: <strong>₹{baseSubtotal.toLocaleString("en-IN")}</strong>
                </span>
              )}
              {includeSecurityCharge && (
                <span>
                  Security: <strong>₹{securitySubtotal.toLocaleString("en-IN")}</strong>
                </span>
              )}
              {applyLateInterest && calculatedLateInterest > 0 && (
                <span style={{ color: "#b45309", fontWeight: 700 }}>
                  Late Interest: <strong>+₹{calculatedLateInterest.toFixed(2)}</strong>
                </span>
              )}
            </div>
          </div>

          {/* 6. PAYMENT MODE (ONLINE / UPI vs CASH) */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: "0.85rem" }}>
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
                  padding: "10px",
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
                  padding: "10px",
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !payerName.trim() || (!includeBaseMaintenance && !includeSecurityCharge)}
              style={{
                backgroundColor: "#059669",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 700,
              }}
            >
              <Check size={18} />
              {loading
                ? "Processing..."
                : `Confirm Payment (₹${finalPayableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

