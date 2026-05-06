import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsService } from "../../services/payments.service";
import { customersService } from "../../services/customers.service";
import { paymentSchema } from "../../utils/validators";
import type {
  CreatePaymentRequest,
  PaymentMethod,
} from "../../types/payment.types";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import {
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "../../utils/formatters";
import { format } from "date-fns";

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const paymentMethods = [
  {
    value: "cash" as PaymentMethod,
    label: "Cash",
    icon: BanknotesIcon,
    color: "text-green-600",
  },
  {
    value: "mpamba" as PaymentMethod,
    label: "Mpamba",
    icon: DevicePhoneMobileIcon,
    color: "text-blue-600",
  },
  {
    value: "airtel_money" as PaymentMethod,
    label: "Airtel Money",
    icon: DevicePhoneMobileIcon,
    color: "text-red-600",
  },
  {
    value: "bank" as PaymentMethod,
    label: "Bank Transfer",
    icon: BuildingLibraryIcon,
    color: "text-purple-600",
  },
  {
    value: "card" as PaymentMethod,
    label: "Card",
    icon: CreditCardIcon,
    color: "text-orange-600",
  },
];

const referenceNumberPlaceholder: Record<string, string> = {
  mpamba: "e.g. MPAM9182",
  airtel_money: "e.g. AIR20260129",
  bank: "e.g. FDH202601291847",
  card: "e.g. POS-0042",
  mobile_money: "e.g. MM123456",
};

export const CreatePaymentModal = ({
  isOpen,
  onClose,
}: CreatePaymentModalProps) => {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const { data: customersData } = useQuery({
    queryKey: ["customers", { status: "approved" }],
    queryFn: () => customersService.getAll({ status: "approved", limit: 100 }),
    enabled: isOpen,
  });

  const { data: customerData } = useQuery({
    queryKey: ["customer", selectedCustomerId],
    queryFn: () => customersService.getById(selectedCustomerId),
    enabled: !!selectedCustomerId && isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setValue,
  } = useForm<CreatePaymentRequest>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "cash",
    },
  });

  const selectedMethod = watch("paymentMethod");
  const requiresReference = selectedMethod !== "cash";

  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentRequest) => paymentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["recent-payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Payment recorded successfully!");
      reset();
      setSelectedCustomerId("");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to record payment");
    },
  });

  const onSubmit = (data: CreatePaymentRequest) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setSelectedCustomerId("");
    onClose();
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setValue("customerId", customerId);
  };

  const handleMethodChange = (method: PaymentMethod) => {
    setValue("paymentMethod", method);
    // Clear reference number when switching to cash
    if (method === "cash") {
      setValue("referenceNumber", "");
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    Record Payment
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Customer Select */}
                  <div>
                    <label className="label">Customer *</label>
                    <select
                      className="input"
                      {...register("customerId")}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                    >
                      <option value="">Select a customer...</option>
                      {customersData?.customers?.map((customer: any) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.firstName} {customer.lastName} -{" "}
                          {customer.email}
                        </option>
                      ))}
                    </select>
                    {errors.customerId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.customerId.message}
                      </p>
                    )}
                  </div>

                  {/* Customer Balance Display */}
                  {customerData && customerData.balance !== undefined && (
                    <div
                      className={`p-4 rounded-lg ${
                        customerData.balance > 0
                          ? "bg-red-50 border border-red-200"
                          : "bg-green-50 border border-green-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Outstanding Balance:
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            customerData.balance > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {formatCurrency(customerData.balance)}
                        </span>
                      </div>
                      {customerData.balance > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          This customer owes money
                        </p>
                      )}
                    </div>
                  )}

                  {/* Amount */}
                  <Input
                    label="Amount (MWK) *"
                    type="number"
                    step="0.01"
                    placeholder="10000"
                    error={errors.amount?.message}
                    {...register("amount", { valueAsNumber: true })}
                  />

                  {/* Payment Method */}
                  <div>
                    <label className="label">Payment Method *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedMethod === method.value;
                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => handleMethodChange(method.value)}
                            className={`p-4 border-2 rounded-lg transition-all ${
                              isSelected
                                ? "border-primary-500 bg-primary-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 mx-auto mb-2 ${
                                isSelected ? method.color : "text-gray-400"
                              }`}
                            />
                            <p
                              className={`text-sm font-medium ${
                                isSelected
                                  ? "text-primary-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {method.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    {errors.paymentMethod && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.paymentMethod.message}
                      </p>
                    )}
                  </div>

                  {/* Reference Number — required for all non-cash methods */}
                  {requiresReference && (
                    <div>
                      <label className="label">Reference Number *</label>
                      <Input
                        type="text"
                        placeholder={
                          referenceNumberPlaceholder[selectedMethod] ??
                          "Enter transaction reference"
                        }
                        error={errors.referenceNumber?.message}
                        {...register("referenceNumber")}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter the transaction ID or reference from the payment
                        confirmation.
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="label">Notes (Optional)</label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Payment reference or additional notes..."
                      {...register("notes")}
                    />
                    {errors.notes && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.notes.message}
                      </p>
                    )}
                  </div>

                  {/* Payment Date */}
                  <Input
                    label="Payment Date (Optional)"
                    type="date"
                    error={errors.paymentDate?.message}
                    {...register("paymentDate")}
                    max={format(new Date(), "yyyy-MM-dd")}
                  />

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      ℹ️ This payment will be saved as{" "}
                      <span className="font-semibold">pending</span> and must be
                      verified by an administrator.{" "}
                      {requiresReference &&
                        "The reference number will be used for verification."}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClose}
                      disabled={createMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={createMutation.isPending}
                    >
                      Record Payment
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
