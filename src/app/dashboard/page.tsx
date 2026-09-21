"use client";

import React, { useEffect, useState } from "react";
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
  Settings,
  ShieldAlert,
  Clock,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ChevronRight,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import { blockService } from "../../modules/blocks/services/block.service";
import { flatService } from "../../modules/flats/services/flat.service";
import { userService } from "../../modules/users/services/user.service";
import { settingService } from "../../modules/settings/services/setting.service";
import { transactionService } from "../../modules/transactions/services/transaction.service";
import { TransactionItem, CreateTransactionData } from "../../modules/transactions/types/index";
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

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const isStaff = hasRole(["SECRETARY", "ACCOUNTANT"]);

  const [stats, setStats] = useState({
    totalBlocks: 3,
    totalFlats: 4,
    occupiedFlats: 3,
    totalUsers: 5,
    maintenanceRate: 3500,
    securityCharge: 500,
    societyName: "Green Place Residential Society",
    visitorPassRequired: "true",
    quietHours: "22:00 - 07:00",
  });

  const [blocksList, setBlocksList] = useState<BlockItem[]>([]);
  const [flatsList, setFlatsList] = useState<FlatItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [financeStats, setFinanceStats] = useState({
    totalAmountCollected: 0,
    cashTotal: 0,
    upiTotal: 0,
    totalTransactionsCount: 0,
  });

  // Financial dues calculations
  const [duesMetrics, setDuesMetrics] = useState({
    totalExpectedDues: 12000,
    totalCollected: 10000,
    onlineUPI: 8000,
    cashAmount: 2000,
    pendingBalance: 2000,
    collectionPercent: 83,
  });

  // Dues settlement counts
  const [settlementStats, setSettlementStats] = useState({
    settledCount: 2,
    partialCount: 1,
    pendingCount: 0,
    settlementRate: 67,
    totalPendingAmount: 2000,
  });

  const [pendingDuesList, setPendingDuesList] = useState<PendingDueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for instant payment collection
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFlatId, setSelectedFlatId] = useState<number | undefined>();
  const [selectedPayerName, setSelectedPayerName] = useState<string | undefined>();
  const [selectedPayerId, setSelectedPayerId] = useState<number | undefined>();

  const monthlyTotalRate = stats.maintenanceRate + stats.securityCharge;

  const loadDashboard = async () => {
    try {
      const [blocks, flatsRes, usersRes, settings, txns] = await Promise.all([
        blockService.getBlocks(),
        flatService.getFlats(),
        userService.getUsers(),
        settingService.getSettings(),
        transactionService.getTransactions(),
      ]);

      const totalMonthlyRate =
        (Number(settings.monthlyMaintenanceRate) || 3500) +
        (Number(settings.monthlySecurityCharge) || 500);

      const occupied = flatsRes.flats.filter((f) => f.occupancyStatus !== "VACANT");

      setStats({
        totalBlocks: blocks.length,
        totalFlats: flatsRes.flats.length,
        occupiedFlats: occupied.length,
        totalUsers: usersRes.total,
        maintenanceRate: Number(settings.monthlyMaintenanceRate) || 3500,
        securityCharge: Number(settings.monthlySecurityCharge) || 500,
        societyName: settings.societyName || "Green Place Residential Society",
        visitorPassRequired: settings.visitorPassRequired || "true",
        quietHours: `${settings.quietHoursStart || "22:00"} - ${settings.quietHoursEnd || "07:00"}`,
      });

      setBlocksList(blocks);
      setFlatsList(flatsRes.flats);
      setUsersList(usersRes.users);
      setRecentTransactions(txns.slice(0, 5));

      const fStats = transactionService.getStats();
      setFinanceStats(fStats);

      // Financial Calculation
      const totalExpected = occupied.length * totalMonthlyRate;
      const collected = fStats.totalAmountCollected;
      const pendingBal = Math.max(0, totalExpected - collected);
      const colPercent = totalExpected > 0 ? Math.round((collected / totalExpected) * 100) : 0;

      setDuesMetrics({
        totalExpectedDues: totalExpected,
        totalCollected: collected,
        onlineUPI: fStats.upiTotal,
        cashAmount: fStats.cashTotal,
        pendingBalance: pendingBal,
        collectionPercent: colPercent,
      });

      // Calculate Settlement and Pending Dues per occupied flat
      let settled = 0;
      let partial = 0;
      let pending = 0;
      let pendingSum = 0;
      const duesAttention: PendingDueItem[] = [];

      occupied.forEach((flat) => {
        const residentUser = usersRes.users.find(
          (u) => u.id === flat.residentId || u.id === flat.ownerId
        );
        const residentName = residentUser?.name || "Resident";

        const txn = txns.find(
          (t) =>
            t.flatId === flat.id ||
            (residentUser && t.payerId === residentUser.id) ||
            t.payerName.toLowerCase().includes(residentName.toLowerCase())
        );

        if (txn) {
          const paidVal = parseFloat(txn.amount) || 0;
          const remVal = txn.balanceRemaining
            ? parseFloat(txn.balanceRemaining)
            : Math.max(0, totalMonthlyRate - paidVal);

          if (txn.paymentPlan === "FULL" || (remVal === 0 && paidVal >= totalMonthlyRate)) {
            settled++;
          } else if (remVal > 0 || txn.paymentPlan === "PARTIAL") {
            partial++;
            pendingSum += remVal;
            duesAttention.push({
              flatId: flat.id,
              flatNumber: flat.flatNumber,
              blockName: flat.blockName || "Tower",
              payerName: residentName,
              payerId: residentUser?.id,
              remainingAmount: remVal,
              type: "PARTIAL",
            });
          } else {
            settled++;
          }
        } else {
          pending++;
          pendingSum += totalMonthlyRate;
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

      const totalOccupiedCount = occupied.length || 1;
      const rate = Math.round((settled / totalOccupiedCount) * 100);

      setSettlementStats({
        settledCount: settled,
        partialCount: partial,
        pendingCount: pending,
        settlementRate: rate,
        totalPendingAmount: pendingSum,
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

  const occupancyRate =
    stats.totalFlats > 0
      ? Math.round((stats.occupiedFlats / stats.totalFlats) * 100)
      : 0;

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // User counts by role
  const residentsCount = usersList.filter((u) => u.role === "USER").length;
  const secretaryCount = usersList.filter((u) => u.role === "SECRETARY").length;
  const accountantCount = usersList.filter((u) => u.role === "ACCOUNTANT").length;
  const securityCount = usersList.filter((u) => u.role === "SECURITY").length;

  return (
    <DashboardShell title="Green Place | Executive Community Dashboard">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* 1. EXECUTIVE HERO BANNER */}
        <div
          className="animate-fade-in"
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)",
            color: "#ffffff",
            padding: "20px 26px",
            boxShadow: "0 6px 20px -3px rgba(6, 78, 59, 0.28)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
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
              gap: "14px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                <span
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(8px)",
                    color: "#a7f3d0",
                    border: "1px solid rgba(167, 243, 208, 0.3)",
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Sparkles size={12} color="#6ee7b7" />
                  <span>{stats.societyName}</span>
                </span>
                <span style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.8)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Calendar size={13} color="#a7f3d0" />
                  <span>{todayFormatted}</span>
                </span>
              </div>

              <h1 style={{ fontSize: "1.45rem", fontWeight: 800, margin: 0, letterSpacing: "-0.015em", color: "#ffffff" }}>
                Welcome back, {user?.name || "Resident"}!
              </h1>
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
                    padding: "9px 18px",
                    borderRadius: "9px",
                    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
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
                    padding: "9px 18px",
                    borderRadius: "9px",
                    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
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
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(10px)",
                  color: "#ffffff",
                  padding: "9px 16px",
                  borderRadius: "9px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
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

        {/* 2. SPECIFIC FINANCIAL & SOCIETY SUMMARY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "18px",
          }}
        >
          {/* Card 1: Collections vs Total Expected Dues */}
          <div
            className="glass-panel"
            style={{
              padding: "16px 18px",
              borderRadius: "12px",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Collections
                </span>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                  ₹{duesMetrics.totalCollected.toLocaleString("en-IN")}
                </div>
              </div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#059669",
                }}
              >
                <IndianRupee size={18} />
              </div>
            </div>

            {/* Collection Progress Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "4px" }}>
                <span style={{ color: "#059669", fontWeight: 700 }}>{duesMetrics.collectionPercent}% Collected</span>
                <span style={{ color: "#dc2626", fontWeight: 700 }}>₹{duesMetrics.pendingBalance.toLocaleString("en-IN")} Pending</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "#fee2e2", borderRadius: "9999px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(duesMetrics.collectionPercent, 100)}%`,
                    background: "#059669",
                    borderRadius: "9999px",
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)" }}>
              Expected: <strong>₹{duesMetrics.totalExpectedDues.toLocaleString("en-IN")}</strong> ({stats.occupiedFlats} flats × ₹{monthlyTotalRate})
            </div>
          </div>

          {/* Card 2: Online (UPI) vs Cash */}
          <div
            className="glass-panel"
            style={{
              padding: "16px 18px",
              borderRadius: "12px",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Online vs Cash
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#4f46e5" }}>
                    ₹{duesMetrics.onlineUPI.toLocaleString("en-IN")}
                  </span>
                  <span style={{ fontSize: "0.775rem", color: "var(--text-secondary)", fontWeight: 600 }}>UPI</span>
                </div>
              </div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#e0e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4f46e5",
                }}
              >
                <Smartphone size={18} />
              </div>
            </div>

            {/* Split Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "4px" }}>
                <span style={{ color: "#4f46e5", fontWeight: 700 }}>
                  Online {duesMetrics.totalCollected > 0 ? Math.round((duesMetrics.onlineUPI / duesMetrics.totalCollected) * 100) : 0}%
                </span>
                <span style={{ color: "#059669", fontWeight: 700 }}>
                  Cash {duesMetrics.totalCollected > 0 ? Math.round((duesMetrics.cashAmount / duesMetrics.totalCollected) * 100) : 0}%
                </span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden", display: "flex" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${duesMetrics.totalCollected > 0 ? (duesMetrics.onlineUPI / duesMetrics.totalCollected) * 100 : 80}%`,
                    background: "#6366f1",
                  }}
                  title={`UPI: ₹${duesMetrics.onlineUPI}`}
                />
                <div
                  style={{
                    height: "100%",
                    width: `${duesMetrics.totalCollected > 0 ? (duesMetrics.cashAmount / duesMetrics.totalCollected) * 100 : 20}%`,
                    background: "#10b981",
                  }}
                  title={`Cash: ₹${duesMetrics.cashAmount}`}
                />
              </div>
            </div>

            <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)" }}>
              Cash Received: <strong style={{ color: "#059669" }}>₹{duesMetrics.cashAmount.toLocaleString("en-IN")}</strong>
            </div>
          </div>

          {/* Card 3: Towers & Total Flats */}
          <div
            className="glass-panel"
            style={{
              padding: "16px 18px",
              borderRadius: "12px",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Towers & Inventory
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                    {stats.totalBlocks} Towers
                  </span>
                  <span style={{ fontSize: "0.775rem", color: "#0d9488", fontWeight: 700 }}>
                    ({stats.totalFlats} Flats)
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#f0fdfa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0d9488",
                }}
              >
                <Building2 size={18} />
              </div>
            </div>

            {/* Occupancy Progress Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "4px" }}>
                <span style={{ color: "#0d9488", fontWeight: 700 }}>{occupancyRate}% Occupied</span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{stats.totalFlats - stats.occupiedFlats} Vacant</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${occupancyRate}%`,
                    background: "#0d9488",
                    borderRadius: "9999px",
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)" }}>
              {stats.occupiedFlats} Occupied flats out of {stats.totalFlats} total units
            </div>
          </div>

          {/* Card 4: How Many Users in List */}
          <div
            className="glass-panel"
            style={{
              padding: "16px 18px",
              borderRadius: "12px",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Community Directory
                </span>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                  {stats.totalUsers} Members
                </div>
              </div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#fdf4ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#a855f7",
                }}
              >
                <Users size={18} />
              </div>
            </div>

            {/* Role Breakdown Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              <span style={{ backgroundColor: "#f0fdfa", color: "#115e59", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.7rem" }}>
                {residentsCount} Resident
              </span>
              <span style={{ backgroundColor: "#ecfdf5", color: "#065f46", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.7rem" }}>
                {secretaryCount} Sec
              </span>
              <span style={{ backgroundColor: "#fffbeb", color: "#92400e", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.7rem" }}>
                {accountantCount} Acc
              </span>
              <span style={{ backgroundColor: "#eff6ff", color: "#1e40af", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.7rem" }}>
                {securityCount} Guard
              </span>
            </div>

            <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)" }}>
              Active registered society accounts
            </div>
          </div>
        </div>

        {/* 3. TOWER-WISE FLAT INVENTORY BREAKDOWN (PER TOWER ME KITNE FLAT HAIN) */}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
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
              const blockFlats = flatsList.filter(
                (f) => f.blockId === block.id || f.blockName?.toLowerCase().includes(block.name.toLowerCase().split(" ")[0])
              );
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
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
                              title={isOcc ? `Flat ${flat.flatNumber} (${flat.flatType}) - Occupied by ${flat.residentName || "Resident"}` : `Flat ${flat.flatNumber} - Vacant`}
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

        {/* 4. USER-FRIENDLY TWO-COLUMN OPERATIONS (RECENT PAYMENTS & PENDING DUES) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "20px",
            alignItems: "start",
          }}
        >
         
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
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
                    Latest verified maintenance collections across society
                  </span>
                </div>
              </div>

              <Link href="/transactions" className="btn btn-secondary" style={{ padding: "5px 12px", fontSize: "0.75rem" }}>
                <span>View All</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No recent payment records found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {recentTransactions.map((txn) => {
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
                            backgroundColor: txn.paymentMethod === "UPI" ? "rgba(99, 102, 241, 0.1)" : "rgba(16, 185, 129, 0.1)",
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
                            {txn.flatNumber ? `Flat ${txn.flatNumber}` : "Direct"} • Receipt: <strong>{txn.receiptNumber}</strong>
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

          {/* RIGHT: Pending Maintenance Dues (Kiska Payment Baki Hai) */}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
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
                    Pending Dues
                  </h2>
                  <span style={{ fontSize: "0.75rem", color: pendingDuesList.length > 0 ? "#dc2626" : "#059669", fontWeight: 600 }}>
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
                  All Maintenance Dues Cleared!
                </div>
                <div style={{ fontSize: "0.8rem", color: "#047857", marginTop: "4px" }}>
                  100% of occupied flats have settled their maintenance for the current cycle.
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
                        ₹{item.remainingAmount.toLocaleString("en-IN")} Due ({item.type === "PARTIAL" ? "Partial Paid" : "Unpaid"})
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
