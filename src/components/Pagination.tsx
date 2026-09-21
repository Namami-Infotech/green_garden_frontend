"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIndex?: number;
  endIndex?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showInfo?: boolean;
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  startIndex: customStartIndex,
  endIndex: customEndIndex,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  showPageSizeSelector = true,
  showInfo = true,
  itemLabel = "entries",
  className = "",
}: PaginationProps) {
  // If no items at all, don't show or show a minimal state
  if (totalItems === 0) {
    return null;
  }

  const start =
    customStartIndex !== undefined
      ? customStartIndex + 1
      : (currentPage - 1) * pageSize + 1;
  const end =
    customEndIndex !== undefined
      ? customEndIndex
      : Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (currentPage <= 4) {
      // Near beginning: 1, 2, 3, 4, 5, ..., totalPages
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Near end: 1, ..., totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      // Middle: 1, ..., currentPage - 1, currentPage, currentPage + 1, ..., totalPages
      pages.push(1);
      pages.push("...");
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`pagination-container ${className}`}>
      {/* Left side: Info and Page Size Selector */}
      <div className="pagination-info-wrapper">
        {showInfo && (
          <span className="pagination-info-text">
            Showing <strong className="pagination-highlight">{start}</strong> to{" "}
            <strong className="pagination-highlight">{end}</strong> of{" "}
            <strong className="pagination-highlight">{totalItems}</strong> {itemLabel}
          </span>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className="pagination-size-selector">
            <label htmlFor="pagination-page-size" className="pagination-size-label">
              Rows:
            </label>
            <select
              id="pagination-page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="pagination-select"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Navigation Buttons */}
      <div className="pagination-controls">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="pagination-btn pagination-nav-btn"
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="pagination-btn pagination-nav-btn"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Number Pills */}
        <div className="pagination-pages-group">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  &hellip;
                </span>
              );
            }

            const pageNum = Number(page);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`pagination-btn pagination-page-btn ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="pagination-btn pagination-nav-btn"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="pagination-btn pagination-nav-btn"
          title="Last Page"
          aria-label="Last Page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
