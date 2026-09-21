"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "../../../components/Modal";
import { CreateUserData, UserItem } from "../types/index";
import { userFormValidationSchema } from "../validations/index";
import { Home } from "lucide-react";
import { FlatItem } from "../../flats/types/index";

export interface FlatAssignmentOption {
  flatId: number;
  role: "RESIDENT" | "OWNER" | "BOTH";
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData, assignment?: FlatAssignmentOption) => Promise<void>;
  flats?: FlatItem[];
  initialData?: UserItem | null;
  currentFlatId?: number | null;
  currentFlatRole?: "RESIDENT" | "OWNER" | "BOTH";
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  flats = [],
  initialData,
  currentFlatId,
  currentFlatRole = "RESIDENT",
}: UserFormModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "SECRETARY" | "ACCOUNTANT" | "SECURITY">("USER");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "PENDING">("ACTIVE");
  const [selectedFlatId, setSelectedFlatId] = useState<string>("");
  const [flatRole, setFlatRole] = useState<"RESIDENT" | "OWNER" | "BOTH">("RESIDENT");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setPhone(initialData.phone || "");
      setPassword(""); // Leave blank if not changing
      setRole(initialData.role);
      setStatus(initialData.status as "ACTIVE" | "INACTIVE" | "PENDING");
      setSelectedFlatId(currentFlatId ? String(currentFlatId) : "");
      setFlatRole(currentFlatRole);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("USER");
      setStatus("ACTIVE");
      setSelectedFlatId("");
      setFlatRole("RESIDENT");
    }
    setError(null);
  }, [initialData, currentFlatId, currentFlatRole, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If creating, password is required (min 6). If editing, validate only if provided.
    if (!initialData && (!password || password.length < 6)) {
      setError("Initial password must be at least 6 characters");
      return;
    }

    if (initialData && password && password.trim().length > 0 && password.trim().length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (!name || name.trim().length === 0) {
      setError("Full name is required");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      const assignment: FlatAssignmentOption | undefined = selectedFlatId
        ? {
            flatId: Number(selectedFlatId),
            role: flatRole,
          }
        : undefined;

      await onSubmit(
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password: password.trim() || (initialData ? "" : "password123"),
          role,
          status,
        },
        assignment
      );
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  // When editing, show vacant flats PLUS the currently assigned flat for this user
  const selectableFlats = flats.filter(
    (f) =>
      (f.occupancyStatus === "VACANT" && !f.residentId) ||
      (currentFlatId && f.id === currentFlatId)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit Resident / User (${initialData.name})` : "Add New User / Resident"}
    >
      {error && (
        <div
          style={{
            backgroundColor: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#f87171",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="new-user-name">Full Name</label>
          <input
            id="new-user-name"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rajesh Sharma"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new-user-email">Email Address</label>
          <input
            id="new-user-email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. rajesh@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new-user-phone">Phone Number</label>
          <input
            id="new-user-phone"
            className="form-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new-user-password">
            {initialData ? "New Password (Leave blank to keep current)" : "Initial Password"}
          </label>
          <input
            id="new-user-password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={initialData ? "Optional — leave blank if unchanged" : "Min 6 characters"}
            required={!initialData}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="new-user-role">Role (RBAC)</label>
            <select
              id="new-user-role"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value as "USER" | "SECRETARY" | "ACCOUNTANT" | "SECURITY")}
            >
              <option value="USER">USER (Resident / Owner)</option>
              <option value="SECRETARY">SECRETARY (Admin)</option>
              <option value="ACCOUNTANT">ACCOUNTANT (Billing)</option>
              <option value="SECURITY">SECURITY (Guard / Gate)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-user-status">Status</label>
            <select
              id="new-user-status"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE" | "PENDING")}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        {/* Flat & Tower Assignment Section */}
        {flats.length > 0 && (
          <div
            style={{
              marginTop: "8px",
              marginBottom: "16px",
              padding: "14px",
              backgroundColor: "rgba(241, 245, 249, 0.6)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Home size={16} color="var(--primary-color)" />
              Assign Flat & Tower (Optional)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: selectedFlatId ? "1fr 1fr" : "1fr", gap: "16px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="user-assign-flat">
                  Select Tower & Flat
                </label>
                <select
                  id="user-assign-flat"
                  className="form-select"
                  value={selectedFlatId}
                  onChange={(e) => setSelectedFlatId(e.target.value)}
                >
                  <option value="">-- No flat assigned / Unassigned --</option>
                  {selectableFlats.map((f) => (
                    <option key={f.id} value={f.id}>
                      Flat {f.flatNumber} ({f.blockName || `Tower ${f.blockId}`}) • {f.flatType} • Floor {f.floor}
                      {currentFlatId === f.id ? " (Currently Assigned)" : ""}
                    </option>
                  ))}
                </select>
                {selectableFlats.length === 0 && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    No vacant flats available currently.
                  </div>
                )}
              </div>

              {selectedFlatId && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="user-flat-role">
                    Assignment Role
                  </label>
                  <select
                    id="user-flat-role"
                    className="form-select"
                    value={flatRole}
                    onChange={(e) => setFlatRole(e.target.value as "RESIDENT" | "OWNER" | "BOTH")}
                  >
                    <option value="RESIDENT">Resident / Tenant</option>
                    <option value="OWNER">Owner</option>
                    <option value="BOTH">Both (Owner Occupied)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : initialData ? "Update User" : "Create User"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
