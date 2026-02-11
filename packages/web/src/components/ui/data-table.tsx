'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';

import { cn } from '@/lib/utils/cn';

interface DataTableProps<TData> {
  className?: string;
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
}

export function DataTable<TData>({ className, columns, data }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-200', className)}>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  className="px-4 py-3 font-medium text-gray-700"
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' && ' \u2191'}
                  {header.column.getIsSorted() === 'desc' && ' \u2193'}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              className="
                border-b border-gray-100
                last:border-0
              "
              key={row.id}
            >
              {row.getVisibleCells().map((cell) => (
                <td className="px-4 py-3" key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td className="px-4 py-8 text-center text-gray-500" colSpan={columns.length}>
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {table.getPageCount() > 1 && (
        <div
          className="
            flex items-center justify-between border-t border-gray-200 px-4 py-3
          "
        >
          <button
            className="
              text-sm text-gray-600
              disabled:opacity-50
            "
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            className="
              text-sm text-gray-600
              disabled:opacity-50
            "
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
