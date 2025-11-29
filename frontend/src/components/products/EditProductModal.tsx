import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "../../services/products.service";
import type {
  UpdateProductDto,
  Product,
  ProductCategory,
} from "../../types/product.types";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  categories: ProductCategory[];
}

export const EditProductModal = ({
  isOpen,
  onClose,
  product,
  categories,
}: EditProductModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProductDto>({
    defaultValues: {
      categoryId: product.categoryId,
      name: product.name,
      unit: product.unit || "",
      size: product.size || "",
      currentPrice: product.currentPrice,
      currentStock: product.currentStock,
      shotsPerBottle: product.shotsPerBottle || undefined,
      notes: product.notes || "",
      isActive: product.isActive,
    },
  });

  useEffect(() => {
    reset({
      categoryId: product.categoryId,
      name: product.name,
      unit: product.unit || "",
      size: product.size || "",
      currentPrice: product.currentPrice,
      currentStock: product.currentStock,
      shotsPerBottle: product.shotsPerBottle || undefined,
      notes: product.notes || "",
      isActive: product.isActive,
    });
  }, [product, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProductDto) =>
      productsService.update(product.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success("Product updated successfully!");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update product");
    },
  });

  const onSubmit = (data: UpdateProductDto) => {
    updateMutation.mutate({
      ...data,
      currentPrice: Number(data.currentPrice),
      currentStock: Number(data.currentStock),
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
                    Edit Product
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
                    <label className="label">Category</label>
                    <select {...register("categoryId")} className="input">
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="label">Product Name</label>
                    <Input
                      {...register("name", {
                        required: "Product name is required",
                      })}
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
                      <Input {...register("size")} placeholder="e.g., 330ml" />
                    </div>
                  </div>

                  {/* Price and Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Current Price (MK)</label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register("currentPrice", {
                          min: { value: 0, message: "Price must be positive" },
                        })}
                        error={errors.currentPrice?.message}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use "Update Price" button for price changes
                      </p>
                    </div>
                    <div>
                      <label className="label">Current Stock</label>
                      <Input
                        type="number"
                        {...register("currentStock", {
                          min: { value: 0, message: "Stock must be positive" },
                        })}
                      />
                    </div>
                  </div>

                  {/* Shots Per Bottle */}
                  <div>
                    <label className="label">Shots Per Bottle</label>
                    <Input
                      type="number"
                      {...register("shotsPerBottle", {
                        min: { value: 1, message: "Must be at least 1" },
                      })}
                    />
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register("isActive")}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Product is active (visible in daily sales)
                    </label>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      className="input"
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
                      isLoading={updateMutation.isPending}
                    >
                      Update Product
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
