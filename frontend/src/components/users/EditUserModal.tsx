import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { usersService } from "../../services/users.service";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export const EditUserModal = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    role: "user" as "admin" | "user",
    status: "active" as "active" | "inactive",
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        fullName: user.fullName || "",
        role: user.role || "user",
        status: user.status || "active",
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => usersService.update(user.id, data),
    onSuccess: () => {
      toast.success("User updated successfully!");
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update user");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit User: ${user?.username}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username *"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          required
          minLength={3}
        />

        <Input
          label="Email *"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label="Full Name *"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          required
        />

        <div>
          <label className="label">Role *</label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as "admin" | "user",
              })
            }
            className="input"
            required
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            ⚠️ Be careful when changing user roles
          </p>
        </div>

        <div>
          <label className="label">Status *</label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "active" | "inactive",
              })
            }
            className="input"
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Inactive users cannot log in to the system
          </p>
        </div>

        {/* Warning Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ℹ️ <strong>Note:</strong> Password cannot be changed here. Use the
            "Reset Password" action to change user passwords.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
