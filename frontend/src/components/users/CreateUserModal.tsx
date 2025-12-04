import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usersService } from "../../services/users.service";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "user" as "admin" | "user",
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => usersService.create(data),
    onSuccess: () => {
      toast.success("User created successfully!");
      onSuccess();
      onClose();
      setFormData({
        username: "",
        email: "",
        password: "",
        fullName: "",
        role: "user",
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create user");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User" size="md">
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

        <Input
          label="Password *"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          minLength={8}
          placeholder="Min. 8 characters"
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
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createMutation.isPending}
          >
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
};
