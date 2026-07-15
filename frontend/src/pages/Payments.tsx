/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsService } from "../services/payments.service";
import type { Payment } from "../types/payment.types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CreatePaymentModal } from "../components/payments/CreatePaymentModal";
import { PaymentTable } from "../components/payments/PaymentTable";
import { PaymentFilters } from "../components/payments/PaymentFilters";
import { ExportButton } from "../components/ui/ExportButton";
import { useExport } from "../hooks/useExport";
import type { ExportFormat } from "../hooks/useExport";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PlusIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import {
  formatCurrency,
  formatDate,
  formatCustomerName,
  getPaymentMethodLabel,
} from "../utils/formatters";

// Column definitions for all three export formats
const PAYMENT_EXPORT_COLUMNS = [
  {
    header: "Payment ID",
    accessor: (p: Payment) => `#${p.id.substring(0, 8).toUpperCase()}`,
    width: 14,
  },
  {
    header: "Customer",
    accessor: (p: Payment) =>
      p.customer
        ? formatCustomerName(p.customer.firstName, p.customer.lastName)
        : "Unknown",
    width: 24,
  },
  {
    header: "Method",
    accessor: (p: Payment) => getPaymentMethodLabel(p.paymentMethod),
    width: 16,
  },
  {
    header: "Amount (MWK)",
    accessor: (p: Payment) => parseFloat(p.amount.toString()),
    width: 16,
  },
  {
    header: "Reference No.",
    accessor: (p: Payment) => p.referenceNumber ?? "—",
    width: 20,
  },
  {
    header: "Status",
    accessor: (p: Payment) =>
      p.paymentStatus === "verified" ? "Verified" : "Pending",
    width: 12,
  },
  {
    header: "Notes",
    accessor: (p: Payment) => p.notes ?? "—",
    width: 28,
  },
  {
    header: "Payment Date",
    accessor: (p: Payment) => (p.paymentDate ? formatDate(p.paymentDate) : "—"),
    width: 16,
  },
  {
    header: "Recorded On",
    accessor: (p: Payment) => formatDate(p.createdAt),
    width: 16,
  },
];

export const Payments = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    customerId: "",
    paymentMethod: "",
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

  // Fetch paginated payments (current page view)
  const { data, isLoading, error } = useQuery({
    queryKey: ["payments", filters],
    queryFn: () => paymentsService.getAll(cleanFilters(filters)),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 2;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["payment-stats"],
    queryFn: () => paymentsService.getStats(),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 2;
    },
  });

  // Export hook
  const { exportData, isExporting } = useExport<Payment>({
    title: buildExportTitle(filters),
    columns: PAYMENT_EXPORT_COLUMNS,
    filename: buildExportFilename(filters),
  });

  // Handle export — fetch ALL records matching current filters (no pagination limit)
  const handleExport = async (format: ExportFormat) => {
    try {
      const exportFilters = {
        ...cleanFilters(filters),
        page: 1,
        limit: 99999, // fetch everything matching current filters
      };
      const result = await paymentsService.getAll(exportFilters);
      const allPayments: Payment[] = result?.payments ?? [];

      if (allPayments.length === 0) {
        toast.error("No payments to export with the current filters.");
        return;
      }

      await exportData(allPayments, format);
      toast.success(
        `Exported ${allPayments.length} payment${
          allPayments.length !== 1 ? "s" : ""
        } as ${format.toUpperCase()}`
      );
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  // Delete payment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment deleted successfully!");
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("You don't have permission to delete payments");
      } else {
        toast.error("Failed to delete payment");
      }
    },
  });

  // Verify payment mutation
  const verifyMutation = useMutation({
    mutationFn: (id: string) => paymentsService.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment verified successfully!");
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("You don't have permission to verify payments");
      } else {
        toast.error(
          error?.response?.data?.message || "Failed to verify payment"
        );
      }
    },
  });

  const handleDelete = (payment: Payment) => {
    if (!isAdmin) {
      toast.error("Only administrators can delete payments");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete this payment for ${formatCurrency(
          payment.amount
        )}?`
      )
    ) {
      deleteMutation.mutate(payment.id);
    }
  };

  const handleVerify = (payment: Payment) => {
    if (
      window.confirm(
        `Mark this ${formatCurrency(payment.amount)} payment as verified?`
      )
    ) {
      verifyMutation.mutate(payment.id);
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
      name: "Total Payments",
      value: stats?.totalPayments || 0,
      icon: CreditCardIcon,
      color: "bg-blue-500",
      subtext: "Payments received",
    },
    {
      name: "Total Collected",
      value: formatCurrency(stats?.totalAmount || 0),
      icon: CurrencyDollarIcon,
      color: "bg-green-500",
      subtext: "Revenue collected",
    },
    {
      name: "Average Payment",
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
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">
              Record and manage customer payments
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
              You don't have permission to view payments. Please contact your
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
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            Record and manage customer payments
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
            Record Payment
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

      {/* Payment Methods Distribution */}
      {stats?.paymentsByMethod && stats.paymentsByMethod.length > 0 && (
        <Card title="Payment Methods">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.paymentsByMethod.map((method: any) => (
              <div
                key={method.method}
                className="text-center p-4 bg-gray-50 rounded-lg"
              >
                <BanknotesIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  {method.method === "mpamba"
                    ? "Mpamba"
                    : method.method === "airtel_money"
                    ? "Airtel Money"
                    : method.method === "cash"
                    ? "Cash"
                    : method.method === "bank"
                    ? "Bank Transfer"
                    : method.method === "card"
                    ? "Card"
                    : method.method.replace("_", " ")}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(method.total)}
                </p>
                <p className="text-xs text-gray-500">{method.count} payments</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <PaymentFilters filters={filters} onFilterChange={handleFilterChange} />
      </Card>

      {/* Table */}
      <Card>
        <PaymentTable
          payments={data?.payments || []}
          isLoading={isLoading}
          total={data?.total || 0}
          page={filters.page}
          limit={filters.limit}
          onPageChange={handlePageChange}
          onDelete={isAdmin ? handleDelete : undefined}
          onVerify={isAdmin ? handleVerify : undefined}
          isDeleting={deleteMutation.isPending}
          isVerifying={verifyMutation.isPending}
        />
      </Card>

      {/* Create Modal */}
      <CreatePaymentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildExportTitle(filters: {
  paymentMethod: string;
  customerId: string;
  search: string;
}) {
  const parts: string[] = ["Payments"];
  if (filters.paymentMethod) {
    parts.push(`— ${getPaymentMethodLabel(filters.paymentMethod)}`);
  }
  if (filters.search) {
    parts.push(`— Search: "${filters.search}"`);
  }
  return parts.join(" ");
}

function buildExportFilename(filters: {
  paymentMethod: string;
  customerId: string;
  search: string;
}) {
  const date = new Date().toISOString().slice(0, 10);
  const method = filters.paymentMethod ? `-${filters.paymentMethod}` : "";
  return `payments${method}-${date}`;
}
