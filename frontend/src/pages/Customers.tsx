/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "../services/customers.service";
import type { Customer } from "../types/customer.types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CreateCustomerModal } from "../components/customers/CreateCustomerModal";
import { EditCustomerModal } from "../components/customers/EditCustomerModal";
import { CustomerTable } from "../components/customers/CustomerTable";
import { CustomerFilters } from "../components/customers/CustomerFilters";
import { ExportButton } from "../components/ui/ExportButton";
import { useExport } from "../hooks/useExport";
import type { ExportFormat } from "../hooks/useExport";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PlusIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  formatDate,
  formatPhoneNumber,
  formatCurrency,
  formatCustomerName,
} from "../utils/formatters";

// Column definitions — balance column only populated when withBalance filter active
const CUSTOMER_EXPORT_COLUMNS = [
  {
    header: "First Name",
    accessor: (c: Customer) => c.firstName,
    width: 18,
  },
  {
    header: "Last Name",
    accessor: (c: Customer) => c.lastName,
    width: 18,
  },
  {
    header: "Email",
    accessor: (c: Customer) => c.email,
    width: 30,
  },
  {
    header: "Phone",
    accessor: (c: Customer) => formatPhoneNumber(c.phone),
    width: 18,
  },
  {
    header: "Address",
    accessor: (c: Customer) => c.address ?? "—",
    width: 28,
  },
  {
    header: "Status",
    accessor: (c: Customer) =>
      c.status.charAt(0).toUpperCase() + c.status.slice(1),
    width: 12,
  },
  {
    header: "Outstanding Balance (MWK)",
    accessor: (c: Customer) => (c.balance != null ? c.balance.toString() : "—"),
    width: 26,
  },
  {
    header: "Member Since",
    accessor: (c: Customer) => formatDate(c.createdAt),
    width: 16,
  },
];

export const Customers = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });

  // Converts frontend filter state into backend query params
  const cleanFilters = (f: any) => {
    const cleaned: any = {};
    Object.keys(f).forEach((key) => {
      if (f[key] !== "" && f[key] !== null && f[key] !== undefined) {
        cleaned[key] = f[key];
      }
    });
    // Map "with_balance" status into the dedicated withBalance flag
    if (cleaned.status === "with_balance") {
      cleaned.withBalance = true;
      delete cleaned.status;
    }
    return cleaned;
  };

  // Fetch customers (paginated)
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", filters],
    queryFn: () => customersService.getAll(cleanFilters(filters)),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 2;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: () => customersService.getStats(),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 2;
    },
  });

  // Export hook
  const { exportData, isExporting } = useExport<Customer>({
    title: buildExportTitle(filters),
    columns: CUSTOMER_EXPORT_COLUMNS,
    filename: buildExportFilename(filters),
  });

  // Handle export — fetches ALL records matching current filters
  const handleExport = async (format: ExportFormat) => {
    try {
      const exportFilters = {
        ...cleanFilters(filters),
        page: 1,
        limit: 99999,
      };
      const result = await customersService.getAll(exportFilters);
      const allCustomers: Customer[] = result?.customers ?? [];

      if (allCustomers.length === 0) {
        toast.error("No customers to export with the current filters.");
        return;
      }

      await exportData(allCustomers, format);
      toast.success(
        `Exported ${allCustomers.length} customer${
          allCustomers.length !== 1 ? "s" : ""
        } as ${format.toUpperCase()}`
      );
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  // Approve customer mutation
  const approveMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "pending";
    }) => customersService.approve(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-customers"] });
      toast.success("Customer status updated!");
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("You don't have permission to approve customers");
      } else {
        toast.error("Failed to update customer status");
      }
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      toast.success("Customer deleted successfully!");
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("You don't have permission to delete customers");
      } else {
        toast.error("Failed to delete customer");
      }
    },
  });

  // Edit customer mutation (admin only)
  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      customersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-customers"] });
      toast.success("Customer updated successfully!");
      setIsEditModalOpen(false);
      setEditingCustomer(null);
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("You don't have permission to edit customers");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to update customer"
        );
      }
    },
  });

  const handleApprove = (customer: Customer) => {
    if (!isAdmin) {
      toast.error("Only administrators can approve customers");
      return;
    }
    const newStatus = customer.status === "pending" ? "approved" : "pending";
    approveMutation.mutate({ id: customer.id, status: newStatus });
  };

  const handleDelete = (customer: Customer) => {
    if (!isAdmin) {
      toast.error("Only administrators can delete customers");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`
      )
    ) {
      deleteMutation.mutate(customer.id);
    }
  };

  const handleStartEdit = (customer: Customer) => {
    if (!isAdmin) {
      toast.error("Only administrators can edit customers");
      return;
    }
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = (data: Partial<Customer>) => {
    if (!editingCustomer) return;
    editMutation.mutate({ id: editingCustomer.id, data });
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleStatCardClick = (statName: string) => {
    if (statName === "With Balance") {
      setFilters({
        search: "",
        status: "with_balance",
        page: 1,
        limit: filters.limit,
      });
    } else if (statName === "Approved") {
      setFilters({
        search: "",
        status: "approved",
        page: 1,
        limit: filters.limit,
      });
    } else if (statName === "Pending") {
      setFilters({
        search: "",
        status: "pending",
        page: 1,
        limit: filters.limit,
      });
    } else if (statName === "Total Customers") {
      setFilters({ search: "", status: "", page: 1, limit: filters.limit });
    }
  };

  const statCards = [
    {
      name: "Total Customers",
      value: stats?.total || 0,
      icon: UserGroupIcon,
      color: "bg-blue-500",
      clickable: true,
    },
    {
      name: "Approved",
      value: stats?.approved || 0,
      icon: CheckCircleIcon,
      color: "bg-green-500",
      clickable: true,
    },
    {
      name: "Pending",
      value: stats?.pending || 0,
      icon: ClockIcon,
      color: "bg-yellow-500",
      clickable: true,
    },
    {
      name: "With Balance",
      value: stats?.withOutstandingBalance || 0,
      icon: UserGroupIcon,
      color: "bg-red-500",
      clickable: true,
    },
  ];

  // Handle forbidden resource error
  if (error && (error as any)?.response?.status === 403) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">Manage your customer accounts</p>
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
              You don't have permission to view customer information. Please
              contact your administrator for access.
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
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer accounts</p>
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
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            onClick={() => stat.clickable && handleStatCardClick(stat.name)}
            className={
              stat.clickable
                ? "cursor-pointer hover:shadow-lg transition-shadow duration-200"
                : ""
            }
          >
            <Card>
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CustomerFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </Card>

      {/* Table */}
      <Card>
        <CustomerTable
          customers={data?.customers || []}
          isLoading={isLoading}
          total={data?.total || 0}
          page={filters.page}
          limit={filters.limit}
          onPageChange={handlePageChange}
          onApprove={isAdmin ? handleApprove : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
          onEdit={isAdmin ? handleStartEdit : undefined}
          isApproving={approveMutation.isPending}
          isDeleting={deleteMutation.isPending}
          isEditing={editMutation.isPending}
        />
      </Card>

      {/* Create Modal */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal (admin) */}
      {editingCustomer && (
        <EditCustomerModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCustomer(null);
          }}
          customer={editingCustomer}
          onSubmit={handleSubmitEdit}
          isLoading={editMutation.isPending}
        />
      )}
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildExportTitle(filters: { search: string; status: string }) {
  if (filters.status === "with_balance")
    return "Customers with Outstanding Balances";
  if (filters.status === "approved") return "Approved Customers";
  if (filters.status === "pending") return "Pending Customers";
  if (filters.search) return `Customers — Search: "${filters.search}"`;
  return "All Customers";
}

function buildExportFilename(filters: { search: string; status: string }) {
  const date = new Date().toISOString().slice(0, 10);
  const suffix =
    filters.status === "with_balance"
      ? "-outstanding-balances"
      : filters.status
      ? `-${filters.status}`
      : "";
  return `customers${suffix}-${date}`;
}
