import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { QueryActivityLogsParams } from "../../types/activity-log.types";
import { ActivityAction, ActivityEntity } from "../../types/activity-log.types";

interface ActivityLogsFiltersProps {
  filters: QueryActivityLogsParams;
  onFilterChange: (filters: Partial<QueryActivityLogsParams>) => void;
}

export const ActivityLogsFilters = ({
  filters,
  onFilterChange,
}: ActivityLogsFiltersProps) => {
  const handleClearFilters = () => {
    onFilterChange({
      search: "",
      action: undefined,
      entity: undefined,
      userId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.action ||
    filters.entity ||
    filters.userId ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search in details..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Action Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Action
          </label>
          <select
            value={filters.action || ""}
            onChange={(e) =>
              onFilterChange({
                action: e.target.value
                  ? (e.target.value as ActivityAction)
                  : undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Actions</option>
            <option value={ActivityAction.CREATE}>Create</option>
            <option value={ActivityAction.UPDATE}>Update</option>
            <option value={ActivityAction.DELETE}>Delete</option>
            <option value={ActivityAction.LOGIN}>Login</option>
            <option value={ActivityAction.LOGOUT}>Logout</option>
            <option value={ActivityAction.APPROVE}>Approve</option>
            <option value={ActivityAction.FINALIZE}>Finalize</option>
            <option value={ActivityAction.UNLOCK}>Unlock</option>
            <option value={ActivityAction.RESET_PASSWORD}>
              Reset Password
            </option>
            <option value={ActivityAction.CHANGE_PASSWORD}>
              Change Password
            </option>
          </select>
        </div>

        {/* Entity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entity
          </label>
          <select
            value={filters.entity || ""}
            onChange={(e) =>
              onFilterChange({
                entity: e.target.value
                  ? (e.target.value as ActivityEntity)
                  : undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Entities</option>
            <option value={ActivityEntity.CUSTOMER}>Customer</option>
            <option value={ActivityEntity.BILL}>Bill</option>
            <option value={ActivityEntity.PAYMENT}>Payment</option>
            <option value={ActivityEntity.PRODUCT}>Product</option>
            <option value={ActivityEntity.PRODUCT_CATEGORY}>
              Product Category
            </option>
            <option value={ActivityEntity.DAILY_SALES}>Daily Sales</option>
            <option value={ActivityEntity.USER}>User</option>
            <option value={ActivityEntity.STOCK_PURCHASE}>
              Stock Purchase
            </option>
            <option value={ActivityEntity.INVENTORY_TRANSFER}>
              Inventory Transfer
            </option>
            <option value={ActivityEntity.EXPENSE}>Expense</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <Input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <Input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
          />
        </div>

        {/* User ID (Optional - for admin use) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User ID
          </label>
          <Input
            type="text"
            placeholder="Filter by user ID..."
            value={filters.userId || ""}
            onChange={(e) => onFilterChange({ userId: e.target.value })}
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearFilters}
            className="flex items-center"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};
