"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Save, Building, DollarSign, ShieldAlert, Receipt } from "lucide-react";
import { settingService } from "../services/setting.service";
import { SocietyConfigState } from "../types/index";
import { societySettingsValidationSchema } from "../validations/index";
import { TransactionModal } from "../../transactions/components/TransactionModal";
import { transactionService } from "../../transactions/services/transaction.service";
import { flatService } from "../../flats/services/flat.service";
import { FlatItem } from "../../flats/types/index";
import { CreateTransactionData } from "../../transactions/types/index";
import { useToast } from "../../../hooks/use-toast";

export function SettingsForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SocietyConfigState>({
    societyName: "",
    registrationNumber: "",
    monthlyMaintenanceRate: "",
    monthlySecurityCharge: "",
    latePaymentPenaltyPercent: "",
    visitorPassRequired: "true",
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Pay Modal State in Settings
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [flats, setFlats] = useState<FlatItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [data, flatsRes] = await Promise.all([
          settingService.getSettings(),
          flatService.getFlats().catch(() => ({ flats: [], total: 0, page: 1, limit: 10, totalPages: 1 })),
        ]);
        setFormData(data);
        setFlats(flatsRes?.flats || []);
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || "Failed to load society settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRecordPayment = async (data: CreateTransactionData) => {
    try {
      await transactionService.createTransaction(data);
      const msg = `Payment of ₹${Number(data.amount).toLocaleString("en-IN")} recorded successfully!`;
      setSuccessMsg(msg);
      toast.success(msg, "Payment Recorded");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const errTxt = (err as Error).message || "Failed to record payment";
      toast.error(errTxt, "Payment Failed");
    }
  };

  const handleChange = (field: keyof SocietyConfigState, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const validation = societySettingsValidationSchema.safeParse(formData);
    if (!validation.success) {
      const validationErr = validation.error.errors[0].message;
      setErrorMsg(validationErr);
      toast.error(validationErr, "Validation Error");
      return;
    }

    setSaving(true);
    try {
      await settingService.saveSettings(formData);
      setSuccessMsg("Society settings updated successfully!");
      toast.success("Society settings updated successfully!", "Settings Saved");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const errTxt = (err as Error).message || "Failed to update settings";
      setErrorMsg(errTxt);
      toast.error(errTxt, "Update Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
        Loading configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "800px" }}>
      {successMsg && (
        <div
          style={{
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#34d399",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.9rem",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #f87171",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.9rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* General Information */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <Building size={20} color="#059669" />
          <h3 style={{ fontSize: "1.1rem", color: "#0f172a" }}>General Society Identity</h3>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="setting-society-name">Registered Society Name</label>
          <input
            id="setting-society-name"
            className="form-input"
            value={formData.societyName}
            onChange={(e) => handleChange("societyName", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="setting-reg-num">Government Registration Number</label>
          <input
            id="setting-reg-num"
            className="form-input"
            value={formData.registrationNumber}
            onChange={(e) => handleChange("registrationNumber", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Maintenance & Dues */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <DollarSign size={20} color="#059669" />
          <h3 style={{ fontSize: "1.1rem", color: "#0f172a" }}>Maintenance & Financial Policies</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="setting-maint-rate">Base Monthly Maintenance (INR)</label>
            <input
              id="setting-maint-rate"
              type="number"
              min="0"
              placeholder="e.g. 3500"
              className="form-input"
              value={formData.monthlyMaintenanceRate}
              onChange={(e) => handleChange("monthlyMaintenanceRate", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="setting-security-charge">Security Charge Per Month (INR)</label>
            <input
              id="setting-security-charge"
              type="number"
              min="0"
              placeholder="e.g. 500"
              className="form-input"
              value={formData.monthlySecurityCharge}
              onChange={(e) => handleChange("monthlySecurityCharge", e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label className="form-label" htmlFor="setting-penalty-rate">Late Payment Annual Interest (%)</label>
            <input
              id="setting-penalty-rate"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 18"
              className="form-input"
              value={formData.latePaymentPenaltyPercent}
              onChange={(e) => handleChange("latePaymentPenaltyPercent", e.target.value)}
              required
            />
          </div>
        </div>

        {/* Monthly Dues Summary & Direct Payment Action */}
        <div
          style={{
            marginTop: "18px",
            padding: "16px 20px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
            border: "1px solid #a7f3d0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#065f46", fontWeight: 700 }}>
              Total Configured Monthly Dues (Har Flat / Month)
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#064e3b", marginTop: "2px" }}>
              ₹{(Number(formData.monthlyMaintenanceRate || 0) + Number(formData.monthlySecurityCharge || 0)).toLocaleString("en-IN")}
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#047857" }}> / month</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#047857", marginTop: "2px" }}>
              Base Maintenance: <strong>₹{formData.monthlyMaintenanceRate || 0}</strong> + Security: <strong>₹{formData.monthlySecurityCharge || 0}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="btn btn-primary"
            style={{
              backgroundColor: "#059669",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              fontSize: "0.9rem",
              fontWeight: 700,
              boxShadow: "0 4px 6px -1px rgba(5, 150, 105, 0.2)",
            }}
          >
            <Receipt size={17} />
            <span>Pay / Collect Monthly Dues</span>
          </button>
        </div>
      </div>

      {/* Security & Rules */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <ShieldAlert size={20} color="#d97706" />
          <h3 style={{ fontSize: "1.1rem", color: "#0f172a" }}>Security & Community Guidelines</h3>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="setting-visitor-pass">Mandatory Visitor Digital Gate Pass</label>
          <select
            id="setting-visitor-pass"
            className="form-select"
            value={formData.visitorPassRequired}
            onChange={(e) => handleChange("visitorPassRequired", e.target.value)}
          >
            <option value="true">Enabled (Digital OTP verification at guard gate)</option>
            <option value="false">Disabled (Open entry during day)</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="setting-quiet-start">Quiet Hours Start</label>
            <input
              id="setting-quiet-start"
              type="time"
              className="form-input"
              value={formData.quietHoursStart}
              onChange={(e) => handleChange("quietHoursStart", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="setting-quiet-end">Quiet Hours End</label>
            <input
              id="setting-quiet-end"
              type="time"
              className="form-input"
              value={formData.quietHoursEnd}
              onChange={(e) => handleChange("quietHoursEnd", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={18} />
          {saving ? "Saving Configuration..." : "Save Settings"}
        </button>
      </div>

      {/* Payment Modal inside Settings */}
      <TransactionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handleRecordPayment}
        flats={flats}
      />
    </form>
  );
}
