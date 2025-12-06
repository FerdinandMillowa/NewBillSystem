import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "../../services/customers.service";
import { billsService } from "../../services/bills.service";
import { dailySalesService } from "../../services/daily-sales.service";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { formatCurrency, formatCustomerName } from "../../utils/formatters";
import {
  PlusIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface DailySalesBillsSectionProps {
  selectedDate: string;
  billsForDate: any[];
  billsAmount: number;
  isDisabled?: boolean;
  onBillCreated: () => void;
}

export const DailySalesBillsSection = ({
  selectedDate,
  billsForDate,
  billsAmount,
  isDisabled = false,
  onBillCreated,
}: DailySalesBillsSectionProps) => {
  const queryClient = useQueryClient();
  const [showBillForm, setShowBillForm] = useState(false);
  const [newBill, setNewBill] = useState({
    customerId: "",
    amount: 0,
    description: "",
  });

  // Fetch customers for bill creation
  const { data: customersData } = useQuery({
    queryKey: ["customers-for-bills"],
    queryFn: () =>
      customersService.getAll({
        status: "approved",
        limit: 500,
      }),
  });

  // ✅ FIXED: Create bill mutation with proper query invalidation
  const createBillMutation = useMutation({
    mutationFn: async (data: any) => {
      // ✅ CRITICAL FIX: Get or create draft Daily Sales for selected date
      const dailySales = await dailySalesService.getOrCreateDraft(selectedDate);

      // ✅ Create bill with Daily Sales ID
      return billsService.create({
        ...data,
        dailySalesId: dailySales.id, // ✅ Link to correct Daily Sales
      });
    },
    onSuccess: () => {
      // ✅ CRITICAL FIX: Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ["bills-by-date", selectedDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["bills"],
      });
      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["daily-sales-by-date", selectedDate],
      });

      toast.success("Bill created successfully!");

      // Reset form
      setNewBill({ customerId: "", amount: 0, description: "" });
      setShowBillForm(false);

      // Notify parent component
      onBillCreated();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create bill");
    },
  });

  const handleCreateBill = () => {
    if (!newBill.customerId || newBill.amount <= 0) {
      toast.error("Please select a customer and enter a valid amount");
      return;
    }

    createBillMutation.mutate({
      customerId: newBill.customerId,
      amount: newBill.amount,
      description: newBill.description || "Daily sales bill",
    });
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <span>Bills for {selectedDate}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total Bills
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(billsAmount)}
            </p>
          </div>
        </div>
      }
    >
      {/* Existing Bills List */}
      {billsForDate.length > 0 ? (
        <div className="space-y-2 mb-4">
          {billsForDate.map((bill: any) => (
            <div
              key={bill.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCustomerName(
                      bill.customer?.firstName,
                      bill.customer?.lastName
                    )}
                  </p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-6">
                  {bill.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(bill.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
          <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No bills created for this date
          </p>
        </div>
      )}

      {/* Add Bill Button/Form */}
      {!isDisabled && (
        <>
          {!showBillForm ? (
            <Button
              variant="secondary"
              onClick={() => setShowBillForm(true)}
              className="w-full flex items-center justify-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Bill for This Date
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Create New Bill
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Selection */}
                <div>
                  <label className="label text-xs">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newBill.customerId}
                    onChange={(e) =>
                      setNewBill({ ...newBill, customerId: e.target.value })
                    }
                    className="input text-sm"
                  >
                    <option value="">Select customer</option>
                    {customersData?.customers?.map((customer: any) => (
                      <option key={customer.id} value={customer.id}>
                        {formatCustomerName(
                          customer.firstName,
                          customer.lastName
                        )}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="label text-xs">
                    Amount (MK) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newBill.amount}
                    onChange={(e) =>
                      setNewBill({
                        ...newBill,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="label text-xs">Description</label>
                  <Input
                    type="text"
                    value={newBill.description}
                    onChange={(e) =>
                      setNewBill({ ...newBill, description: e.target.value })
                    }
                    placeholder="Optional description"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="primary"
                  onClick={handleCreateBill}
                  isLoading={createBillMutation.isPending}
                  disabled={
                    !newBill.customerId ||
                    newBill.amount <= 0 ||
                    createBillMutation.isPending
                  }
                  className="flex items-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Bill
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowBillForm(false);
                    setNewBill({ customerId: "", amount: 0, description: "" });
                  }}
                  disabled={createBillMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">About Bills in Daily Sales</p>
            <p className="text-xs mt-1">
              Bills created here are automatically linked to the selected date
              and included in total sales calculations. They also appear in the
              Bills module for full management.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
