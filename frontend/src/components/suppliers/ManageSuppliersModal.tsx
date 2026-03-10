import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  suppliersService,
  CreateSupplierDto,
} from "../../services/suppliers.service";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const emptyForm: CreateSupplierDto = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export const ManageSuppliersModal = ({ isOpen, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateSupplierDto>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: suppliersService.getAll,
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: suppliersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to add supplier"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateSupplierDto>;
    }) => suppliersService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated");
      resetForm();
    },
    onError: () => toast.error("Failed to update supplier"),
  });

  const deleteMutation = useMutation({
    mutationFn: suppliersService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier removed");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Failed to remove supplier"),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (supplier: any) => {
    setForm({
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Suppliers" size="lg">
      <div className="space-y-4">
        {/* Add New button */}
        {!showForm && (
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowForm(true)}
              className="flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Supplier
            </Button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">
              {editingId ? "Edit Supplier" : "New Supplier"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Carlsberg Malawi"
                />
              </div>
              <div>
                <label className="label">Contact Person</label>
                <Input
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm({ ...form, contactPerson: e.target.value })
                  }
                  placeholder="e.g. John Banda"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. +265 999 000 000"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. sales@carlsberg.mw"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Physical or postal address"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="input w-full resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <Button variant="secondary" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending
                  ? "Saving..."
                  : editingId
                  ? "Update"
                  : "Add Supplier"}
              </Button>
            </div>
          </div>
        )}

        {/* Suppliers list */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BuildingStorefrontIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              No suppliers yet. Add your first one above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {supplier.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[supplier.contactPerson, supplier.phone]
                      .filter(Boolean)
                      .join(" · ") || "No contact info"}
                  </p>
                </div>

                <div className="flex items-center space-x-1 ml-3">
                  {deleteConfirmId === supplier.id ? (
                    <>
                      <span className="text-xs text-red-600 mr-2">
                        Remove this supplier?
                      </span>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteMutation.mutate(supplier.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        No
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(supplier.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
