"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import { BlockCardGrid } from "../../modules/blocks/components/BlockCardGrid";
import { BlockFormModal } from "../../modules/blocks/components/BlockFormModal";
import { blockService } from "../../modules/blocks/services/block.service";
import { BlockItem, CreateBlockData } from "../../modules/blocks/types/index";
import { useAuth } from "../../hooks/use-auth";
import { useToast } from "../../hooks/use-toast";

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockItem | null>(null);
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const isSecretary = hasRole("SECRETARY");

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const data = await blockService.getBlocks();
      setBlocks(data);
    } catch (e) {
      console.error("Failed to load blocks", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleSaveBlock = async (data: CreateBlockData) => {
    try {
      if (editingBlock) {
        await blockService.updateBlock(editingBlock.id, data);
        toast.success(`Tower block "${data.name}" updated successfully!`, "Block Updated");
      } else {
        await blockService.createBlock(data);
        toast.success(`Tower block "${data.name}" created successfully!`, "Block Created");
      }
      await fetchBlocks();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to save block", "Error");
    }
  };

  const handleOpenAddModal = () => {
    setEditingBlock(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (block: BlockItem) => {
    setEditingBlock(block);
    setIsModalOpen(true);
  };

  const handleDeleteBlock = async (id: number) => {
    if (confirm("Are you sure you want to remove this tower block?")) {
      try {
        await blockService.deleteBlock(id);
        toast.success("Tower block removed successfully!", "Block Deleted");
        await fetchBlocks();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to delete block", "Error");
      }
    }
  };

  return (
    <DashboardShell title="Towers & Blocks Management">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="page-header-row">
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Configure and manage society wings, high-rise towers, and floor layouts.
            </p>
          </div>
          {isSecretary && (
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Add Building / Tower
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
            Loading towers & blocks...
          </div>
        ) : (
          <BlockCardGrid
            blocks={blocks}
            onDelete={handleDeleteBlock}
            onEdit={handleOpenEditModal}
          />
        )}

        <BlockFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBlock(null);
          }}
          onSubmit={handleSaveBlock}
          initialData={editingBlock}
        />
      </div>
    </DashboardShell>
  );
}
