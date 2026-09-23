"use client";

import React from "react";
import {
  Trash2,
  Edit,
  Receipt,
  CheckCircle2,
  PieChart,
  AlertCircle,
} from "lucide-react";
import { UserItem } from "../types/index";
import { useAuth } from "../../../hooks/use-auth";
import { FlatItem } from "../../flats/types/index";
import { TransactionItem } from "../../transactions/types/index";
import { usePagination } from "../../../hooks/use-pagination";
import { Pagination } from "../../../components/Pagination";

interface UserTableProps {
  users: UserItem[];
  flats?: FlatItem[];
  transactions?: TransactionItem[];
  monthlyDueAmount?: number;
  pageSize?: number;
  onDelete: (id: number) => void;
  onEdit?: (user: UserItem) => void;
  onPayDues?: (user: UserItem, flat?: FlatItem) => void;
}

export function UserTable({
  users,
  flats = [],
  transactions = [],
  monthlyDueAmount = 4000,
  pageSize = 10,
  onDelete,
  onEdit,
  onPayDues,
}: UserTableProps) {
  const { paginatedItems: paginatedUsers, paginationProps } = usePagination(users, pageSize);
  const { user: currentUser, hasRole } = useAuth();
  const isSecretary = hasRole("SECRETARY");
  const isStaff = hasRole(["SECRETARY", "ACCOUNTANT"]);
  const isResident = currentUser?.role === "USER";

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SECRETARY":
        return <span className="badge badge-secretary">Secretary</span>;
      case "ACCOUNTANT":
        return <span className="badge badge-accountant">Accountant</span>;
      case "SECURITY":
        return <span className="badge badge-security">Security</span>;
      default:
        return <span className="badge badge-user">Resident</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="badge badge-active" style={{ fontSize: "0.72rem" }}>Active</span>;
      case "PENDING":
        return <span className="badge badge-occupied" style={{ fontSize: "0.72rem" }}>Pending</span>;
      default:
        return <span className="badge badge-vacant" style={{ fontSize: "0.72rem" }}>Inactive</span>;
    }
  };

  // Helper to calculate user's dues status
  const getUserDuesInfo = (user: UserItem, userFlats: FlatItem[]) => {
    if (user.role === "SECURITY" && userFlats.length === 0) {
      return {
        type: "EXEMPT" as const,
        label: "Staff (Exempt)",
        remaining: 0,
        paid: 0,
      };
    }

    // No flat assigned -> No dues
    if (userFlats.length === 0) {
      return {
        type: "NONE" as const,
        label: "-",
        remaining: 0,
        paid: 0,
      };
    }

    // Find any transaction for this user or their assigned flats
    const userTxn = transactions.find(
      (t) =>
        t.payerId === user.id ||
        t.payerName.trim().toLowerCase() === user.name.trim().toLowerCase() ||
        userFlats.some((f) => f.id === t.flatId)
    );

    if (userTxn) {
      const paidVal = parseFloat(userTxn.amount) || 0;
      const remVal = userTxn.balanceRemaining
        ? parseFloat(userTxn.balanceRemaining)
        : Math.max(0, monthlyDueAmount - paidVal);

      if (userTxn.paymentPlan === "FULL" || (remVal === 0 && paidVal >= monthlyDueAmount)) {
        return {
          type: "SETTLED" as const,
          label: "Settled (Fully Paid)",
          remaining: 0,
          paid: paidVal,
        };
      }

      if (userTxn.paymentPlan === "PARTIAL" || remVal > 0) {
        return {
          type: "PARTIAL" as const,
          label: `Partial (₹${remVal.toLocaleString("en-IN")} Pending)`,
          remaining: remVal,
          paid: paidVal,
        };
      }
    }

    // No payment record found -> Pending
    return {
      type: "PENDING" as const,
      label: `Pending (₹${monthlyDueAmount.toLocaleString("en-IN")} Due)`,
      remaining: monthlyDueAmount,
      paid: 0,
    };
  };

  return (
    <div className="custom-table-container">
      <table className="custom-table" style={{ minWidth: "1050px" }}>
        <thead>
          <tr>
            <th style={{ whiteSpace: "nowrap" }}>User</th>
            <th style={{ whiteSpace: "nowrap" }}>Role</th>
            <th style={{ whiteSpace: "nowrap" }}>Assigned Flat & Tower</th>
            <th style={{ whiteSpace: "nowrap" }}>Dues</th>
            <th style={{ whiteSpace: "nowrap" }}>Phone</th>
            <th style={{ whiteSpace: "nowrap" }}>Status</th>
            <th style={{ textAlign: "right", whiteSpace: "nowrap", minWidth: "180px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                No users found matching your criteria.
              </td>
            </tr>
          ) : (
            paginatedUsers.map((user) => {
              const assignedFlats = flats.filter(
                (f) => f.residentId === user.id || f.ownerId === user.id
              );

              const duesInfo = getUserDuesInfo(user, assignedFlats);
              const isCurrentUser = currentUser?.id === user.id || currentUser?.name === user.name;
              const canPayThisUser = isStaff || (isResident && isCurrentUser);

              return (
                <tr key={user.id}>
                  {/* User Profile */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{user.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{user.email}</div>
                  </td>

                  {/* Role */}
                  <td style={{ whiteSpace: "nowrap" }}>{getRoleBadge(user.role)}</td>

                  {/* Assigned Flat & Tower */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    {assignedFlats.length > 0 ? (
                      assignedFlats.map((flat) => (
                        <div key={flat.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginRight: "8px" }}>
                          <span
                            style={{
                              backgroundColor: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              color: "#334155",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                            }}
                          >
                            {flat.blockName ? `${flat.blockName} - ` : ""}Flat {flat.flatNumber}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.825rem", fontStyle: "italic" }}>
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/*  Dues Status */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    {duesInfo.type === "NONE" && (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>--</span>
                    )}

                    {duesInfo.type === "EXEMPT" && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.775rem",
                          fontWeight: 600,
                          backgroundColor: "#f1f5f9",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        {duesInfo.label}
                      </span>
                    )}

                    {duesInfo.type === "SETTLED" && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.775rem",
                          fontWeight: 600,
                          backgroundColor: "#ecfdf5",
                          color: "#047857",
                          border: "1px solid #a7f3d0",
                        }}
                      >
                        <CheckCircle2 size={13} color="#059669" />
                        <span>Settled (₹{duesInfo.paid.toLocaleString("en-IN")})</span>
                      </span>
                    )}

                    {duesInfo.type === "PARTIAL" && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.775rem",
                          fontWeight: 600,
                          backgroundColor: "#fffbeb",
                          color: "#b45309",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <PieChart size={13} color="#d97706" />
                        <span>Partially Paid (₹{duesInfo.remaining.toLocaleString("en-IN")} due)</span>
                      </span>
                    )}

                    {duesInfo.type === "PENDING" && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.775rem",
                          fontWeight: 600,
                          backgroundColor: "#fef2f2",
                          color: "#b91c1c",
                          border: "1px solid #fecaca",
                        }}
                      >
                        <AlertCircle size={13} color="#ef4444" />
                        <span>Pending Due (₹{duesInfo.remaining.toLocaleString("en-IN")})</span>
                      </span>
                    )}
                  </td>

                  {/* Phone */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {user.phone || "-"}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ whiteSpace: "nowrap" }}>{getStatusBadge(user.status)}</td>

                  {/* Actions: Pay Dues Button + Secretary Controls */}
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", minWidth: "180px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                      {/* Pay  Dues CTA Button */}
                      {canPayThisUser &&
                        assignedFlats.length > 0 &&
                        duesInfo.type !== "NONE" &&
                        duesInfo.type !== "EXEMPT" &&
                        duesInfo.type !== "SETTLED" &&
                        onPayDues && (
                          <button
                            onClick={() => {
                              if (assignedFlats[0]?.blockName) {
                                onPayDues(user, assignedFlats[0]);
                              }
                            }}
                            disabled={!assignedFlats[0]?.blockName}
                            className="btn"
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: assignedFlats[0]?.blockName ? "#ecfdf5" : "#f3f4f6",
                              color: assignedFlats[0]?.blockName ? "#047857" : "#9ca3af",
                              border: assignedFlats[0]?.blockName
                                ? "1px solid #a7f3d0"
                                : "1px solid #d1d5db",
                              boxShadow: assignedFlats[0]?.blockName
                                ? "0 1px 3px rgba(16, 185, 129, 0.1)"
                                : "none",
                              transition: "all 0.15s ease",
                              cursor: assignedFlats[0]?.blockName ? "pointer" : "not-allowed",
                              flexShrink: 0,
                              opacity: assignedFlats[0]?.blockName ? 1 : 0.6,
                            }}
                            title={
                              assignedFlats[0]?.blockName
                                ? `Pay  Dues for ${user.name}`
                                : "Block name is not available"
                            }
                          >
                            <Receipt size={14} color={assignedFlats[0]?.blockName ? "#059669" : "#9ca3af"} />
                            <span>Pay Dues</span>
                          </button>
                        )}

                      {/* Secretary Edit & Delete Actions */}
                      {isSecretary && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(user)}
                              className="btn btn-secondary"
                              style={{
                                padding: 0,
                                width: "32px",
                                height: "32px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyItems: "center",
                                justifyContent: "center",
                                borderRadius: "6px",
                                flexShrink: 0,
                              }}
                              title="Edit User & Tower / Flat"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(user.id)}
                            className="btn btn-danger"
                            style={{
                              padding: 0,
                              width: "32px",
                              height: "32px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "6px",
                              flexShrink: 0,
                            }}
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Common Pagination */}
      <Pagination {...paginationProps} itemLabel="users" />
    </div>
  );
}
