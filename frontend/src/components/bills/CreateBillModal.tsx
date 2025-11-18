/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { billsService } from "../../services/bills.service";
import { customersService } from "../../services/customers.service";
import { billSchema } from "../../utils/validators";
import type { CreateBillRequest } from "../../types/bill.types";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBillModal = ({ isOpen, onClose }: CreateBillModalProps) => {
  const queryClient = useQueryClient();

  // Fetch approved customers
  const { data: customersData } = useQuery({
    queryKey: ["customers", { status: "approved" }],
    queryFn: () => customersService.getAll({ status: "approved", limit: 100 }),
    enabled: isOpen, // Only fetch when modal is open
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<CreateBillRequest>({
    resolver: zodResolver(billSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBillRequest) => billsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bill-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["recent-bills"] });
      toast.success("Bill created successfully!");
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create bill");
    },
  });

  const onSubmit = (data: CreateBillRequest) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    Create New Bill
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
                      onChange={(e) => setValue("customerId", e.target.value)}
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

                  {/* Amount */}
                  <Input
                    label="Amount (MWK) *"
                    type="number"
                    step="0.01"
                    placeholder="15000"
                    error={errors.amount?.message}
                    {...register("amount", { valueAsNumber: true })}
                  />

                  {/* Description */}
                  <div>
                    <label className="label">Description *</label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Monthly subscription - November 2024"
                      {...register("description")}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      ℹ️ Bills are created for approved customers only. The
                      customer's balance will be updated automatically.
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
                      Create Bill
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
