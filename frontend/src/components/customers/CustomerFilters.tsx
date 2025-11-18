import { Input } from "../ui/Input";

interface CustomerFiltersProps {
  filters: {
    search: string;
    status: string;
  };
  onFilterChange: (filters: any) => void;
}

export const CustomerFilters = ({
  filters,
  onFilterChange,
}: CustomerFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
      </div>
      <div>
        <select
          className="input"
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>
    </div>
  );
};
