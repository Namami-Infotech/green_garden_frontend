"use client";

import React from "react";
import { Home, User, UserCheck, Trash2, Edit, Receipt } from "lucide-react";
import { FlatItem } from "../types/index";
import { useAuth } from "../../../hooks/use-auth";
import { usePagination } from "../../../hooks/use-pagination";
import { Pagination } from "../../../components/Pagination";

export interface FlatGridProps {
  flats: FlatItem[];
  pageSize?: number;
  onDelete: (id: number) => void;
  onEdit?: (flat: FlatItem) => void;
  onPayDues?: (flat: FlatItem) => void;
}

export function FlatGrid({
  flats,
  pageSize = 10,
  onDelete,
  onEdit,
  onPayDues,
}: FlatGridProps) {
  const { paginatedItems: paginatedFlats, paginationProps } = usePagination(flats, pageSize);
  const { hasRole, user } = useAuth();
  const isSecretary = hasRole("SECRETARY");
  const isStaff = hasRole(["SECRETARY", "ACCOUNTANT"]);
  const isResident = user?.role === "USER";

  const getOccupancyBadge = (status: string) => {
    switch (status) {
      case "OWNER_OCCUPIED":
        return <span className="badge badge-active">Owner Occupied</span>;
      case "TENANT_OCCUPIED":
        return <span className="badge badge-occupied">Tenant Occupied</span>;
      default:
        return <span className="badge badge-vacant">Vacant</span>;
    }
  };

  return (
    <div className="custom-table-container">
      <table className="custom-table" style={{ minWidth: "950px" }}>
        <thead>
          <tr>
            <th style={{ whiteSpace: "nowrap" }}>Flat Unit</th>
            <th style={{ whiteSpace: "nowrap" }}>Tower & Floor</th>
            <th style={{ whiteSpace: "nowrap" }}>Flat Type</th>
            <th style={{ whiteSpace: "nowrap" }}>Occupancy Status</th>
            <th style={{ whiteSpace: "nowrap" }}>Owner</th>
            <th style={{ whiteSpace: "nowrap" }}>Resident</th>
            <th style={{ textAlign: "right", whiteSpace: "nowrap", minWidth: "160px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedFlats.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                No flats match your filter criteria.
              </td>
            </tr>
          ) : (
            paginatedFlats.map((flat) => {
              const isMyFlat = !!user?.id && (flat.residentId === user.id || flat.ownerId === user.id);
              const canPayDues = (isStaff || (isResident && isMyFlat)) && flat.occupancyStatus !== "VACANT";

              return (
                <tr key={flat.id}>
                  {/* Flat Unit */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Home size={18} color="#059669" />
                      </div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                        Flat {flat.flatNumber}
                      </div>
                    </div>
                  </td>

                  {/* Tower & Floor */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 600, color: "#334155" }}>
                      {flat.blockName || `Tower ${flat.blockId}`}
                    </div>
                    <div style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>
                      Floor {flat.floor}
                    </div>
                  </td>

                  {/* Flat Type */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span className="badge badge-user" style={{ fontSize: "0.72rem" }}>
                      {flat.flatType}
                    </span>
                  </td>

                  {/* Occupancy Status */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    {getOccupancyBadge(flat.occupancyStatus)}
                  </td>

                  {/* Owner */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <User size={14} color="var(--text-muted)" />
                      <span
                        style={{
                          fontWeight: flat.ownerName ? 600 : 400,
                          color: flat.ownerName ? "#0f172a" : "var(--text-muted)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {flat.ownerName || "Unassigned"}
                      </span>
                    </div>
                  </td>

                  {/* Resident */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <UserCheck size={14} color="var(--text-muted)" />
                      <span
                        style={{
                          fontWeight: flat.residentName ? 600 : 400,
                          color: flat.residentName ? "#0f172a" : "var(--text-muted)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {flat.residentName || (flat.occupancyStatus === "VACANT" ? "Vacant" : "Unassigned")}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                      {canPayDues && onPayDues && (
                        <button
                          onClick={() => onPayDues(flat)}
                          className="btn"
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: "#ecfdf5",
                            color: "#047857",
                            border: "1px solid #a7f3d0",
                            boxShadow: "0 1px 3px rgba(16, 185, 129, 0.1)",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                          title={`Pay Maintenance Dues for Flat ${flat.flatNumber}`}
                        >
                          <Receipt size={14} color="#059669" />
                          <span>Pay Dues</span>
                        </button>
                      )}

                      {isSecretary && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(flat)}
                              className="btn btn-secondary"
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
                              title="Edit & Assign Flat"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(flat.id)}
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
                            title="Delete Flat"
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
      <Pagination {...paginationProps} itemLabel="flats" />
    </div>
  );
}

// Export FlatTable alias for clarity
export const FlatTable = FlatGrid;
