"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import { FlatGrid } from "../../modules/flats/components/FlatGrid";
import { FlatFormModal } from "../../modules/flats/components/FlatFormModal";
import { flatService } from "../../modules/flats/services/flat.service";
import { blockService } from "../../modules/blocks/services/block.service";
import { userService } from "../../modules/users/services/user.service";
import { CreateFlatData, FlatItem, OccupancyStatus } from "../../modules/flats/types/index";
import { BlockItem } from "../../modules/blocks/types/index";
import { UserItem } from "../../modules/users/types/index";
import { useAuth } from "../../hooks/use-auth";
import { TransactionModal } from "../../modules/transactions/components/TransactionModal";
import { transactionService } from "../../modules/transactions/services/transaction.service";
import { CreateTransactionData } from "../../modules/transactions/types/index";
import { useToast } from "../../hooks/use-toast";

export default function FlatsPage() {
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [occupancyFilter, setOccupancyFilter] = useState<string>("");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlat, setEditingFlat] = useState<FlatItem | null>(null);

  // Pay Monthly Dues Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingFlat, setPayingFlat] = useState<FlatItem | null>(null);

  const { hasRole } = useAuth();
  const { toast } = useToast();
  const isSecretary = hasRole("SECRETARY");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [flatsRes, blocksRes, usersRes] = await Promise.all([
        flatService.getFlats({
          search: search || undefined,
          occupancyStatus: (occupancyFilter as OccupancyStatus) || undefined,
          blockId: selectedBlockId ? Number(selectedBlockId) : undefined,
        }),
        blockService.getBlocks(),
        userService.getUsers(),
      ]);
      setFlats(flatsRes.flats);
      setBlocks(blocksRes);
      setUsers(usersRes.users);
    } catch (e) {
      console.error("Failed to load flats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [occupancyFilter, selectedBlockId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleSaveFlat = async (data: CreateFlatData) => {
    try {
      if (editingFlat) {
        await flatService.updateFlat(editingFlat.id, data);
        toast.success(`Flat unit "${data.flatNumber}" updated successfully!`, "Flat Updated");
      } else {
        await flatService.createFlat(data);
        toast.success(`Flat unit "${data.flatNumber}" allocated successfully!`, "Flat Allocated");
      }
      await fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to save flat", "Error");
    }
  };

  const handleOpenAddModal = () => {
    setEditingFlat(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (flat: FlatItem) => {
    setEditingFlat(flat);
    setIsModalOpen(true);
  };

  const handleDeleteFlat = async (id: number) => {
    if (confirm("Are you sure you want to remove this flat unit?")) {
      try {
        await flatService.deleteFlat(id);
        toast.success("Flat unit removed successfully!", "Flat Deleted");
        await fetchData();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to delete flat", "Error");
      }
    }
  };

  const handleOpenPayDues = (flat: FlatItem) => {
    setPayingFlat(flat);
    setIsPayModalOpen(true);
  };

  const handleRecordDuesPayment = async (data: CreateTransactionData) => {
    try {
      await transactionService.createTransaction(data);
      toast.success(
        `Monthly dues of ₹${Number(data.amount).toLocaleString("en-IN")} recorded for Flat!`,
        "Payment Recorded"
      );
      await fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to record payment", "Payment Error");
    }
  };

  return (
    <DashboardShell title="Flats & Units Inventory">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Filters and Actions */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, maxWidth: "680px" }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "14px", top: "12px" }}
              />
              <input
                type="text"
                placeholder="Search flat number or resident..."
                className="form-input"
                style={{ paddingLeft: "42px" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: "160px" }}
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
            >
              <option value="">All Towers</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: "170px" }}
              value={occupancyFilter}
              onChange={(e) => setOccupancyFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="OWNER_OCCUPIED">Owner Occupied</option>
              <option value="TENANT_OCCUPIED">Tenant Occupied</option>
              <option value="VACANT">Vacant</option>
            </select>
          </form>

          {isSecretary && (
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Add Flat Unit
            </button>
          )}
        </div>

        {/* Flats Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
            Loading flats inventory...
          </div>
        ) : (
          <FlatGrid
            flats={flats}
            onDelete={handleDeleteFlat}
            onEdit={handleOpenEditModal}
            onPayDues={handleOpenPayDues}
          />
        )}

        <FlatFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingFlat(null);
          }}
          onSubmit={handleSaveFlat}
          blocks={blocks}
          users={users}
          initialData={editingFlat}
        />

        {/* Pay Monthly Dues Modal */}
        <TransactionModal
          isOpen={isPayModalOpen}
          onClose={() => {
            setIsPayModalOpen(false);
            setPayingFlat(null);
          }}
          onSubmit={handleRecordDuesPayment}
          flats={flats}
          initialFlatId={payingFlat?.id}
        />
      </div>
    </DashboardShell>
  );
}
