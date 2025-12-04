import { Input } from "../ui/Input";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface UsersFiltersProps {
  filters: {
    search: string;
    role: string;
    status: string;
  };
  onFilterChange: (key: string, value: any) => void;
}

export const UsersFilters = ({
  filters,
  onFilterChange,
}: UsersFiltersProps) => {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
      {/* Search */}
      <div className="flex-1">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by username, email, or name..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Role Filter */}
      <div className="w-full md:w-40">
        <select
          value={filters.role}
          onChange={(e) => onFilterChange("role", e.target.value)}
          className="input"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="w-full md:w-40">
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="input"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
};
