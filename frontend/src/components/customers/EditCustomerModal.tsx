import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { customerSchema } from "../../utils/validators";
import type { CreateCustomerRequest } from "../../types/customer.types";
import type { Customer } from "../../types/customer.types";

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSubmit: (data: Partial<CreateCustomerRequest>) => void;
  isLoading?: boolean;
}

export const EditCustomerModal = ({
  isOpen,
  onClose,
  customer,
  onSubmit,
  isLoading = false,
}: EditCustomerModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerRequest>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || "",
    },
  });

  // Reset form whenever customer or isOpen changes so values stay in sync
  useEffect(() => {
    if (isOpen && customer) {
      reset({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address || "",
      });
    }
  }, [customer, isOpen, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = (data: CreateCustomerRequest) => {
    // We send the updated fields. Backend DTO accepts partial update.
    onSubmit({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
    });
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
                    Edit Customer
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(submit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      placeholder="John"
                      error={errors.firstName?.message}
                      {...register("firstName")}
                    />
                    <Input
                      label="Last Name"
                      placeholder="Doe"
                      error={errors.lastName?.message}
                      {...register("lastName")}
                    />
                  </div>

                  <Input
                    label="Email"
                    type="email"
                    placeholder="john.doe@example.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />

                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+265991234567"
                    error={errors.phone?.message}
                    {...register("phone")}
                  />

                  <div>
                    <label className="label">Address (Optional)</label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="123 Main St, Blantyre"
                      {...register("address")}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isLoading}
                    >
                      Save Changes
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
