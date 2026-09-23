"use client";

import React from "react";
import { Building2, Layers, Trash2, Edit } from "lucide-react";
import { BlockItem } from "../types/index";
import { useAuth } from "../../../hooks/use-auth";
import { usePagination } from "../../../hooks/use-pagination";
import { Pagination } from "../../../components/Pagination";

export interface BlockCardGridProps {
  blocks: BlockItem[];
  pageSize?: number;
  onDelete: (id: number) => void;
  onEdit?: (block: BlockItem) => void;
}

export function BlockCardGrid({
  blocks,
  pageSize = 10,
  onDelete,
  onEdit,
}: BlockCardGridProps) {
  const { paginatedItems: paginatedBlocks, paginationProps } = usePagination(blocks, pageSize);
  const { hasRole } = useAuth();
  const isSecretary = hasRole("SECRETARY");

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

  return (
    <div className="custom-table-container">
      <table className="custom-table" style={{ minWidth: "850px" }}>
        <thead>
          <tr>
            <th style={{ whiteSpace: "nowrap" }}>Tower / Building</th>
            <th style={{ whiteSpace: "nowrap" }}>Description</th>
            <th style={{ whiteSpace: "nowrap" }}>Total Floors</th>
            <th style={{ whiteSpace: "nowrap" }}>Status</th>
            <th style={{ textAlign: "right", whiteSpace: "nowrap", minWidth: "120px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedBlocks.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                No towers or blocks found. Click "Add Building / Tower" to create one.
              </td>
            </tr>
          ) : (
            paginatedBlocks.map((block) => (
              <tr key={block.id}>
                {/* Tower Name & Icon */}
                <td style={{ whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "8px",
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={20} color="#059669" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                        {block.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        ID #{block.id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Description */}
                <td>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.4 }}>
                    {block.description || "Residential tower in the society campus"}
                  </span>
                </td>

                {/* Total Floors */}
                <td style={{ whiteSpace: "nowrap" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#334155" }}>
                    <Layers size={15} color="#10b981" />
                    <span>{block.totalFloors} Floors</span>
                  </div>
                </td>

                {/* Status */}
                <td style={{ whiteSpace: "nowrap" }}>{getStatusBadge(block.status)}</td>

                {/* Actions */}
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {isSecretary && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(block)}
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
                          title="Edit Tower"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(block.id)}
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
                        title="Delete Tower"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Common Pagination */}
      <Pagination {...paginationProps} itemLabel="towers" />
    </div>
  );
}

// Export BlockTable alias
export const BlockTable = BlockCardGrid;
