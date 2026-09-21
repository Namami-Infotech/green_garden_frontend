"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "../../../components/Modal";
import { BlockItem, CreateBlockData } from "../types/index";
import { blockValidationSchema } from "../validations/index";

interface BlockFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBlockData) => Promise<void>;
  initialData?: BlockItem | null;
}

export function BlockFormModal({ isOpen, onClose, onSubmit, initialData }: BlockFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalFloors, setTotalFloors] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setTotalFloors(initialData.totalFloors);
    } else {
      setName("");
      setDescription("");
      setTotalFloors(10);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = blockValidationSchema.safeParse({
      name,
      description,
      totalFloors: Number(totalFloors),
    });

    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name, description, totalFloors: Number(totalFloors) });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save block");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit Building / Tower (${initialData.name})` : "Add New Building / Tower"}
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
          <label className="form-label" htmlFor="block-name">Tower / Block Name</label>
          <input
            id="block-name"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tower D (Diamond)"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="block-floors">Total Floors</label>
          <input
            id="block-floors"
            type="number"
            min="1"
            max="120"
            className="form-input"
            value={totalFloors}
            onChange={(e) => setTotalFloors(Number(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="block-desc">Description / Features</label>
          <textarea
            id="block-desc"
            className="form-textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Garden facing, equipped with two high-speed elevators"
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : initialData ? "Update Tower" : "Create Block"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
