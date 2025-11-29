import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "../../services/products.service";
import type {
  CreateProductDto,
  ProductCategory,
} from "../../types/product.types";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
}

export const CreateProductModal = ({
  isOpen,
  onClose,
  categories,
}: CreateProductModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductDto>();

  const createMutation = useMutation({
    mutationFn: (data: CreateProductDto) => productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success("Product created successfully!");
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create product");
    },
  });

  const onSubmit = (data: CreateProductDto) => {
    createMutation.mutate({
      ...data,
      currentPrice: Number(data.currentPrice),
      currentStock: data.currentStock ? Number(data.currentStock) : 0,
      shotsPerBottle: data.shotsPerBottle
        ? Number(data.shotsPerBottle)
        : undefined,
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    Add New Product
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Category */}
                  <div>
                    <label className="label">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("categoryId", {
                        required: "Category is required",
                      })}
                      className="input"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="label">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register("name", {
                        required: "Product name is required",
                      })}
                      placeholder="e.g., Kuche Kuche"
                      error={errors.name?.message}
                    />
                  </div>

                  {/* Unit and Size */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Unit</label>
                      <select {...register("unit")} className="input">
                        <option value="">Select unit</option>
                        <option value="bottle">Bottle</option>
                        <option value="can">Can</option>
                        <option value="shot">Shot</option>
                        <option value="piece">Piece</option>
                        <option value="pack">Pack</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Size</label>
                      <Input
                        {...register("size")}
                        placeholder="e.g., 330ml, 750ml"
                      />
                    </div>
                  </div>

                  {/* Price and Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        Current Price (MK){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register("currentPrice", {
                          required: "Price is required",
                          min: { value: 0, message: "Price must be positive" },
                        })}
                        placeholder="2500.00"
                        error={errors.currentPrice?.message}
                      />
                    </div>
                    <div>
                      <label className="label">Current Stock</label>
                      <Input
                        type="number"
                        {...register("currentStock", {
                          min: { value: 0, message: "Stock must be positive" },
                        })}
                        placeholder="0"
                        defaultValue={0}
                      />
                    </div>
                  </div>

                  {/* Shots Per Bottle (for conversion) */}
                  <div>
                    <label className="label">
                      Shots Per Bottle (for bottle-to-shot conversion)
                    </label>
                    <Input
                      type="number"
                      {...register("shotsPerBottle", {
                        min: { value: 1, message: "Must be at least 1" },
                      })}
                      placeholder="e.g., 25"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Used when converting bottles to shots
                    </p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      className="input"
                      placeholder="Additional information about this product..."
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
                      isLoading={createMutation.isPending}
                    >
                      Create Product
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
