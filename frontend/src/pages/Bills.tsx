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

  // Fetch bills
  const { data, isLoading } = useQuery({
    queryKey: ["bills", filters],
    queryFn: () => billsService.getAll(filters),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["bill-stats"],
    queryFn: () => billsService.getStats(),
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
    onError: () => {
      toast.error("Failed to delete bill");
    },
  });

  const handleDelete = (bill: Bill) => {
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
