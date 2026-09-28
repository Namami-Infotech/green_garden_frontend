"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Home,
  Users,
  IndianRupee,
  ShieldCheck,
  Receipt,
  Smartphone,
  Banknote,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ChevronRight,
  CreditCard,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  BarChart3,
  Droplets,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import { blockService } from "../../modules/blocks/services/block.service";
import { flatService } from "../../modules/flats/services/flat.service";
import { userService } from "../../modules/users/services/user.service";
import { settingService } from "../../modules/settings/services/setting.service";
import { transactionService } from "../../modules/transactions/services/transaction.service";
import {
  TransactionItem,
  CreateTransactionData,
  TransactionType,
} from "../../modules/transactions/types/index";
import { FlatItem } from "../../modules/flats/types/index";
import { BlockItem } from "../../modules/blocks/types/index";
import { UserItem } from "../../modules/users/types/index";
import { useAuth } from "../../hooks/use-auth";
import { TransactionModal } from "../../modules/transactions/components/TransactionModal";

interface PendingDueItem {
  flatId: number;
  flatNumber: string;
  blockName: string;
  payerName: string;
  payerId?: number;
  remainingAmount: number;
  type: "PARTIAL" | "PENDING";
}

// Category Configuration with English labels, colors and icons
const CATEGORIES: {
  key: TransactionType;
  label: string;
  color: string;
  gradient: string;
  bg: string;
  icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
}[] = [
  {
    key: "MAINTENANCE",
    label: "Monthly Maintenance",
    color: "#059669",
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    bg: "#ecfdf5",
    icon: Home,
  },
  {
    key: "SECURITY_CHARGE",
    label: "Security Charges",
    color: "#0284c7",
    gradient: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
    bg: "#f0f9ff",
    icon: ShieldCheck,
  },
  {
    key: "WATER",
    label: "Water Charges",
    color: "#0d9488",
    gradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
    bg: "#f0fdfa",
    icon: Droplets,
  },
  {
    key: "EVENT",
    label: "Society Events",
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    bg: "#f5f3ff",
    icon: Sparkles,
  },
  {
    key: "PENALTY",
    label: "Late Fees / Penalty",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
    bg: "#fffbeb",
    icon: AlertTriangle,
  },
  {
    key: "OTHER",
    label: "Other Utilities",
    color: "#64748b",
    gradient: "linear-gradient(135deg, #475569 0%, #94a3b8 100%)",
    bg: "#f8fafc",
    icon: Layers,
  },
];

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const isStaff = hasRole(["SECRETARY", "ACCOUNTANT"]);

  // Month Filter State: default to current year-month "YYYY-MM"
  const now = new Date();
  const defaultMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthStr);

  // Category Chart Scope: "MONTH" (selected month) or "ALL" (all-time)
  const [chartScope, setChartScope] = useState<"MONTH" | "ALL">("MONTH");

  const [stats, setStats] = useState({
    totalBlocks: 0,
    totalFlats: 0,
    occupiedFlats: 0,
    totalUsers: 0,
    maintenanceRate: 0,
    securityCharge: 0,
    societyName: "",
    visitorPassRequired: "false",
    quietHours: "",
  });

  const [blocksList, setBlocksList] = useState<BlockItem[]>([]);
  const [flatsList, setFlatsList] = useState<FlatItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [pendingDuesList, setPendingDuesList] = useState<PendingDueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for instant payment collection
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFlatId, setSelectedFlatId] = useState<number | undefined>();
  const [selectedPayerName, setSelectedPayerName] = useState<string | undefined>();
  const [selectedPayerId, setSelectedPayerId] = useState<number | undefined>();

  const monthlyTotalRate = stats.maintenanceRate + stats.securityCharge;

  // Generate list of available selectable months (past 12 months)
  const availableMonths = useMemo(() => {
    const months: { value: string; label: string }[] = [];
    const base = new Date();
    for (let i = -1; i <= 11; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const lbl = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      months.push({ value: val, label: lbl });
    }
    return months;
  }, []);

  const selectedMonthLabel = useMemo(() => {
    try {
      const [y, m] = selectedMonth.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  const loadDashboard = async () => {
    try {
      const [blocks, flatsRes, usersRes, settings, txns] = await Promise.all([
        blockService.getBlocks(),
        flatService.getFlats(),
        userService.getUsers(),
        settingService.getSettings(),
        transactionService.getTransactions(),
      ]);

      const occupied = flatsRes.flats.filter((f) => f.occupancyStatus !== "VACANT");

      setStats({
        totalBlocks: blocks.length,
        totalFlats: flatsRes.flats.length,
        occupiedFlats: occupied.length,
        totalUsers: usersRes.total || usersRes.users.length,
        maintenanceRate: Number(settings.monthlyMaintenanceRate) || 0,
        securityCharge: Number(settings.monthlySecurityCharge) || 0,
        societyName: settings.societyName || "Residential Society",
        visitorPassRequired: settings.visitorPassRequired || "false",
        quietHours: `${settings.quietHoursStart || "--:--"} - ${settings.quietHoursEnd || "--:--"}`,
      });

      setBlocksList(blocks);
      setFlatsList(flatsRes.flats);
      setUsersList(usersRes.users);
      setAllTransactions(txns);

      // Calculate Pending Dues List
      const totalMonthlyRate =
        (Number(settings.monthlyMaintenanceRate) || 0) +
        (Number(settings.monthlySecurityCharge) || 0);

      const duesAttention: PendingDueItem[] = [];

      occupied.forEach((flat) => {
        const residentUser = usersRes.users.find(
          (u) => u.id === flat.residentId || u.id === flat.ownerId
        );
        const residentName = residentUser?.name || flat.residentName || "Resident";

        const txn = txns.find((t) => {
          if (t.flatId && t.flatId === flat.id) return true;
          if (residentUser && t.payerId === residentUser.id) return true;
          if (t.payerName && residentName) {
            return t.payerName.trim().toLowerCase() === residentName.trim().toLowerCase();
          }
          return false;
        });

        if (txn) {
          const paidVal = parseFloat(txn.amount) || 0;
          const remVal = txn.balanceRemaining
            ? parseFloat(txn.balanceRemaining)
            : Math.max(0, totalMonthlyRate - paidVal);

          if (remVal > 0 || txn.paymentPlan === "PARTIAL") {
            duesAttention.push({
              flatId: flat.id,
              flatNumber: flat.flatNumber,
              blockName: flat.blockName || "Tower",
              payerName: residentName,
              payerId: residentUser?.id,
              remainingAmount: remVal,
              type: "PARTIAL",
            });
          }
        } else {
          duesAttention.push({
            flatId: flat.id,
            flatNumber: flat.flatNumber,
            blockName: flat.blockName || "Tower",
            payerName: residentName,
            payerId: residentUser?.id,
            remainingAmount: totalMonthlyRate,
            type: "PENDING",
          });
        }
      });

      setPendingDuesList(duesAttention);
    } catch (err) {
      console.error("Dashboard failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleOpenPayment = (flatId?: number, payerName?: string, payerId?: number) => {
    setSelectedFlatId(flatId);
    setSelectedPayerName(payerName);
    setSelectedPayerId(payerId);
    setIsModalOpen(true);
  };

  const handleCreateTransaction = async (data: CreateTransactionData) => {
    try {
      await transactionService.createTransaction(data);
      setIsModalOpen(false);
      await loadDashboard();
    } catch (e) {
      console.error("Failed to create transaction", e);
      throw e;
    }
  };

  // Helper: Extract "YYYY-MM" from transaction
  const getTxnMonth = (t: TransactionItem): string => {
    if (t.billingMonth) {
      const match = t.billingMonth.match(/(\d{4})-(\d{2})/);
      if (match) return `${match[1]}-${match[2]}`;
      const d = new Date(t.billingMonth);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }
    }
    const rawDate = t.paymentDate || t.createdAt;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }
    }
    return "";
  };

  // Helper: Check if transaction was made today
  const isTxnToday = (t: TransactionItem): boolean => {
    const rawDate = t.paymentDate || t.createdAt;
    if (!rawDate) return false;
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      const today = new Date();
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    } catch {
      return false;
    }
  };

  // 1. THIS MONTH METRICS (Filtered by selectedMonth)
  const monthFilteredTxns = useMemo(() => {
    return allTransactions.filter((t) => getTxnMonth(t) === selectedMonth);
  }, [allTransactions, selectedMonth]);

  const monthCash = useMemo(() => {
    return monthFilteredTxns
      .filter((t) => t.paymentMethod === "CASH")
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  }, [monthFilteredTxns]);

  const monthOnline = useMemo(() => {
    return monthFilteredTxns
      .filter((t) => t.paymentMethod !== "CASH")
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  }, [monthFilteredTxns]);

  const monthTotalCollection = monthCash + monthOnline;

  const monthCashPercent =
    monthTotalCollection > 0 ? Math.round((monthCash / monthTotalCollection) * 100) : 0;
  const monthOnlinePercent =
    monthTotalCollection > 0 ? Math.round((monthOnline / monthTotalCollection) * 100) : 0;

  // 2. TODAY COLLECTION METRICS
  const todayTxns = useMemo(() => {
    return allTransactions.filter(isTxnToday);
  }, [allTransactions]);

  const todayTotal = useMemo(() => {
    return todayTxns.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  }, [todayTxns]);

  const todayCash = useMemo(() => {
    return todayTxns
      .filter((t) => t.paymentMethod === "CASH")
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  }, [todayTxns]);

  const todayOnline = useMemo(() => {
    return todayTxns
      .filter((t) => t.paymentMethod !== "CASH")
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  }, [todayTxns]);

  // 3. PENDING AMOUNT FOR SELECTED MONTH
  const expectedMonthlyDues = useMemo(() => {
    const rate = monthlyTotalRate > 0 ? monthlyTotalRate : 4000;
    return stats.occupiedFlats * rate;
  }, [stats.occupiedFlats, monthlyTotalRate]);

  const monthMaintenanceCollected = useMemo(() => {
    return monthFilteredTxns
      .filter((t) => t.transactionType === "MAINTENANCE" || t.transactionType === "SECURITY_CHARGE")
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  }, [monthFilteredTxns]);

  const pendingAmountThisMonth = Math.max(0, expectedMonthlyDues - monthMaintenanceCollected);
  const collectionPercentThisMonth =
    expectedMonthlyDues > 0
      ? Math.min(100, Math.round((monthMaintenanceCollected / expectedMonthlyDues) * 100))
      : 0;

  // 4. CATEGORY BREAKDOWN STATS & GRAPH DATA (Base Monthly Maintenance + Security Charge Per Month)
  const categoryStats = useMemo(() => {
    const targetTxns = chartScope === "MONTH" ? monthFilteredTxns : allTransactions;

    // Rates configured in Society Settings
    const baseRate = stats.maintenanceRate > 0 ? stats.maintenanceRate : 3500;
    const secRate = stats.securityCharge > 0 ? stats.securityCharge : 500;
    const combinedRate = baseRate + secRate;

    const baseRatio = combinedRate > 0 ? baseRate / combinedRate : 0.875;
    const secRatio = combinedRate > 0 ? secRate / combinedRate : 0.125;

    let baseMaintenanceTotal = 0;
    let baseMaintenanceCount = 0;
    let securityChargeTotal = 0;
    let securityChargeCount = 0;

    const otherTotals: Record<string, { total: number; count: number }> = {};

    targetTxns.forEach((t) => {
      const amt = parseFloat(t.amount) || 0;
      const type = (t.transactionType as TransactionType) || "MAINTENANCE";

      if (type === "MAINTENANCE") {
        baseMaintenanceTotal += amt * baseRatio;
        baseMaintenanceCount += 1;
        securityChargeTotal += amt * secRatio;
        securityChargeCount += 1;
      } else if (type === "SECURITY_CHARGE") {
        securityChargeTotal += amt;
        securityChargeCount += 1;
      } else {
        if (!otherTotals[type]) {
          otherTotals[type] = { total: 0, count: 0 };
        }
        otherTotals[type].total += amt;
        otherTotals[type].count += 1;
      }
    });

    const grandTotal =
      baseMaintenanceTotal +
      securityChargeTotal +
      Object.values(otherTotals).reduce((acc, o) => acc + o.total, 0);

    const items: {
      key: string;
      label: string;
      total: number;
      count: number;
      percentage: number;
      color: string;
      gradient: string;
      bg: string;
      icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
    }[] = [];

    const baseTotalRounded = Math.round(baseMaintenanceTotal);
    const secTotalRounded = Math.round(securityChargeTotal);
    const basePct = grandTotal > 0 ? Math.round((baseMaintenanceTotal / grandTotal) * 100) : 0;
    const secPct = grandTotal > 0 ? Math.max(0, 100 - basePct) : 0;

    // 1. Base Monthly Maintenance
    items.push({
      key: "BASE_MAINTENANCE",
      label: "Base Monthly Maintenance",
      total: baseTotalRounded,
      count: baseMaintenanceCount,
      percentage: basePct,
      color: "#059669",
      gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
      bg: "#ecfdf5",
      icon: Home,
    });

    // 2. Security Charge Per Month
    items.push({
      key: "SECURITY_CHARGE",
      label: "Security Charge Per Month",
      total: secTotalRounded,
      count: securityChargeCount,
      percentage: secPct,
      color: "#0284c7",
      gradient: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
      bg: "#f0f9ff",
      icon: ShieldCheck,
    });

    // 3. Include any other category only if it has an actual collection > 0
    Object.entries(otherTotals).forEach(([type, data]) => {
      if (data.total > 0) {
        const catConfig = CATEGORIES.find((c) => c.key === type);
        items.push({
          key: type,
          label: catConfig?.label || type,
          total: Math.round(data.total),
          count: data.count,
          percentage: grandTotal > 0 ? Math.round((data.total / grandTotal) * 100) : 0,
          color: catConfig?.color || "#8b5cf6",
          gradient: catConfig?.gradient || "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
          bg: catConfig?.bg || "#f5f3ff",
          icon: catConfig?.icon || Layers,
        });
      }
    });

    items.sort((a, b) => b.total - a.total);
    const maxAmount = Math.max(...items.map((i) => i.total), 1);

    return {
      items,
      grandTotal: Math.round(grandTotal),
      maxAmount,
      baseTotalRounded,
      secTotalRounded,
      basePct,
      secPct,
      baseMaintenanceCount,
      securityChargeCount,
    };
  }, [monthFilteredTxns, allTransactions, chartScope, stats.maintenanceRate, stats.securityCharge]);

  // Overall Occupancy Rate
  const occupancyRate =
    stats.totalFlats > 0 ? Math.round((stats.occupiedFlats / stats.totalFlats) * 100) : 0;

  // Member role counts
  const residentsCount = usersList.filter((u) => u.role === "USER").length;
  const staffCount = usersList.filter((u) => u.role !== "USER").length;
  const totalFloorsCount = blocksList.reduce((acc, b) => acc + (b.totalFloors || 0), 0);

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <DashboardShell title="Green Place | Executive Community Dashboard">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* 1. EXECUTIVE HERO BANNER */}
        <div
          className="animate-fade-in"
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)",
            color: "#ffffff",
            padding: "22px 28px",
            boxShadow: "0 8px 24px -4px rgba(6, 78, 59, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.18)",
                    backdropFilter: "blur(8px)",
                    color: "#a7f3d0",
                    border: "1px solid rgba(167, 243, 208, 0.35)",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Sparkles size={13} color="#6ee7b7" />
                  <span>{stats.societyName}</span>
                </span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "rgba(255, 255, 255, 0.85)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Calendar size={14} color="#a7f3d0" />
                  <span>{todayFormatted}</span>
                </span>
              </div>

              <h1
                style={{
                  fontSize: "1.55rem",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.015em",
                  color: "#ffffff",
                }}
              >
                Welcome back, {user?.name || "Resident"}!
              </h1>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "0.85rem",
                  color: "rgba(255, 255, 255, 0.85)",
                }}
              >
                Society financial & operations overview for <strong>{selectedMonthLabel}</strong>
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {isStaff ? (
                <button
                  type="button"
                  onClick={() => handleOpenPayment()}
                  className="btn"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#065f46",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    boxShadow: "0 3px 12px rgba(0, 0, 0, 0.15)",
                    border: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Plus size={16} />
                  <span>Record Payment</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenPayment()}
                  className="btn"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#065f46",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    boxShadow: "0 3px 12px rgba(0, 0, 0, 0.15)",
                    border: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CreditCard size={16} />
                  <span>Pay My Dues</span>
                </button>
              )}

              <Link
                href="/transactions"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.16)",
                  backdropFilter: "blur(10px)",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  border: "1px solid rgba(255, 255, 255, 0.28)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Receipt size={16} />
                <span>Transactions</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. DYNAMIC MONTH FILTER CONTROL BAR */}
        <div
          className="glass-panel"
          style={{
            padding: "14px 20px",
            borderRadius: "14px",
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Filter size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a" }}>
                Month Filter
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                Selected cycle: <strong style={{ color: "#059669" }}>{selectedMonthLabel}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Quick Button: Current Month */}
            <button
              type="button"
              onClick={() => setSelectedMonth(defaultMonthStr)}
              className="btn btn-secondary"
              style={{
                fontSize: "0.775rem",
                padding: "6px 12px",
                fontWeight: selectedMonth === defaultMonthStr ? 700 : 500,
                backgroundColor: selectedMonth === defaultMonthStr ? "#ecfdf5" : undefined,
                color: selectedMonth === defaultMonthStr ? "#065f46" : undefined,
                borderColor: selectedMonth === defaultMonthStr ? "#a7f3d0" : undefined,
              }}
            >
              This Month
            </button>

            {/* Quick Button: Previous Month */}
            {availableMonths[1] && (
              <button
                type="button"
                onClick={() => setSelectedMonth(availableMonths[1].value)}
                className="btn btn-secondary"
                style={{
                  fontSize: "0.775rem",
                  padding: "6px 12px",
                  fontWeight: selectedMonth === availableMonths[1].value ? 700 : 500,
                  backgroundColor:
                    selectedMonth === availableMonths[1].value ? "#ecfdf5" : undefined,
                  color: selectedMonth === availableMonths[1].value ? "#065f46" : undefined,
                  borderColor:
                    selectedMonth === availableMonths[1].value ? "#a7f3d0" : undefined,
                }}
              >
                Previous Month
              </button>
            )}

            {/* Dropdown Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <select
                className="form-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  borderRadius: "8px",
                  minWidth: "170px",
                }}
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} {m.value === defaultMonthStr ? "(Current)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. KEY METRICS CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "18px",
          }}
        >
          {/* Card 1: THIS MONTH COLLECTION (WITH CASH & ONLINE BREAKDOWN) */}
          <div
            className="glass-panel"
            style={{
              padding: "18px 20px",
              borderRadius: "14px",
              background: "#ffffff",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  This Month Collection
                </span>
                <div
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 800,
                    color: "#059669",
                    marginTop: "2px",
                    lineHeight: 1.2,
                  }}
                >
                  ₹{monthTotalCollection.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Cycle: <strong>{selectedMonthLabel}</strong>
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#059669",
                  flexShrink: 0,
                }}
              >
                <IndianRupee size={20} />
              </div>
            </div>

            {/* Cash & Online Split Progress Bar */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  marginBottom: "5px",
                }}
              >
                <span style={{ color: "#059669", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Banknote size={13} />
                  Cash: ₹{monthCash.toLocaleString("en-IN")} ({monthCashPercent}%)
                </span>
                <span style={{ color: "#4f46e5", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Smartphone size={13} />
                  Online: ₹{monthOnline.toLocaleString("en-IN")} ({monthOnlinePercent}%)
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "7px",
                  background: "#f1f5f9",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${monthTotalCollection > 0 ? monthCashPercent : 0}%`,
                    background: "#10b981",
                    transition: "width 0.3s ease",
                  }}
                  title={`Cash: ₹${monthCash}`}
                />
                <div
                  style={{
                    height: "100%",
                    width: `${monthTotalCollection > 0 ? monthOnlinePercent : 0}%`,
                    background: "#6366f1",
                    transition: "width 0.3s ease",
                  }}
                  title={`Online: ₹${monthOnline}`}
                />
              </div>
            </div>

            <div
              style={{
                fontSize: "0.725rem",
                color: "var(--text-secondary)",
                paddingTop: "6px",
                borderTop: "1px dashed var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Total Transactions: <strong>{monthFilteredTxns.length}</strong></span>
              <span style={{ color: "#059669", fontWeight: 600 }}>Active Cycle</span>
            </div>
          </div>

          {/* Card 2: TODAY COLLECTION */}
          <div
            className="glass-panel"
            style={{
              padding: "18px 20px",
              borderRadius: "14px",
              background: "#ffffff",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Today&apos;s Collection
                </span>
                <div
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 800,
                    color: "#0284c7",
                    marginTop: "2px",
                    lineHeight: 1.2,
                  }}
                >
                  ₹{todayTotal.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {todayTxns.length} payment(s) recorded today
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#f0f9ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0284c7",
                  flexShrink: 0,
                }}
              >
                <Clock size={20} />
              </div>
            </div>

            {/* Today breakdown */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                background: "#f8fafc",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                justifyContent: "space-between",
                fontSize: "0.75rem",
              }}
            >
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "block" }}>Cash Today</span>
                <strong style={{ color: "#059669" }}>₹{todayCash.toLocaleString("en-IN")}</strong>
              </div>
              <div style={{ width: "1px", background: "var(--border-color)" }} />
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "block" }}>Online Today</span>
                <strong style={{ color: "#4f46e5" }}>₹{todayOnline.toLocaleString("en-IN")}</strong>
              </div>
              <div style={{ width: "1px", background: "var(--border-color)" }} />
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "block" }}>Count</span>
                <strong>{todayTxns.length}</strong>
              </div>
            </div>

            <div
              style={{
                fontSize: "0.725rem",
                color: "var(--text-secondary)",
                paddingTop: "6px",
                borderTop: "1px dashed var(--border-color)",
              }}
            >
              Real-time daily collection counter
            </div>
          </div>

          {/* Card 3: PENDING AMOUNT OF THIS MONTH */}
          <div
            className="glass-panel"
            style={{
              padding: "18px 20px",
              borderRadius: "14px",
              background: "#ffffff",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Pending Amount (This Month)
                </span>
                <div
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 800,
                    color: pendingAmountThisMonth > 0 ? "#dc2626" : "#059669",
                    marginTop: "2px",
                    lineHeight: 1.2,
                  }}
                >
                  ₹{pendingAmountThisMonth.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Expected: <strong>₹{expectedMonthlyDues.toLocaleString("en-IN")}</strong>
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: pendingAmountThisMonth > 0 ? "#fef2f2" : "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: pendingAmountThisMonth > 0 ? "#dc2626" : "#059669",
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={20} />
              </div>
            </div>

            {/* Pending Progress Bar */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.72rem",
                  marginBottom: "4px",
                }}
              >
                <span style={{ color: "#059669", fontWeight: 700 }}>
                  {collectionPercentThisMonth}% Settled
                </span>
                <span style={{ color: pendingAmountThisMonth > 0 ? "#dc2626" : "#059669", fontWeight: 700 }}>
                  {pendingAmountThisMonth > 0 ? "Pending Dues" : "All Clear"}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "7px",
                  background: "#fee2e2",
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(collectionPercentThisMonth, 100)}%`,
                    background: "#059669",
                    borderRadius: "9999px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                fontSize: "0.725rem",
                color: "var(--text-secondary)",
                paddingTop: "6px",
                borderTop: "1px dashed var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{pendingDuesList.length} flat(s) pending</span>
              <span style={{ color: "#dc2626", fontWeight: 600 }}>Action Required</span>
            </div>
          </div>

          {/* Card 4: TOTAL BLOCKS */}
          <div
            className="glass-panel"
            style={{
              padding: "18px 20px",
              borderRadius: "14px",
              background: "#ffffff",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Total Blocks
                </span>
                <div
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    marginTop: "2px",
                    lineHeight: 1.2,
                  }}
                >
                  {stats.totalBlocks} Blocks
                </div>
                <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Total {totalFloorsCount} Floors in Society
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#f0fdfa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0d9488",
                  flexShrink: 0,
                }}
              >
                <Building2 size={20} />
              </div>
            </div>

            {/* Block quick tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {blocksList.slice(0, 3).map((b) => (
                <span
                  key={b.id}
                  style={{
                    backgroundColor: "#f0fdfa",
                    color: "#0f766e",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    border: "1px solid #ccfbf1",
                  }}
                >
                  {b.name}
                </span>
              ))}
              {blocksList.length > 3 && (
                <span
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#64748b",
                    padding: "3px 6px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  +{blocksList.length - 3} more
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: "0.725rem",
                color: "var(--text-secondary)",
                paddingTop: "6px",
                borderTop: "1px dashed var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Wings & Towers</span>
              <Link href="/blocks" style={{ color: "#0d9488", fontWeight: 600, textDecoration: "none" }}>
                View All &rarr;
              </Link>
            </div>
          </div>

          {/* Card 5: TOTAL FLATS */}
          <div
            className="glass-panel"
            style={{
              padding: "18px 20px",
              borderRadius: "14px",
              background: "#ffffff",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Total Flats
                </span>
                <div
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    marginTop: "2px",
                    lineHeight: 1.2,
                  }}
                >
                  {stats.totalFlats} Flats
                </div>
                <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {stats.occupiedFlats} Occupied • {stats.totalFlats - stats.occupiedFlats} Vacant
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  flexShrink: 0,
                }}
              >
                <Home size={20} />
              </div>
            </div>

            {/* Occupancy Progress Bar */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.72rem",
                  marginBottom: "4px",
                }}
              >
                <span style={{ color: "#2563eb", fontWeight: 700 }}>
                  {occupancyRate}% Occupied
                </span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                  {stats.totalFlats - stats.occupiedFlats} Vacant
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "7px",
                  background: "#f1f5f9",
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${occupancyRate}%`,
                    background: "#2563eb",
                    borderRadius: "9999px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                fontSize: "0.725rem",
                color: "var(--text-secondary)",
                paddingTop: "6px",
                borderTop: "1px dashed var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Units Inventory</span>
              <Link href="/flats" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                Manage &rarr;
              </Link>
            </div>
          </div>

          {/* Card 6: TOTAL MEMBERS */}
          <div
            className="glass-panel"
            style={{
              padding: "18px 20px",
              borderRadius: "14px",
              background: "#ffffff",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Total Members
                </span>
                <div
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    marginTop: "2px",
                    lineHeight: 1.2,
                  }}
                >
                  {stats.totalUsers} Members
                </div>
                <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Active registered society accounts
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#fdf4ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#a855f7",
                  flexShrink: 0,
                }}
              >
                <Users size={20} />
              </div>
            </div>

            {/* Member roles pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              <span
                style={{
                  backgroundColor: "#f0fdfa",
                  color: "#115e59",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                }}
              >
                {residentsCount} Residents
              </span>
              <span
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#1e40af",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                }}
              >
                {staffCount} Staff & Management
              </span>
            </div>

            <div
              style={{
                fontSize: "0.725rem",
                color: "var(--text-secondary)",
                paddingTop: "6px",
                borderTop: "1px dashed var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>User Directory</span>
              <Link href="/users" style={{ color: "#a855f7", fontWeight: 600, textDecoration: "none" }}>
                Directory &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* 4. DYNAMIC CATEGORY COLLECTION GRAPH & BREAKDOWN */}
        <div
          className="glass-panel animate-fade-in"
          style={{
            padding: "24px 26px",
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          }}
        >
          {/* Header & Scope Filter Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#059669",
                  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.15)",
                }}
              >
                <BarChart3 size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Collections & Fee Breakdown
                </h2>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  Monthly billing split between Base Maintenance (₹{(stats.maintenanceRate || 0).toLocaleString("en-IN")}/mo) & Security Charge (₹{(stats.securityCharge || 0).toLocaleString("en-IN")}/mo)
                </span>
              </div>
            </div>

            {/* Scope Toggle & Total Inflow Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div
                style={{
                  display: "inline-flex",
                  background: "#f1f5f9",
                  padding: "3px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setChartScope("MONTH")}
                  style={{
                    padding: "5px 14px",
                    fontSize: "0.78rem",
                    fontWeight: chartScope === "MONTH" ? 700 : 500,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: chartScope === "MONTH" ? "#ffffff" : "transparent",
                    color: chartScope === "MONTH" ? "#065f46" : "#64748b",
                    boxShadow: chartScope === "MONTH" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {selectedMonthLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setChartScope("ALL")}
                  style={{
                    padding: "5px 14px",
                    fontSize: "0.78rem",
                    fontWeight: chartScope === "ALL" ? 700 : 500,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: chartScope === "ALL" ? "#ffffff" : "transparent",
                    color: chartScope === "ALL" ? "#065f46" : "#64748b",
                    boxShadow: chartScope === "ALL" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  All Time Total
                </button>
              </div>

              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: "10px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#065f46",
                }}
              >
                <span>Total Inflow:</span>
                <span style={{ fontSize: "0.95rem" }}>₹{categoryStats.grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Segmented Distribution Track (Visual Ratio Bar) */}
          <div style={{ marginBottom: "22px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
                fontSize: "0.8rem",
              }}
            >
              <span style={{ fontWeight: 700, color: "#334155" }}>
                Fee Distribution Ratio
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                {categoryStats.grandTotal > 0 ? "100% Accounted" : "No Collections Recorded"}
              </span>
            </div>

            {/* Segmented Dual Bar */}
            <div
              style={{
                height: "14px",
                borderRadius: "9999px",
                background: "#e2e8f0",
                display: "flex",
                overflow: "hidden",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              {categoryStats.grandTotal > 0 ? (
                <>
                  <div
                    style={{
                      width: `${categoryStats.basePct}%`,
                      background: "linear-gradient(90deg, #059669 0%, #10b981 100%)",
                      transition: "width 0.4s ease",
                    }}
                    title={`Base Monthly Maintenance: ₹${categoryStats.baseTotalRounded.toLocaleString("en-IN")} (${categoryStats.basePct}%)`}
                  />
                  <div
                    style={{
                      width: `${categoryStats.secPct}%`,
                      background: "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)",
                      transition: "width 0.4s ease",
                    }}
                    title={`Security Charge Per Month: ₹${categoryStats.secTotalRounded.toLocaleString("en-IN")} (${categoryStats.secPct}%)`}
                  />
                </>
              ) : (
                <div style={{ width: "100%", background: "#f1f5f9" }} />
              )}
            </div>

            {/* Inline Legend with exact amounts & percentages */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "10px",
                fontSize: "0.775rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#059669" }} />
                  <span style={{ color: "#334155", fontWeight: 600 }}>Base Monthly Maintenance:</span>
                  <strong style={{ color: "#065f46" }}>
                    ₹{categoryStats.baseTotalRounded.toLocaleString("en-IN")} ({categoryStats.basePct}%)
                  </strong>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#0284c7" }} />
                  <span style={{ color: "#334155", fontWeight: 600 }}>Security Charge Per Month:</span>
                  <strong style={{ color: "#0369a1" }}>
                    ₹{categoryStats.secTotalRounded.toLocaleString("en-IN")} ({categoryStats.secPct}%)
                  </strong>
                </div>
              </div>

              <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                Configured Ratio: ₹{stats.maintenanceRate || 0} : ₹{stats.securityCharge || 0}
              </div>
            </div>
          </div>

          {/* 3 Balanced KPI Detail Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "16px",
            }}
          >
            {/* Card 1: Base Maintenance */}
            <div
              style={{
                padding: "20px",
                borderRadius: "14px",
                background: "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)",
                border: "1px solid #bbf7d0",
                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#ecfdf5",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      <Home size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        Base Monthly Maintenance
                      </h3>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Building & common upkeep
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "9999px",
                      backgroundColor: "#ecfdf5",
                      color: "#065f46",
                      border: "1px solid #a7f3d0",
                    }}
                  >
                    {categoryStats.basePct}% Share
                  </span>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#065f46", lineHeight: 1.2 }}>
                    ₹{categoryStats.baseTotalRounded.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Collected across {categoryStats.baseMaintenanceCount} transaction
                    {categoryStats.baseMaintenanceCount === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid #dcfce7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.75rem",
                }}
              >
                <span style={{ color: "#475569" }}>Monthly Rate per Flat:</span>
                <strong style={{ color: "#0f172a", fontWeight: 700 }}>
                  ₹{(stats.maintenanceRate || 0).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            {/* Card 2: Security Charge */}
            <div
              style={{
                padding: "20px",
                borderRadius: "14px",
                background: "linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)",
                border: "1px solid #bae6fd",
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#f0f9ff",
                        color: "#0284c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #bae6fd",
                      }}
                    >
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        Security Charge Per Month
                      </h3>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Guards, gates & surveillance
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "9999px",
                      backgroundColor: "#f0f9ff",
                      color: "#0369a1",
                      border: "1px solid #bae6fd",
                    }}
                  >
                    {categoryStats.secPct}% Share
                  </span>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0369a1", lineHeight: 1.2 }}>
                    ₹{categoryStats.secTotalRounded.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Collected across {categoryStats.securityChargeCount} transaction
                    {categoryStats.securityChargeCount === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid #e0f2fe",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.75rem",
                }}
              >
                <span style={{ color: "#475569" }}>Monthly Rate per Flat:</span>
                <strong style={{ color: "#0f172a", fontWeight: 700 }}>
                  ₹{(stats.securityCharge || 0).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            {/* Card 3: Total Combined Dues & Settlement */}
            <div
              style={{
                padding: "20px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #064e3b 0%, #0f172a 100%)",
                boxShadow: "0 4px 14px rgba(6, 78, 59, 0.15)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                color: "#ffffff",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(255,255,255,0.12)",
                        color: "#a7f3d0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                        Total Revenue Inflow
                      </h3>
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)" }}>
                        {chartScope === "MONTH" ? selectedMonthLabel : "All Time Records"}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(16, 185, 129, 0.2)",
                      color: "#6ee7b7",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    100% Total
                  </span>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", lineHeight: 1.2 }}>
                    ₹{categoryStats.grandTotal.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>
                    Combined Flat Fee: ₹
                    {(
                      (stats.maintenanceRate || 0) + (stats.securityCharge || 0)
                    ).toLocaleString("en-IN")}{" "}
                    / mo
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.75rem",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.8)" }}>Paid Occupied Units:</span>
                <strong style={{ color: "#34d399", fontWeight: 700 }}>
                  {categoryStats.baseMaintenanceCount} of {stats.occupiedFlats} Flats
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* 5. TOWER-WISE FLAT INVENTORY BREAKDOWN */}
        <div
          className="glass-panel"
          style={{
            padding: "22px 24px",
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#f0fdfa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0d9488",
                }}
              >
                <Layers size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Towers & Per-Tower Flat Inventory
                </h2>
                <span style={{ fontSize: "0.775rem", color: "var(--text-secondary)" }}>
                  Detailed breakdown of occupied and vacant flats across all blocks
                </span>
              </div>
            </div>

            <Link href="/flats" className="btn btn-secondary" style={{ padding: "5px 12px", fontSize: "0.75rem" }}>
              <span>Manage Flats</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "16px",
            }}
          >
            {blocksList.map((block) => {
              const blockFlats = flatsList.filter((f) => f.blockId === block.id);
              const occupiedFlats = blockFlats.filter((f) => f.occupancyStatus !== "VACANT");
              const vacantFlats = blockFlats.length - occupiedFlats.length;

              return (
                <div
                  key={block.id}
                  style={{
                    padding: "16px 18px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem" }}>
                        {block.name}
                      </div>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          backgroundColor: blockFlats.length > 0 ? "#ecfdf5" : "#f1f5f9",
                          color: blockFlats.length > 0 ? "#065f46" : "#64748b",
                        }}
                      >
                        {blockFlats.length} Flats
                      </span>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                      {block.totalFloors} Floors • {occupiedFlats.length} Occupied • {vacantFlats} Vacant
                    </div>

                    {/* Flats List Inside This Tower */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {blockFlats.length === 0 ? (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                          No flats added yet in this tower
                        </span>
                      ) : (
                        blockFlats.map((flat) => {
                          const isOcc = flat.occupancyStatus !== "VACANT";
                          return (
                            <span
                              key={flat.id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "0.725rem",
                                fontWeight: 600,
                                backgroundColor: isOcc ? "#ecfdf5" : "#f1f5f9",
                                color: isOcc ? "#065f46" : "#64748b",
                                border: `1px solid ${isOcc ? "#a7f3d0" : "#cbd5e1"}`,
                              }}
                              title={
                                isOcc
                                  ? `Flat ${flat.flatNumber} (${flat.flatType}) - Occupied by ${
                                      flat.residentName || "Resident"
                                    }`
                                  : `Flat ${flat.flatNumber} - Vacant`
                              }
                            >
                              <span>Flat {flat.flatNumber}</span>
                              <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>({flat.flatType})</span>
                              {isOcc ? "✓" : "○"}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. TWO-COLUMN OPERATIONS: RECENT PAYMENTS & PENDING DUES */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {/* LEFT: Recent Payments */}
          <div
            className="glass-panel"
            style={{
              padding: "22px 24px",
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "#ecfdf5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#059669",
                  }}
                >
                  <Receipt size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Recent Payments
                  </h2>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Latest verified collections across society
                  </span>
                </div>
              </div>

              <Link href="/transactions" className="btn btn-secondary" style={{ padding: "5px 12px", fontSize: "0.75rem" }}>
                <span>View All</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {allTransactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No recent payment records found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {allTransactions.slice(0, 5).map((txn) => {
                  const isPartial = txn.paymentPlan === "PARTIAL";
                  return (
                    <div
                      key={txn.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "#f8fafc",
                        border: "1px solid var(--border-color)",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            backgroundColor:
                              txn.paymentMethod === "UPI"
                                ? "rgba(99, 102, 241, 0.1)"
                                : "rgba(16, 185, 129, 0.1)",
                            color: txn.paymentMethod === "UPI" ? "#4f46e5" : "#059669",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                          title={txn.paymentMethod === "UPI" ? "Online UPI" : "Counter Cash"}
                        >
                          {txn.paymentMethod === "UPI" ? <Smartphone size={17} /> : <Banknote size={17} />}
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                              {txn.payerName}
                            </span>
                            <span
                              style={{
                                fontSize: "0.65rem",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontWeight: 700,
                                backgroundColor: isPartial ? "#fef3c7" : "#ecfdf5",
                                color: isPartial ? "#92400e" : "#065f46",
                                border: `1px solid ${isPartial ? "#fde68a" : "#a7f3d0"}`,
                              }}
                            >
                              {isPartial ? "Partial Pay" : "Full Pay"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {txn.flatNumber ? `Flat ${txn.flatNumber}` : "Direct"} • Receipt:{" "}
                            <strong>{txn.receiptNumber}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#059669" }}>
                          +₹{parseFloat(txn.amount).toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {txn.billingMonth || "Monthly Dues"} • {txn.paymentMethod}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Pending Dues */}
          <div
            className="glass-panel"
            style={{
              padding: "22px 24px",
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: pendingDuesList.length > 0 ? "#fef2f2" : "#ecfdf5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: pendingDuesList.length > 0 ? "#dc2626" : "#059669",
                  }}
                >
                  {pendingDuesList.length > 0 ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Pending Dues Attention
                  </h2>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: pendingDuesList.length > 0 ? "#dc2626" : "#059669",
                      fontWeight: 600,
                    }}
                  >
                    {pendingDuesList.length > 0
                      ? `${pendingDuesList.length} Units Awaiting Payment`
                      : "All Maintenance Cleared"}
                  </span>
                </div>
              </div>

              <Link href="/users" className="btn btn-secondary" style={{ padding: "5px 12px", fontSize: "0.75rem" }}>
                <span>Users Table</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {pendingDuesList.length === 0 ? (
              <div
                style={{
                  padding: "28px 20px",
                  textAlign: "center",
                  backgroundColor: "#ecfdf5",
                  borderRadius: "12px",
                  border: "1px solid #a7f3d0",
                }}
              >
                <CheckCircle2 size={32} color="#059669" style={{ margin: "0 auto 8px auto" }} />
                <div style={{ fontWeight: 800, color: "#065f46", fontSize: "1rem" }}>
                  All Dues Cleared!
                </div>
                <div style={{ fontSize: "0.8rem", color: "#047857", marginTop: "4px" }}>
                  100% of occupied flats have settled their dues for the current cycle.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingDuesList.map((item) => (
                  <div
                    key={item.flatId}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: item.type === "PARTIAL" ? "#fffbeb" : "#fef2f2",
                      border: `1px solid ${item.type === "PARTIAL" ? "#fde68a" : "#fecaca"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.925rem" }}>
                        Flat {item.flatNumber} ({item.blockName})
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "1px" }}>
                        {item.payerName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: item.type === "PARTIAL" ? "#b45309" : "#dc2626",
                          marginTop: "3px",
                        }}
                      >
                        ₹{item.remainingAmount.toLocaleString("en-IN")} Due (
                        {item.type === "PARTIAL" ? "Partial Paid" : "Unpaid"})
                      </div>
                    </div>

                    {isStaff && (
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(item.flatId, item.payerName, item.payerId)}
                        className="btn btn-primary"
                        style={{
                          padding: "7px 14px",
                          fontSize: "0.775rem",
                          fontWeight: 700,
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                          boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)",
                        }}
                      >
                        <Receipt size={14} />
                        <span>Pay / Collect</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Instant Direct Pay / Collect Dues Modal */}
      {isModalOpen && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTransaction}
          flats={flatsList}
          initialFlatId={selectedFlatId}
          initialPayerName={selectedPayerName}
          initialPayerId={selectedPayerId}
        />
      )}
    </DashboardShell>
  );
}