"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Check,
  Banknote,
  Smartphone,
  Receipt,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  PieChart,
  User,
  Home,
} from "lucide-react";
import { CreateTransactionData, PaymentMethod, TransactionType } from "../types/index";
import { transactionFormValidationSchema } from "../validations/index";
import { FlatItem } from "../../flats/types/index";
import { useAuth } from "../../../hooks/use-auth";
import { settingService } from "../../settings/services/setting.service";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionData) => Promise<void>;
  flats: FlatItem[];
  initialFlatId?: number;
  initialPayerName?: string;
  initialPayerId?: number;
}

// Parse month string like "September 2026" into a comparable integer (year * 12 + monthIndex)
export const parseMonthYear = (str: string): number => {
  if (!str) return 0;
  const parts = str.trim().split(" ");
  if (parts.length < 2) return 0;
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const mIndex = monthNames.indexOf(parts[0]);
  const year = parseInt(parts[1], 10) || 0;
  return year * 12 + (mIndex >= 0 ? mIndex : 0);
};

// Generate months list for current year
const generateMonthsList = () => {
  const currentYear = new Date().getFullYear();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return monthNames.map((m) => `${m} ${currentYear}`);
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

  // Settings charges
  const [baseMaintenanceRate, setBaseMaintenanceRate] = useState<number>(3500);
  const [securityChargeRate, setSecurityChargeRate] = useState<number>(500);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

  // Form states
  const [payerName, setPayerName] = useState("");
  const [flatId, setFlatId] = useState<string>("");

  // Billing Month selection (har month option)
  const availableMonths = generateMonthsList();
  const defaultCurrentMonth = () => {
    const d = new Date();
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(d);
  };
  const [fromMonth, setFromMonth] = useState<string>(defaultCurrentMonth());
  const [toMonth, setToMonth] = useState<string>(defaultCurrentMonth());

  // Enforce From Month <= To Month (To Month can never be less than From Month)
  const handleFromMonthChange = (val: string) => {
    setFromMonth(val);
    if (parseMonthYear(toMonth) < parseMonthYear(val)) {
      setToMonth(val);
    }
  };

  const handleToMonthChange = (val: string) => {
    if (parseMonthYear(val) >= parseMonthYear(fromMonth)) {
      setToMonth(val);
    } else {
      setToMonth(fromMonth);
    }
  };

  const numMonths = Math.max(1, parseMonthYear(toMonth) - parseMonthYear(fromMonth) + 1);

  // Payment Plan: FULL vs PARTIAL
  const [paymentPlan, setPaymentPlan] = useState<"FULL" | "PARTIAL">("FULL");
  const [amount, setAmount] = useState<string>("4000");

  const [transactionType, setTransactionType] = useState<TransactionType>("MAINTENANCE");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Total monthly due from Settings
  const totalMonthlyDue = (baseMaintenanceRate + securityChargeRate) * numMonths;

  // Filter flats if resident
  const userFlats = isResident && user
    ? flats.filter(
        (f) =>
          (user.id && (f.residentId === user.id || f.ownerId === user.id)) ||
          (user.name &&
            (f.residentName?.toLowerCase() === user.name.toLowerCase() ||
              f.ownerName?.toLowerCase() === user.name.toLowerCase()))
      )
    : [];

  const effectiveFlats = isResident && userFlats.length > 0 ? userFlats : flats;

  // Load society settings charges
  useEffect(() => {
    if (!isOpen) return;
    async function loadConfig() {
      try {
        setLoadingSettings(true);
        const config = await settingService.getSettings();
        const base = Number(config.monthlyMaintenanceRate) || 3500;
        const sec = Number(config.monthlySecurityCharge) || 500;
        setBaseMaintenanceRate(base);
        setSecurityChargeRate(sec);

        // If Full pay is selected, default amount to full total due
        const total = (base + sec) * numMonths;
        if (paymentPlan === "FULL") {
          setAmount(String(total));
        }
      } catch (err) {
        console.error("Failed to load settings in transaction modal", err);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadConfig();
  }, [isOpen]);

  // Keep amount synchronized when months change and payment plan is FULL
  useEffect(() => {
    if (paymentPlan === "FULL") {
      setAmount(String(totalMonthlyDue));
    }
  }, [totalMonthlyDue, paymentPlan]);

  // Handle initialization of flat & payer when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (isResident && user) {
      setPayerName(user.name);
      if (initialFlatId) {
        setFlatId(String(initialFlatId));
      } else if (userFlats.length > 0) {
        setFlatId(String(userFlats[0].id));
      }
    } else {
      if (initialPayerName) {
        setPayerName(initialPayerName);
      }
      if (initialFlatId) {
        handleFlatSelect(String(initialFlatId));
      }
    }
  }, [isOpen, initialFlatId, initialPayerName, flats, isResident, user]);

  const handleFlatSelect = (idStr: string) => {
    setFlatId(idStr);
    if (!isResident && idStr) {
      const flat = flats.find((f) => f.id === Number(idStr));
      if (flat) {
        if (flat.residentName) {
          setPayerName(flat.residentName);
        } else if (flat.ownerName) {
          setPayerName(flat.ownerName);
        }
      }
    }
  };

  const handleSelectFullPay = () => {
    setPaymentPlan("FULL");
    setAmount(String(totalMonthlyDue));
  };

  const handleSelectPartialPay = () => {
    setPaymentPlan("PARTIAL");
    if (Number(amount) >= totalMonthlyDue) {
      setAmount(String(Math.round(totalMonthlyDue / 2)));
    }
  };

  const parsedAmount = Math.max(0, Number(amount) || 0);
  const remainingBalance = paymentPlan === "FULL"
    ? 0
    : Math.max(0, totalMonthlyDue - parsedAmount);
  const percentPaid = totalMonthlyDue > 0
    ? Math.min(100, Math.round((parsedAmount / totalMonthlyDue) * 100))
    : 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formattedAmount = parsedAmount.toFixed(2);
    if (parsedAmount <= 0) {
      setError("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    if (parseMonthYear(fromMonth) > parseMonthYear(toMonth)) {
      setError("From Month must be less than or equal to To Month.");
      return;
    }

    const billingPeriodLabel = fromMonth === toMonth ? fromMonth : `${fromMonth} to ${toMonth}`;
    // Prepare note description
    const planLabel = paymentPlan === "FULL"
      ? `Full Payment (100% Cleared for ${billingPeriodLabel})`
      : `Partial Payment for ${billingPeriodLabel} (₹${remainingBalance.toLocaleString("en-IN")} pending)`;
    
    const combinedNotes = notes.trim()
      ? `${notes.trim()} | ${planLabel}`
      : planLabel;

    const payload: CreateTransactionData = {
      payerName: (isResident && user ? user.name : payerName).trim(),
      payerId: isResident && user ? user.id : undefined,
      flatId: flatId ? Number(flatId) : undefined,
      amount: formattedAmount,
      transactionType,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      paymentDate: new Date(paymentDate).toISOString(),
      notes: combinedNotes,
      billingMonth: fromMonth === toMonth ? fromMonth : `${fromMonth} - ${toMonth}`,
      fromMonth,
      toMonth,
      paymentPlan,
      balanceRemaining: remainingBalance.toFixed(2),
    };

    const validation = transactionFormValidationSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to record transaction");
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
          maxWidth: "600px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          maxHeight: "92vh",
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
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
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
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                {isResident ? "Pay My Monthly  Dues" : "Record / Collect Payment Receipt"}
              </h3>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: isResident ? "#4f46e5" : "#059669",
                  fontWeight: 600,
                }}
              >
                {isResident
                  ? `Resident Self-Payment Portal (${user?.name})`
                  : `Staff Session: ${user?.name || "Accountant"} (${user?.role || "Staff"})`}
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

          {/* Dynamic Settings Rates Banner */}
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
              border: "1px solid #a7f3d0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#065f46" }}>
                ⚙️ Society Configured Monthly Dues (Settings)
              </div>
              <div style={{ fontSize: "0.75rem", color: "#047857", marginTop: "2px" }}>
                Base Maintenance: <strong>₹{baseMaintenanceRate}</strong> + Security Fund: <strong>₹{securityChargeRate}</strong>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.7rem", color: "#047857", fontWeight: 600 }}>Total Due / Month</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#065f46" }}>
                ₹{totalMonthlyDue.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Month Selector ("Har Month Pay Krne Ka Option") */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-from-month">
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Calendar size={14} color="#059669" />
                  From Month *
                </span>
              </label>
              <select
                id="txn-from-month"
                className="form-select"
                value={fromMonth}
                onChange={(e) => handleFromMonthChange(e.target.value)}
                required
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m} {m === defaultCurrentMonth() ? "(Current Month)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-to-month">
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Calendar size={14} color="#059669" />
                  To Month *
                </span>
              </label>
              <select
                id="txn-to-month"
                className="form-select"
                value={toMonth}
                onChange={(e) => handleToMonthChange(e.target.value)}
                required
              >
                {availableMonths.map((m) => {
                  const isPrior = parseMonthYear(m) < parseMonthYear(fromMonth);
                  return (
                    <option key={m} value={m} disabled={isPrior}>
                      {m} {m === defaultCurrentMonth() ? "(Current Month)" : ""} {isPrior ? "(Earlier than From Month)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-cat">Payment Category</label>
              <select
                id="txn-cat"
                className="form-select"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as TransactionType)}
              >
                <option value="MAINTENANCE">Monthly Maintenance</option>
                <option value="SECURITY_CHARGE">Security Charge</option>
                <option value="PENALTY">Late Payment Penalty</option>
                <option value="EVENT">Festival / Society Event</option>
                <option value="WATER">Water Dues</option>
                <option value="OTHER">Other Expense</option>
              </select>
            </div>
              <button
                type="button"
                onClick={handleSelectFullPay}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: paymentPlan === "FULL" ? "2px solid #059669" : "1px solid var(--border-color)",
                  backgroundColor: paymentPlan === "FULL" ? "rgba(16, 185, 129, 0.1)" : "#ffffff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#065f46" }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>🟢 Fully Pay (Full ₹{totalMonthlyDue})</span>
                  </div>
                  {paymentPlan === "FULL" && (
                    <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: "4px", background: "#10b981", color: "#fff", fontWeight: 700 }}>
                      SELECTED
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "0.725rem", color: "#047857" }}>
                  100% Cleared • ₹0 balance remaining
                </span>
              </button>

          </div>

          {/* Payment Plan: FULLY PAY vs PARTIAL PAY */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Payment Option *
            </label>
            <div className="form-grid-2">
              {/* Option 1: Fully Pay */}
              {/* <button
                type="button"
                onClick={handleSelectFullPay}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: paymentPlan === "FULL" ? "2px solid #059669" : "1px solid var(--border-color)",
                  backgroundColor: paymentPlan === "FULL" ? "rgba(16, 185, 129, 0.1)" : "#ffffff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#065f46" }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>🟢 Fully Pay (Full ₹{totalMonthlyDue})</span>
                  </div>
                  {paymentPlan === "FULL" && (
                    <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: "4px", background: "#10b981", color: "#fff", fontWeight: 700 }}>
                      SELECTED
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "0.725rem", color: "#047857" }}>
                  100% Cleared • ₹0 balance remaining
                </span>
              </button> */}

              {/* Option 2: Partial Pay */}
              {/* <button
                type="button"
                onClick={handleSelectPartialPay}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: paymentPlan === "PARTIAL" ? "2px solid #d97706" : "1px solid var(--border-color)",
                  backgroundColor: paymentPlan === "PARTIAL" ? "rgba(245, 158, 11, 0.1)" : "#ffffff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#92400e" }}>
                    <PieChart size={16} color="#d97706" />
                    <span>🟡 Partial Pay (Part Payment)</span>
                  </div>
                  {paymentPlan === "PARTIAL" && (
                    <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: "4px", background: "#f59e0b", color: "#fff", fontWeight: 700 }}>
                      SELECTED
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "0.725rem", color: "#b45309" }}>
                  Pay custom amount & track remaining due
                </span>
              </button> */}
            </div>
          </div>

          {/* Amount Input & Live Calculation Breakdown */}
          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid var(--border-color)",
            }}
          >
            <div className="form-grid-2" style={{ alignItems: "center" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="txn-amount" style={{ fontWeight: 600 }}>
                  Amount to Pay Now (INR) *
                </label>
                <input
                  id="txn-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 4000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Real-time Dues Status */}
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Monthly Status for {fromMonth === toMonth ? fromMonth : `${fromMonth} to ${toMonth}`}:
                </div>
                {paymentPlan === "FULL" ? (
                  <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontWeight: 700, fontSize: "0.9rem" }}>
                    <CheckCircle2 size={16} />
                    <span>Full Payment (₹0 Balance)</span>
                  </div>
                ) : (
                  <div style={{ marginTop: "4px" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: remainingBalance > 0 ? "#dc2626" : "#059669" }}>
                      Remaining Due: ₹{remainingBalance.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                      Covering {percentPaid}% of total ₹{totalMonthlyDue.toLocaleString("en-IN")}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Progress Bar for Partial Pay */}
            {paymentPlan === "PARTIAL" && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  <span>Paid: ₹{parsedAmount.toLocaleString("en-IN")} ({percentPaid}%)</span>
                  <span style={{ color: remainingBalance > 0 ? "#dc2626" : "#059669", fontWeight: 600 }}>
                    Pending: ₹{remainingBalance.toLocaleString("en-IN")}
                  </span>
                </div>
                <div style={{ width: "100%", height: "7px", borderRadius: "9999px", background: "#e2e8f0", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${percentPaid}%`,
                      background: percentPaid >= 100 ? "#10b981" : "linear-gradient(90deg, #f59e0b, #eab308)",
                      transition: "width 0.2s ease",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector (CASH vs UPI) */}
          <div className="form-group">
            <label className="form-label">Payment Mode *</label>
            <div className="form-grid-2">
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
                  border: paymentMethod === "UPI" ? "2px solid #6366f1" : "1px solid var(--border-color)",
                  backgroundColor: paymentMethod === "UPI" ? "rgba(99, 102, 241, 0.08)" : "#ffffff",
                  color: paymentMethod === "UPI" ? "#4f46e5" : "var(--text-primary)",
                  fontWeight: 700,
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
                  border: paymentMethod === "CASH" ? "2px solid #10b981" : "1px solid var(--border-color)",
                  backgroundColor: paymentMethod === "CASH" ? "rgba(16, 185, 129, 0.08)" : "#ffffff",
                  color: paymentMethod === "CASH" ? "#059669" : "var(--text-primary)",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Banknote size={16} />
                <span>Cash Payment</span>
              </button>
            </div>
          </div>

          {/* Associated Flat & Payer Name */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-flat">
                {isResident ? "Your Flat / Unit *" : "Select Flat / Unit"}
              </label>
              <select
                id="txn-flat"
                className="form-select"
                value={flatId}
                onChange={(e) => handleFlatSelect(e.target.value)}
                required={isResident}
              >
                {!isResident && <option value="">Direct Resident / Other</option>}
                {effectiveFlats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.blockName ? `${f.blockName} - ` : ""}Unit {f.flatNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-payer">
                {isResident ? "Resident Name (Self) *" : "Payer Name *"}
              </label>
              <input
                id="txn-payer"
                className="form-input"
                placeholder="e.g. Rajesh Malhotra"
                value={isResident && user ? user.name : payerName}
                onChange={(e) => setPayerName(e.target.value)}
                disabled={isResident}
                required
                style={{
                  backgroundColor: isResident ? "#f1f5f9" : "#ffffff",
                  cursor: isResident ? "not-allowed" : "text",
                }}
              />
            </div>
          </div>

          {/* Payment Date & Reference */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-date">Payment Date & Time *</label>
              <input
                id="txn-date"
                type="datetime-local"
                className="form-input"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-ref">
                {paymentMethod === "UPI" ? "UPI Ref / UTR Number" : "Cash Receipt Book No."}
              </label>
              <input
                id="txn-ref"
                className="form-input"
                placeholder={paymentMethod === "UPI" ? "e.g. UPI/883719024" : "e.g. BOOK-12/RCP-45"}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="txn-notes">Remarks / Notes (Optional)</label>
            <input
              id="txn-notes"
              className="form-input"
              placeholder={
                isResident
                  ? `Self payment for ${fromMonth === toMonth ? fromMonth : `${fromMonth} to ${toMonth}`}`
                  : `e.g. Paid at society office for ${fromMonth === toMonth ? fromMonth : `${fromMonth} to ${toMonth}`}`
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Check size={18} />
              {loading
                ? "Processing..."
                : isResident
                ? `Pay Now (₹${parsedAmount.toLocaleString("en-IN")})`
                : `Confirm & Save (₹${parsedAmount.toLocaleString("en-IN")})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
