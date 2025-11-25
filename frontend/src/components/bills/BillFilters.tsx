/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { customersService } from "../../services/customers.service";
import { Input } from "../ui/Input";

interface BillFiltersProps {
  filters: {
    customerId: string;
    search: string;
  };
  onFilterChange: (filters: any) => void;
}

export const BillFilters = ({ filters, onFilterChange }: BillFiltersProps) => {
  const { data: customersData } = useQuery({
    queryKey: ["customers", { status: "approved" }],
    queryFn: () => customersService.getAll({ status: "approved", limit: 100 }),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <select
          className="input"
          value={filters.customerId}
          onChange={(e) =>
            onFilterChange({ customerId: e.target.value || undefined })
          }
        >
          <option value="">All Customers</option>
          {customersData?.customers?.map((customer: any) => (
            <option key={customer.id} value={customer.id}>
              {customer.firstName} {customer.lastName}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <Input
          type="text"
          placeholder="Search by description or customer name..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
      </div>
    </div>
  );
};
