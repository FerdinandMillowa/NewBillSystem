import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "../services/users.service";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { CreateUserModal } from "../components/users/CreateUserModal";
import { EditUserModal } from "../components/users/EditUserModal";
import { ResetPasswordModal } from "../components/users/ResetPasswordModal";
import { UsersTable } from "../components/users/UsersTable";
import { UsersFilters } from "../components/users/UsersFilters";
import toast from "react-hot-toast";
import {
  UsersIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Navigate } from "react-router-dom";

export const Users = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: "",
    role: "", // Empty string means "all roles"
    status: "", // Empty string means "all statuses"
    page: 1,
    limit: 10,
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch users - FIXED: Remove empty strings before sending to API
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", filters],
    queryFn: () => {
      // Create a clean filters object, removing empty strings
      const apiFilters: any = {
        page: filters.page,
        limit: filters.limit,
      };

      // Only include search if not empty
      if (filters.search.trim()) {
        apiFilters.search = filters.search;
      }

      // Only include role if not empty (API expects lowercase enum values)
      if (filters.role) {
        apiFilters.role = filters.role.toLowerCase();
      }

      // Only include status if not empty (API expects lowercase enum values)
      if (filters.status) {
        apiFilters.status = filters.status.toLowerCase();
      }

      return usersService.getAll(apiFilters);
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => usersService.getStats(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success("User deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    },
  });

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const handleDelete = (user: any) => {
    if (
      window.confirm(
        `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage system users, roles, and permissions
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {stats.admins}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Regular Users</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {stats.users}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <UsersFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Users Table */}
      <Card>
        <UsersTable
          users={usersData?.users || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
          pagination={{
            page: filters.page,
            limit: filters.limit,
            total: usersData?.total || 0,
            onPageChange: handlePageChange,
          }}
        />
      </Card>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["user-stats"] });
        }}
      />

      {selectedUser && (
        <>
          <EditUserModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedUser(null);
              queryClient.invalidateQueries({ queryKey: ["users"] });
            }}
          />

          <ResetPasswordModal
            isOpen={showResetPasswordModal}
            onClose={() => {
              setShowResetPasswordModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={() => {
              setShowResetPasswordModal(false);
              setSelectedUser(null);
            }}
          />
        </>
      )}
    </div>
  );
};