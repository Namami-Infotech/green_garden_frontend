"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "../../../components/Modal";
import { CreateFlatData, FlatItem, FlatType, OccupancyStatus } from "../types/index";
import { flatValidationSchema } from "../validations/index";
import { UserCheck, User } from "lucide-react";

interface FlatFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFlatData) => Promise<void>;
  blocks: { id: number; name: string }[];
  initialData?: FlatItem | null;
  users?: { id: number; name: string; email: string }[];
}

export function FlatFormModal({
  isOpen,
  onClose,
  onSubmit,
  blocks,
  initialData,
  users = [],
}: FlatFormModalProps) {
  const [flatNumber, setFlatNumber] = useState("");
  const [blockId, setBlockId] = useState<number>(blocks[0]?.id || 1);
  const [floor, setFloor] = useState<number>(1);
  const [flatType, setFlatType] = useState<FlatType>("2BHK");
  const [occupancyStatus, setOccupancyStatus] = useState<OccupancyStatus>("VACANT");
  const [ownerId, setOwnerId] = useState<string>("");
  const [residentId, setResidentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFlatNumber(initialData.flatNumber);
      setBlockId(initialData.blockId);
      setFloor(initialData.floor);
      setFlatType(initialData.flatType);
      setOccupancyStatus(initialData.occupancyStatus);
      setOwnerId(initialData.ownerId ? String(initialData.ownerId) : "");
      setResidentId(initialData.residentId ? String(initialData.residentId) : "");
    } else {
      setFlatNumber("");
      setBlockId(blocks[0]?.id || 1);
      setFloor(1);
      setFlatType("2BHK");
      setOccupancyStatus("VACANT");
      setOwnerId("");
      setResidentId("");
    }
    setError(null);
  }, [initialData, isOpen, blocks]);

  const handleOwnerChange = (val: string) => {
    setOwnerId(val);
    if (val && !residentId) {
      // Default to owner occupied if resident not yet chosen
      setResidentId(val);
      setOccupancyStatus("OWNER_OCCUPIED");
    } else if (!val && !residentId) {
      setOccupancyStatus("VACANT");
    }
  };

  const handleResidentChange = (val: string) => {
    setResidentId(val);
    if (!val) {
      setOccupancyStatus(ownerId ? "VACANT" : "VACANT");
    } else if (val === ownerId) {
      setOccupancyStatus("OWNER_OCCUPIED");
    } else {
      setOccupancyStatus("TENANT_OCCUPIED");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedOwnerId = initialData && ownerId ? Number(ownerId) : null;
    const parsedResidentId = initialData && residentId ? Number(residentId) : null;

    const validation = flatValidationSchema.safeParse({
      flatNumber,
      blockId: Number(blockId),
      floor: Number(floor),
      flatType,
      occupancyStatus: initialData ? occupancyStatus : "VACANT",
      ownerId: parsedOwnerId,
      residentId: parsedResidentId,
    });

    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    const selectedOwner = parsedOwnerId ? users.find((u) => u.id === parsedOwnerId) : null;
    const selectedResident = parsedResidentId ? users.find((u) => u.id === parsedResidentId) : null;

    setSubmitting(true);
    try {
      await onSubmit({
        flatNumber,
        blockId: Number(blockId),
        floor: Number(floor),
        flatType,
        occupancyStatus: initialData ? occupancyStatus : "VACANT",
        ownerId: parsedOwnerId,
        residentId: parsedResidentId,
        ownerName: selectedOwner?.name || null,
        residentName: selectedResident?.name || null,
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save flat");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit Flat Unit (${initialData.flatNumber})` : "Add New Flat Unit"}
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
        {/* Basic Flat Info */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="new-flat-number">Flat / Unit Number</label>
            <input
              id="new-flat-number"
              className="form-input"
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value)}
              placeholder="e.g. 302 or A-104"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-flat-block">Tower / Block</label>
            <select
              id="new-flat-block"
              className="form-select"
              value={blockId}
              onChange={(e) => setBlockId(Number(e.target.value))}
            >
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="new-flat-floor">Floor Number</label>
            <input
              id="new-flat-floor"
              type="number"
              min="0"
              className="form-input"
              value={floor}
              onChange={(e) => setFloor(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-flat-type">Unit Layout</label>
            <select
              id="new-flat-type"
              className="form-select"
              value={flatType}
              onChange={(e) => setFlatType(e.target.value as FlatType)}
            >
              <option value="1BHK">1 BHK</option>
              <option value="2BHK">2 BHK</option>
              <option value="3BHK">3 BHK</option>
              <option value="4BHK">4 BHK</option>
              <option value="PENTHOUSE">Penthouse</option>
              <option value="STUDIO">Studio</option>
            </select>
          </div>
        </div>

        {/* Resident & Owner Assignment Section - Only available when editing an existing flat */}
        {initialData && (
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
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <UserCheck size={16} color="var(--primary-color)" />
              User Assignment (Owner & Resident)
            </div>

            <div className="form-grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="flat-owner">
                  Select Owner (User)
                </label>
                <select
                  id="flat-owner"
                  className="form-select"
                  value={ownerId}
                  onChange={(e) => handleOwnerChange(e.target.value)}
                >
                  <option value="">-- None / Unassigned --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="flat-resident">
                  Select Resident / Tenant (User)
                </label>
                <select
                  id="flat-resident"
                  className="form-select"
                  value={residentId}
                  onChange={(e) => handleResidentChange(e.target.value)}
                >
                  <option value="">-- Vacant / Unassigned --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {ownerId && (
              <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                  onClick={() => handleResidentChange(ownerId)}
                >
                  <User size={12} /> Set Resident same as Owner
                </button>
                {residentId && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                    onClick={() => handleResidentChange("")}
                  >
                    Clear Resident
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Occupancy Status - only shown when editing an existing flat */}
        {initialData && (
          <div className="form-group">
            <label className="form-label" htmlFor="new-flat-status">Occupancy Status</label>
            <select
              id="new-flat-status"
              className="form-select"
              value={occupancyStatus}
              onChange={(e) => setOccupancyStatus(e.target.value as OccupancyStatus)}
            >
              <option value="VACANT">Vacant (Unoccupied)</option>
              <option value="OWNER_OCCUPIED">Owner Occupied</option>
              <option value="TENANT_OCCUPIED">Tenant Occupied</option>
            </select>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : initialData ? "Update Flat" : "Create Flat"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
