import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "../services/customers.service";
import type { Customer } from "../types/customer.types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CreateCustomerModal } from "../components/customers/CreateCustomerModal";
import { CustomerTable } from "../components/customers/CustomerTable";
import { CustomerFilters } from "../components/customers/CustomerFilters";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PlusIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export const Customers = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ["customers", filters],
    queryFn: () => customersService.getAll(filters),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: () => customersService.getStats(),
  });

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
    onError: () => {
      toast.error("Failed to update customer status");
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
    onError: () => {
      toast.error("Failed to delete customer");
    },
  });

  const handleApprove = (customer: Customer) => {
    const newStatus = customer.status === "pending" ? "approved" : "pending";
    approveMutation.mutate({ id: customer.id, status: newStatus });
  };

  const handleDelete = (customer: Customer) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`
      )
    ) {
      deleteMutation.mutate(customer.id);
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
      name: "Total Customers",
      value: stats?.total || 0,
      icon: UserGroupIcon,
      color: "bg-blue-500",
    },
    {
      name: "Approved",
      value: stats?.approved || 0,
      icon: CheckCircleIcon,
      color: "bg-green-500",
    },
    {
      name: "Pending",
      value: stats?.pending || 0,
      icon: ClockIcon,
      color: "bg-yellow-500",
    },
    {
      name: "With Balance",
      value: stats?.withOutstandingBalance || 0,
      icon: UserGroupIcon,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer accounts</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
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
          isApproving={approveMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      </Card>

      {/* Create Modal */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
