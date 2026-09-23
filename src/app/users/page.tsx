"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import { UserTable } from "../../modules/users/components/UserTable";
import { UserFormModal, FlatAssignmentOption } from "../../modules/users/components/UserFormModal";
import { userService } from "../../modules/users/services/user.service";
import { flatService } from "../../modules/flats/services/flat.service";
import { CreateUserData, UserItem } from "../../modules/users/types/index";
import { FlatItem } from "../../modules/flats/types/index";
import { useAuth } from "../../hooks/use-auth";
import { UserRole } from "../../modules/auth/types/index";
import { TransactionModal } from "../../modules/transactions/components/TransactionModal";
import { transactionService } from "../../modules/transactions/services/transaction.service";
import { settingService } from "../../modules/settings/services/setting.service";
import { CreateTransactionData, TransactionItem } from "../../modules/transactions/types/index";
import { useToast } from "../../hooks/use-toast";

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [monthlyDueAmount, setMonthlyDueAmount] = useState<number>(4000);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Direct Pay Dues Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingUser, setPayingUser] = useState<UserItem | null>(null);
  const [payingFlat, setPayingFlat] = useState<FlatItem | null>(null);

  const { hasRole } = useAuth();
  const { toast } = useToast();
  const isSecretary = hasRole("SECRETARY");
  const isAccountant = hasRole("ACCOUNTANT");

  const fetchUsersAndFlats = async () => {
    setLoading(true);
    try {
      const [usersRes, flatsRes, txnsRes, settingsRes] = await Promise.all([
        userService.getUsers({
          search: search || undefined,
          role: (roleFilter as UserRole) || undefined,
        }),
        flatService.getFlats(),
        transactionService.getTransactions(),
        settingService.getSettings(),
      ]);
      setUsers(usersRes.users);
      setFlats(flatsRes.flats);
      setTransactions(txnsRes);
      const totalDue =
        (Number(settingsRes.monthlyMaintenanceRate) || 3500) +
        (Number(settingsRes.monthlySecurityCharge) || 500);
      setMonthlyDueAmount(totalDue);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndFlats();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsersAndFlats();
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (data: CreateUserData, assignment?: FlatAssignmentOption) => {
    let savedUser: UserItem;

    if (editingUser) {
      // Find previous flat assignment if any
      const oldFlat = flats.find(
        (f) => f.residentId === editingUser.id || f.ownerId === editingUser.id
      );

      const updatePayload: {
        name?: string;
        email?: string;
        phone?: string;
        password?: string;
        role?: UserRole;
        status?: "ACTIVE" | "INACTIVE" | "PENDING";
      } = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
      };

      if (data.password && data.password.trim().length >= 6) {
        updatePayload.password = data.password.trim();
      }

      savedUser = await userService.updateUser(editingUser.id, updatePayload);

      // If flat assignment changed or removed, clear the old flat
      if (oldFlat && (!assignment || oldFlat.id !== assignment.flatId)) {
        const isOldResident = oldFlat.residentId === editingUser.id;
        const isOldOwner = oldFlat.ownerId === editingUser.id;
        const remainingOwnerId = isOldOwner ? null : oldFlat.ownerId;
        const remainingResidentId = isOldResident ? null : oldFlat.residentId;

        await flatService.updateFlat(oldFlat.id, {
          residentId: remainingResidentId,
          residentName: remainingResidentId ? oldFlat.residentName : null,
          ownerId: remainingOwnerId,
          ownerName: remainingOwnerId ? oldFlat.ownerName : null,
          occupancyStatus: remainingResidentId ? "TENANT_OCCUPIED" : "VACANT",
        });
      }
    } else {
      savedUser = await userService.createUser(data);
    }

    // Apply new flat / tower assignment if selected
    if (assignment && assignment.flatId) {
      const targetFlat = flats.find((f) => f.id === assignment.flatId);
      const isSameFlat = editingUser && targetFlat && (targetFlat.residentId === editingUser.id || targetFlat.ownerId === editingUser.id);

      if (assignment.role === "RESIDENT") {
        await flatService.updateFlat(assignment.flatId, {
          residentId: savedUser.id,
          residentName: savedUser.name,
          ownerId: isSameFlat && targetFlat.ownerId === savedUser.id ? null : (targetFlat?.ownerId ?? null),
          ownerName: isSameFlat && targetFlat.ownerId === savedUser.id ? null : (targetFlat?.ownerName ?? null),
          occupancyStatus: "TENANT_OCCUPIED",
        });
      } else if (assignment.role === "OWNER") {
        await flatService.updateFlat(assignment.flatId, {
          ownerId: savedUser.id,
          ownerName: savedUser.name,
          residentId: isSameFlat && targetFlat.residentId === savedUser.id ? null : (targetFlat?.residentId ?? null),
          residentName: isSameFlat && targetFlat.residentId === savedUser.id ? null : (targetFlat?.residentName ?? null),
          occupancyStatus: isSameFlat && targetFlat.residentId === savedUser.id ? "VACANT" : (targetFlat?.residentId ? "TENANT_OCCUPIED" : "VACANT"),
        });
      } else if (assignment.role === "BOTH") {
        await flatService.updateFlat(assignment.flatId, {
          ownerId: savedUser.id,
          ownerName: savedUser.name,
          residentId: savedUser.id,
          residentName: savedUser.name,
          occupancyStatus: "OWNER_OCCUPIED",
        });
      }
    }

    try {
      await fetchUsersAndFlats();
      toast.success(
        editingUser ? `User "${data.name}" updated successfully!` : `User "${data.name}" added successfully!`,
        editingUser ? "User Updated" : "User Created"
      );
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to save user", "Error");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm("Are you sure you want to remove this user?")) {
      try {
        await userService.deleteUser(id);
        toast.success("User removed successfully!", "User Deleted");
        await fetchUsersAndFlats();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to delete user", "Error");
      }
    }
  };

  // Find currently assigned flat for the user being edited
  const currentAssignedFlat = editingUser
    ? flats.find((f) => f.residentId === editingUser.id || f.ownerId === editingUser.id)
    : null;

  const currentAssignedRole: "RESIDENT" | "OWNER" | "BOTH" =
    currentAssignedFlat?.residentId === editingUser?.id &&
    currentAssignedFlat?.ownerId === editingUser?.id
      ? "BOTH"
      : currentAssignedFlat?.ownerId === editingUser?.id
      ? "OWNER"
      : "RESIDENT";

  const handleOpenPayDues = (user: UserItem, flat?: FlatItem) => {
    setPayingUser(user);
    setPayingFlat(flat || null);
    setIsPayModalOpen(true);
  };

  const handleRecordPayment = async (data: CreateTransactionData) => {
    await transactionService.createTransaction(data);
    await fetchUsersAndFlats();
  };

  const residentUsers = users.filter((u) => u.role === "USER");

  return (
    <DashboardShell title="Society Residents Directory">
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
            style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, maxWidth: "600px" }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "14px", top: "12px" }}
              />
              <input
                type="text"
                placeholder="Search resident name, email, or phone..."
                className="form-input"
                style={{ paddingLeft: "42px" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>

          {isSecretary && (
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Add Resident
            </button>
          )}
        </div>

        {/* Users Table with Dues Status Column and Direct Pay Action */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
            Loading residents...
          </div>
        ) : (
          <UserTable
            users={residentUsers}
            flats={flats}
            transactions={transactions}
            monthlyDueAmount={monthlyDueAmount}
            onDelete={handleDeleteUser}
            onEdit={handleOpenEditModal}
            onPayDues={handleOpenPayDues}
          />
        )}

        {/* User Creation & Edit Modal with Flat & Tower Assignment */}
        <UserFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleSaveUser}
          flats={flats}
          initialData={editingUser}
          currentFlatId={currentAssignedFlat?.id}
          currentFlatRole={currentAssignedRole}
        />

        {/* Direct Payment Modal from User Table */}
        <TransactionModal
          isOpen={isPayModalOpen}
          onClose={() => {
            setIsPayModalOpen(false);
            setPayingUser(null);
            setPayingFlat(null);
          }}
          onSubmit={handleRecordPayment}
          flats={flats}
          initialFlatId={payingFlat?.id}
          initialPayerName={payingUser?.name}
          initialPayerId={payingUser?.id}
        />
      </div>
    </DashboardShell>
  );
}
