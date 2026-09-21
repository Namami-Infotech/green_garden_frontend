import { useState, useMemo, useEffect } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  resetOnDataChange?: boolean;
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions | number = 10
) {
  const initialPageSize =
    typeof options === "number" ? options : options.initialPageSize ?? 10;
  const initialPage =
    typeof options === "number" ? 1 : options.initialPage ?? 1;
  const resetOnDataChange =
    typeof options === "number" ? true : options.resetOnDataChange ?? true;

  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 if item count changes significantly or filters are applied
  useEffect(() => {
    if (resetOnDataChange) {
      setCurrentPage((prev) => (prev > totalPages ? Math.max(1, totalPages) : prev));
    }
  }, [totalItems, totalPages, resetOnDataChange]);

  const setPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const setPageSize = (newSize: number) => {
    setPageSizeState(newSize);
    setCurrentPage(1);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    canNextPage: currentPage < totalPages,
    canPrevPage: currentPage > 1,
    paginationProps: {
      currentPage,
      totalPages,
      totalItems,
      pageSize,
      startIndex,
      endIndex,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    },
  };
}
