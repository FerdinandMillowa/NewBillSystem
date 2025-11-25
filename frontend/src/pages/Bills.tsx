import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billsService } from "../services/bills.service";
import type { Bill } from "../types/bill.types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CreateBillModal } from "../components/bills/CreateBillModal";
import { BillTable } from "../components/bills/BillTable";
import { BillFilters } from "../components/bills/BillFilters";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PlusIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/formatters";

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
  const cleanFilters = (filters: any) => {
    const cleaned: any = {};
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== "" &&
        filters[key] !== null &&
        filters[key] !== undefined
      ) {
        cleaned[key] = filters[key];
      }
    });
    return cleaned;
  };

  // Fetch bills
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
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Bill
        </Button>
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
