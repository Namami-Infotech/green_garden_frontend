"use client";

import React from "react";
import {
  Trash2,
  Edit,
  Receipt,
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
  const {
    paginatedItems: paginatedUsers,
    paginationProps,
  } = usePagination(users, pageSize);

  const { user: currentUser, hasRole } = useAuth();

  const isSecretary = hasRole("SECRETARY");
  const isStaff = hasRole(["SECRETARY", "ACCOUNTANT"]);
  const isResident = currentUser?.role === "USER";

  /**
   * Role Badge
   */
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SECRETARY":
        return (
          <span className="badge badge-secretary">
            Secretary
          </span>
        );

      case "ACCOUNTANT":
        return (
          <span className="badge badge-accountant">
            Accountant
          </span>
        );

      case "SECURITY":
        return (
          <span className="badge badge-security">
            Security
          </span>
        );

      default:
        return (
          <span className="badge badge-user">
            Resident
          </span>
        );
    }
  };

  /**
   * Status Badge
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span
            className="badge badge-active"
            style={{ fontSize: "0.72rem" }}
          >
            Active
          </span>
        );

      case "PENDING":
        return (
          <span
            className="badge badge-occupied"
            style={{ fontSize: "0.72rem" }}
          >
            Pending
          </span>
        );

      default:
        return (
          <span
            className="badge badge-vacant"
            style={{ fontSize: "0.72rem" }}
          >
            Inactive
          </span>
        );
    }
  };

  /**
   * Normalize a month-ish value into a comparable number.
   * Accepts: "2024-05", "May 2024", "2024-05-01", "May", Date, etc.
   * Returns -1 for invalid/null.
   */
  const monthOrder = (value: any): number => {
    if (value == null) return -1;

    // If it's already a Date
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? -1 : value.getTime();
    }

    const str = String(value).trim();
    if (!str) return -1;

    // Try direct parse (handles ISO, "2024-05-01", "May 2024", etc.)
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.getTime();
    }

    // Try "YYYY-MM" manually (some browsers don't parse it)
    const ym = str.match(/^(\d{4})-(\d{1,2})$/);
    if (ym) {
      const d = new Date(Number(ym[1]), Number(ym[2]) - 1, 1);
      return isNaN(d.getTime()) ? -1 : d.getTime();
    }

    return -1;
  };

  /**
   * Extract the "paid till" month from a transaction object.
   * Tries many possible field names.
   */
  const extractToMonth = (t: any): any => {
    if (!t) return null;

    return (
      t.toMonth ??
      t.to_month ??
      t.toMonthName ??
      t.to_month_name ??
      t.paidTill ??
      t.paid_till ??
      t.paidUntil ??
      t.paid_until ??
      t.dueMonth ??
      t.due_month ??
      t.periodTo ??
      t.period_to ??
      t.month ??
      t.period ??
      null
    );
  };

  /**
   * Extract the "from month" for display (optional).
   */
  const extractFromMonth = (t: any): any => {
    if (!t) return null;

    return (
      t.fromMonth ??
      t.from_month ??
      t.fromMonthName ??
      t.from_month_name ??
      t.periodFrom ??
      t.period_from ??
      null
    );
  };

  /**
   * Calculate user's dues information
   */
  const getUserDuesInfo = (
    user: UserItem,
    userFlats: FlatItem[]
  ) => {
    /**
     * SECURITY without flat = exempt
     */
    if (
      user.role === "SECURITY" &&
      userFlats.length === 0
    ) {
      return {
        type: "EXEMPT" as const,
        label: "Staff (Exempt)",
        remaining: 0,
        paid: 0,
        fromMonth: null,
        toMonth: null,
      };
    }

    /**
     * No flat assigned
     */
    if (userFlats.length === 0) {
      return {
        type: "NONE" as const,
        label: "-",
        remaining: 0,
        paid: 0,
        fromMonth: null,
        toMonth: null,
      };
    }

    /**
     * Find all successful transactions
     * belonging to this user.
     */
    const userTransactions = transactions
      .filter((transaction) => {
        const t = transaction as any;

        const payerId =
          t.payerId ??
          t.userId ??
          t.residentId ??
          t.ownerId ??
          t.payer?.id ??
          t.user?.id ??
          null;

        const payerName =
          t.payerName ??
          t.userName ??
          t.residentName ??
          t.ownerName ??
          t.payer?.name ??
          t.user?.name ??
          null;

        const userIdMatched =
          payerId != null &&
          Number(payerId) === Number(user.id);

        const userNameMatched =
          payerName != null &&
          user.name != null &&
          String(payerName)
            .trim()
            .toLowerCase() ===
          String(user.name)
            .trim()
            .toLowerCase();

        const transactionFlatId =
          t.flatId ??
          t.flat_id ??
          t.flat?.id ??
          null;

        const flatIdMatched = userFlats.some(
          (flat) =>
            transactionFlatId != null &&
            Number(transactionFlatId) ===
            Number(flat.id)
        );

        const transactionFlatNumber =
          t.flatNumber ??
          t.flat_number ??
          t.flat?.flatNumber ??
          null;

        const transactionBlockName =
          t.blockName ??
          t.block_name ??
          t.flat?.blockName ??
          null;

        const flatNumberMatched = userFlats.some(
          (flat) => {
            const sameFlat =
              transactionFlatNumber != null &&
              String(transactionFlatNumber) ===
              String(flat.flatNumber);

            const sameBlock =
              !transactionBlockName ||
              !flat.blockName ||
              String(transactionBlockName)
                .trim()
                .toLowerCase() ===
              String(flat.blockName)
                .trim()
                .toLowerCase();

            return sameFlat && sameBlock;
          }
        );

        const isSuccessful =
          String(t.status || "").toUpperCase() ===
          "SUCCESS";

        return (
          isSuccessful &&
          (
            userIdMatched ||
            userNameMatched ||
            flatIdMatched ||
            flatNumberMatched
          )
        );
      })
      /**
       * Latest transaction first
       */
      .sort((a, b) => {
        const dateA = new Date(
          (a as any).createdAt || 0
        ).getTime();

        const dateB = new Date(
          (b as any).createdAt || 0
        ).getTime();

        return dateB - dateA;
      });

    /**
     * No payment found at all
     */
    if (userTransactions.length === 0) {
      return {
        type: "PENDING" as const,
        label: "Pending",
        remaining: monthlyDueAmount,
        paid: 0,
        fromMonth: null,
        toMonth: null,
      };
    }

    /**
     * Walk ALL transactions and pick the furthest "toMonth"
     * (i.e. the latest month the user has paid up to).
     */
    let bestToMonth: any = null;
    let bestFromMonth: any = null;
    let totalPaid = 0;

    for (const txn of userTransactions) {
      const t = txn as any;

      totalPaid += Number(t.amount) || 0;

      const candidateTo = extractToMonth(t);
      if (
        candidateTo != null &&
        monthOrder(candidateTo) >
        monthOrder(bestToMonth)
      ) {
        bestToMonth = candidateTo;
        // Capture the fromMonth that came with the best toMonth
        const candidateFrom = extractFromMonth(t);
        if (candidateFrom != null) {
          bestFromMonth = candidateFrom;
        }
      }
    }

    /**
     * If no transaction carried a toMonth field, fall back
     * to the latest transaction's toMonth (which is null),
     * and mark as PENDING so the Pay Dues button shows.
     */
    if (bestToMonth == null) {
      return {
        type: "PENDING" as const,
        label: "Pending",
        remaining: monthlyDueAmount,
        paid: totalPaid,
        fromMonth: null,
        toMonth: null,
      };
    }

    return {
      type: "SETTLED" as const,
      label: "Paid",
      remaining: 0,
      paid: totalPaid,
      fromMonth: bestFromMonth,
      toMonth: bestToMonth,
    };
  };

  return (
    <div className="custom-table-container">
      <div className="table-scroll-wrapper">
        <table
          className="custom-table"
          style={{ minWidth: "1050px" }}
        >
          <thead>
            <tr>
              <th style={{ whiteSpace: "nowrap" }}>
                User
              </th>

              <th style={{ whiteSpace: "nowrap" }}>
                Role
              </th>

              <th style={{ whiteSpace: "nowrap" }}>
                Assigned House & Block
              </th>

              <th style={{ whiteSpace: "nowrap" }}>
                til end of month
              </th>

              <th style={{ whiteSpace: "nowrap" }}>
                Phone
              </th>

              <th style={{ whiteSpace: "nowrap" }}>
                Status
              </th>

              <th
                style={{
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  minWidth: "180px",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--text-muted)",
                  }}
                >
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                /**
                 * Find flats assigned to this user
                 */
                const assignedFlats = flats.filter(
                  (f) =>
                    Number(f.residentId) ===
                    Number(user.id) ||
                    Number(f.ownerId) ===
                    Number(user.id)
                );

                /**
                 * Get dues information
                 */
                const duesInfo = getUserDuesInfo(
                  user,
                  assignedFlats
                );

                /**
                 * Current logged-in user
                 */
                const isCurrentUser =
                  currentUser?.id === user.id ||
                  currentUser?.name === user.name;

                /**
                 * Who can pay
                 */
                const canPayThisUser =
                  isStaff ||
                  (isResident && isCurrentUser);

                return (
                  <tr key={user.id}>
                    {/* ================= USER ================= */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.name}
                      </div>

                      <div
                        style={{
                          fontSize: "0.8rem",
                          color:
                            "var(--text-secondary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.email}
                      </div>
                    </td>

                    {/* ================= ROLE ================= */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {getRoleBadge(user.role)}
                    </td>

                    {/* ================= FLAT ================= */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {assignedFlats.length > 0 ? (
                        assignedFlats.map((flat) => (
                          <div
                            key={flat.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              marginRight: "8px",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor:
                                  "#f1f5f9",
                                border:
                                  "1px solid #cbd5e1",
                                color: "#334155",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                              }}
                            >
                              {flat.blockName
                                ? `${flat.blockName} - `
                                : ""}
                              House {flat.flatNumber}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span
                          style={{
                            color:
                              "var(--text-muted)",
                            fontSize: "0.825rem",
                            fontStyle: "italic",
                          }}
                        >
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* ================= PAID TILL ================= */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {duesInfo.toMonth
                        ? String(duesInfo.toMonth)
                        : "-"}
                    </td>

                    {/* ================= PHONE ================= */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          color:
                            "var(--text-secondary)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {user.phone || "-"}
                      </span>
                    </td>

                    {/* ================= STATUS ================= */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {getStatusBadge(user.status)}
                    </td>

                    {/* ================= ACTIONS ================= */}
                    <td
                      style={{
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        minWidth: "180px",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          justifyContent: "flex-end",
                        }}
                      >
                        {/* ================= PAY DUES ================= */}
                        {canPayThisUser &&
                          assignedFlats.length > 0 &&
                          duesInfo.type !== "NONE" &&
                          duesInfo.type !== "EXEMPT" &&
                          duesInfo.type !== "SETTLED" &&
                          onPayDues && (
                            <button
                              onClick={() => {
                                if (
                                  assignedFlats[0]
                                    ?.blockName
                                ) {
                                  onPayDues(
                                    user,
                                    assignedFlats[0]
                                  );
                                }
                              }}
                              disabled={
                                !assignedFlats[0]
                                  ?.blockName
                              }
                              className="btn"
                              style={{
                                padding:
                                  "6px 12px",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                borderRadius: "6px",
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                gap: "6px",

                                backgroundColor:
                                  assignedFlats[0]
                                    ?.blockName
                                    ? "#ecfdf5"
                                    : "#f3f4f6",

                                color:
                                  assignedFlats[0]
                                    ?.blockName
                                    ? "#047857"
                                    : "#9ca3af",

                                border:
                                  assignedFlats[0]
                                    ?.blockName
                                    ? "1px solid #a7f3d0"
                                    : "1px solid #d1d5db",

                                boxShadow:
                                  assignedFlats[0]
                                    ?.blockName
                                    ? "0 1px 3px rgba(16, 185, 129, 0.1)"
                                    : "none",

                                transition:
                                  "all 0.15s ease",

                                cursor:
                                  assignedFlats[0]
                                    ?.blockName
                                    ? "pointer"
                                    : "not-allowed",

                                flexShrink: 0,

                                opacity:
                                  assignedFlats[0]
                                    ?.blockName
                                    ? 1
                                    : 0.6,
                              }}
                              title={
                                assignedFlats[0]
                                  ?.blockName
                                  ? `Pay Dues for ${user.name}`
                                  : "Block name is not available"
                              }
                            >
                              <Receipt
                                size={14}
                                color={
                                  assignedFlats[0]
                                    ?.blockName
                                    ? "#059669"
                                    : "#9ca3af"
                                }
                              />

                              <span>
                                Pay Dues
                              </span>
                            </button>
                          )}

                        {/* ================= SECRETARY ACTIONS ================= */}
                        {isSecretary && (
                          <div
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: "6px",
                              flexShrink: 0,
                            }}
                          >
                            {/* EDIT */}
                            {onEdit && (
                              <button
                                onClick={() =>
                                  onEdit(user)
                                }
                                className="btn btn-secondary"
                                style={{
                                  padding: 0,
                                  width: "32px",
                                  height: "32px",
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  borderRadius:
                                    "6px",
                                  flexShrink: 0,
                                }}
                                title="Edit User & Tower / Flat"
                              >
                                <Edit size={14} />
                              </button>
                            )}

                            {/* DELETE */}
                            <button
                              onClick={() =>
                                onDelete(user.id)
                              }
                              className="btn btn-danger"
                              style={{
                                padding: 0,
                                width: "32px",
                                height: "32px",
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
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
      </div>

      {/* ================= PAGINATION ================= */}
      <Pagination
        {...paginationProps}
        itemLabel="users"
      />
    </div>
  );
}