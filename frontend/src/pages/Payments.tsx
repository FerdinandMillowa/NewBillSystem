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
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PlusIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/formatters";

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

  // Fetch payments
  const { data, isLoading } = useQuery({
    queryKey: ["payments", filters],
    queryFn: () => paymentsService.getAll(filters),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["payment-stats"],
    queryFn: () => paymentsService.getStats(),
  });

  // Delete payment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete payment");
    },
  });

  const handleDelete = (payment: Payment) => {
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
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Record Payment
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

      {/* Payment Methods Distribution */}
      {stats?.paymentsByMethod && stats.paymentsByMethod.length > 0 && (
        <Card title="Payment Methods">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.paymentsByMethod.map((method: any) => (
              <div
                key={method.method}
                className="text-center p-4 bg-gray-50 rounded-lg"
              >
                <BanknotesIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 capitalize">
                  {method.method.replace("_", " ")}
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
          isDeleting={deleteMutation.isPending}
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
