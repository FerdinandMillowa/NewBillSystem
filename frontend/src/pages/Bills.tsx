/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billsService } from "../services/bills.service";
import type { Bill } from "../types/bill.types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CreateBillModal } from "../components/bills/CreateBillModal";
import { BillTable } from "../components/bills/BillTable";
import { BillFilters } from "../components/bills/BillFilters";
import { ExportButton } from "../components/ui/ExportButton";
import { useExport } from "../hooks/useExport";
import type { ExportFormat } from "../hooks/useExport";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PlusIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  formatCurrency,
  formatDate,
  formatCustomerName,
} from "../utils/formatters";

// Column definitions for all three export formats
const BILL_EXPORT_COLUMNS = [
  {
    header: "Bill ID",
    accessor: (b: Bill) => `#${b.id.substring(0, 8).toUpperCase()}`,
    width: 14,
  },
  {
    header: "Customer",
    accessor: (b: Bill) =>
      b.customer
        ? formatCustomerName(b.customer.firstName, b.customer.lastName)
        : "Unknown",
    width: 24,
  },
  {
    header: "Email",
    accessor: (b: Bill) => b.customer?.email ?? "—",
    width: 28,
  },
  {
    header: "Description",
    accessor: (b: Bill) => b.description,
    width: 32,
  },
  {
    header: "Amount (MWK)",
    accessor: (b: Bill) => parseFloat(b.amount.toString()),
    width: 16,
  },
  {
    header: "Transaction Date",
    accessor: (b: Bill) => formatDate(b.transactionDate),
    width: 18,
  },
  {
    header: "Created On",
    accessor: (b: Bill) => formatDate(b.createdAt),
    width: 16,
  },
];

export const Bills = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    customerId: "",
    search: "",
    page: 1,
    limit: 10,
  });

  // Clean filters helper - removes empty strings
  const cleanFilters = (f: any) => {
    const cleaned: any = {};
    Object.keys(f).forEach((key) => {
      if (f[key] !== "" && f[key] !== null && f[key] !== undefined) {
        cleaned[key] = f[key];
      }
    });
    return cleaned;
  };

  // Fetch bills (paginated — current view)
  const { data, isLoading, error } = useQuery({
    queryKey: ["bills", filters],
    queryFn: () => billsService.getAll(cleanFilters(filters)),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 2;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["bill-stats"],
    queryFn: () => billsService.getStats(),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 2;
    },
  });

  // Export hook
  const { exportData, isExporting } = useExport<Bill>({
    title: buildExportTitle(filters),
    columns: BILL_EXPORT_COLUMNS,
    filename: buildExportFilename(filters),
  });

  // Handle export — fetch ALL records matching current filters (no pagination)
  const handleExport = async (format: ExportFormat) => {
    try {
      const exportFilters = {
        ...cleanFilters(filters),
        page: 1,
        limit: 99999,
      };
      const result = await billsService.getAll(exportFilters);
      const allBills: Bill[] = result?.bills ?? [];

      if (allBills.length === 0) {
        toast.error("No bills to export with the current filters.");
        return;
      }

      await exportData(allBills, format);
      toast.success(
        `Exported ${allBills.length} bill${
          allBills.length !== 1 ? "s" : ""
        } as ${format.toUpperCase()}`
      );
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  // Delete bill mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => billsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bill-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Bill deleted successfully!");
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("You don't have permission to delete bills");
      } else {
        toast.error("Failed to delete bill");
      }
    },
  });

  const handleDelete = (bill: Bill) => {
    if (!isAdmin) {
      toast.error("Only administrators can delete bills");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete this bill for ${formatCurrency(
          bill.amount
        )}?`
      )
    ) {
      deleteMutation.mutate(bill.id);
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const statCards = [
    {
      name: "Total Bills",
      value: stats?.totalBills || 0,
      icon: DocumentTextIcon,
      color: "bg-blue-500",
      subtext: "Bills issued",
    },
    {
      name: "Total Amount",
      value: formatCurrency(stats?.totalAmount || 0),
      icon: CurrencyDollarIcon,
      color: "bg-green-500",
      subtext: "Revenue generated",
    },
    {
      name: "Average Bill",
      value: formatCurrency(stats?.averageAmount || 0),
      icon: ChartBarIcon,
      color: "bg-purple-500",
      subtext: "Per transaction",
    },
  ];

  // Handle forbidden resource error
  if (error && (error as any)?.response?.status === 403) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
            <p className="text-gray-600 mt-1">
              Manage customer bills and invoices
            </p>
          </div>
        </div>
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You don't have permission to view bills. Please contact your
              administrator for access.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600 mt-1">
            Manage customer bills and invoices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            onExport={handleExport}
            isExporting={isExporting}
            isDisabled={isLoading || !data?.total}
            recordCount={data?.total}
          />
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Bill
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <BillFilters filters={filters} onFilterChange={handleFilterChange} />
      </Card>

      {/* Table */}
      <Card>
        <BillTable
          bills={data?.bills || []}
          isLoading={isLoading}
          total={data?.total || 0}
          page={filters.page}
          limit={filters.limit}
          onPageChange={handlePageChange}
          onDelete={isAdmin ? handleDelete : undefined}
          isDeleting={deleteMutation.isPending}
        />
      </Card>

      {/* Create Modal */}
      <CreateBillModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildExportTitle(filters: { customerId: string; search: string }) {
  const parts: string[] = ["Bills"];
  if (filters.search) {
    parts.push(`— Search: "${filters.search}"`);
  }
  return parts.join(" ");
}

function buildExportFilename(filters: { customerId: string; search: string }) {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = filters.customerId ? "-filtered" : "";
  return `bills${suffix}-${date}`;
}
