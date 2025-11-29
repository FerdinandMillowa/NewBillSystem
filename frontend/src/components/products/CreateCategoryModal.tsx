import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productCategoriesService } from "../../services/product-categories.service";
import type { CreateCategoryDto } from "../../types/product.types";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCategoryModal = ({
  isOpen,
  onClose,
}: CreateCategoryModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryDto>();

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) =>
      productCategoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success("Category created successfully!");
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create category");
    },
  });

  const onSubmit = (data: CreateCategoryDto) => {
    createMutation.mutate({
      ...data,
      displayOrder: data.displayOrder ? Number(data.displayOrder) : 0,
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
                    Add Category
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Category Name */}
                  <div>
                    <label className="label">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register("name", {
                        required: "Category name is required",
                      })}
                      placeholder="e.g., BEERS, WINES, SPIRITS"
                      error={errors.name?.message}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="label">Description</label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      className="input"
                      placeholder="Brief description of this category..."
                    />
                  </div>

                  {/* Display Order */}
                  <div>
                    <label className="label">Display Order</label>
                    <Input
                      type="number"
                      {...register("displayOrder", {
                        min: { value: 0, message: "Must be 0 or greater" },
                      })}
                      placeholder="0"
                      defaultValue={0}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower numbers appear first
                    </p>
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
                      Create Category
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
