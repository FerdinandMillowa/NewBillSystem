import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "../../services/products.service";
import type { UpdatePriceDto, Product } from "../../types/product.types";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import { XMarkIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "../../utils/formatters";

interface UpdatePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const UpdatePriceModal = ({
  isOpen,
  onClose,
  product,
}: UpdatePriceModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePriceDto>();

  const updatePriceMutation = useMutation({
    mutationFn: (data: UpdatePriceDto) =>
      productsService.updatePrice(product.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Price will be updated tomorrow!");
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update price");
    },
  });

  const onSubmit = (data: UpdatePriceDto) => {
    updatePriceMutation.mutate({
      ...data,
      newPrice: Number(data.newPrice),
    });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                    Update Price
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {product.name}
                    {product.size && (
                      <span className="text-sm ml-2">({product.size})</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Current Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(product.currentPrice)}
                  </p>
                </div>

                {/* Info Alert */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Price changes take effect <strong>tomorrow</strong>. Today's
                    sales will use the current price.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* New Price */}
                  <div>
                    <label className="label">
                      New Price (MK) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("newPrice", {
                        required: "New price is required",
                        min: { value: 0, message: "Price must be positive" },
                      })}
                      placeholder="3000.00"
                      error={errors.newPrice?.message}
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="label">Reason (Optional)</label>
                    <textarea
                      {...register("reason")}
                      rows={3}
                      className="input"
                      placeholder="e.g., Supplier price increase, Promotion, etc."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={updatePriceMutation.isPending}
                    >
                      Update Price
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
