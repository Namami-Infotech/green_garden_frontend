"use client";

import React from "react";
import { IndianRupee, Banknote, Smartphone, Receipt } from "lucide-react";
import { TransactionStats as ITransactionStats } from "../types/index";

export function TransactionStats({ stats }: { stats: ITransactionStats }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
      }}
    >
      {/* Total Collected */}
      <div className="metric-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Total Collected</span>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IndianRupee size={16} color="#10b981" />
          </div>
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
          ₹{stats.totalAmountCollected.toLocaleString("en-IN")}
        </div>
        <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", marginTop: "2px" }}>
          {stats.totalTransactionsCount} total receipts recorded
        </div>
      </div>

      {/* UPI Collections */}
      <div className="metric-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>UPI Collections</span>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Smartphone size={16} color="#6366f1" />
          </div>
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#6366f1" }}>
          ₹{stats.upiTotal.toLocaleString("en-IN")}
        </div>
        <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", marginTop: "2px" }}>
          {stats.upiTransactionsCount} payments via GPay / PhonePe / Paytm
        </div>
      </div>

      {/* Cash Collections */}
      <div className="metric-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Cash Collections</span>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Banknote size={16} color="#059669" />
          </div>
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#059669" }}>
          ₹{stats.cashTotal.toLocaleString("en-IN")}
        </div>
        <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", marginTop: "2px" }}>
          {stats.cashTransactionsCount} manual counter cash receipts
        </div>
      </div>

      {/* Receipts Recorded */}
      <div className="metric-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Active Audit Status</span>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Receipt size={16} color="#d97706" />
          </div>
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
          Verified
        </div>
        <div style={{ fontSize: "0.725rem", color: "#10b981", fontWeight: 600, marginTop: "2px" }}>
          100% Accountant Signed
        </div>
      </div>
    </div>
  );
}
