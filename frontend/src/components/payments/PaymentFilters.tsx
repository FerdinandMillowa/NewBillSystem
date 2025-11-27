import { useQuery } from "@tanstack/react-query";
import { customersService } from "../../services/customers.service";
import { Input } from "../ui/Input";

interface PaymentFiltersProps {
  filters: {
    customerId: string;
    paymentMethod: string;
    search: string;
  };
  onFilterChange: (filters: any) => void;
}

export const PaymentFilters = ({
  filters,
  onFilterChange,
}: PaymentFiltersProps) => {
  const { data: customersData } = useQuery({
    queryKey: ["customers", { status: "approved" }],
    queryFn: () => customersService.getAll({ status: "approved", limit: 100 }),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <div>
        <select
          className="input"
          value={filters.paymentMethod}
          onChange={(e) =>
            onFilterChange({ paymentMethod: e.target.value || undefined })
          }
        >
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="mpamba">Mpamba</option>
          <option value="airtel_money">Airtel Money</option>
          <option value="bank">Bank Transfer</option>
          <option value="card">Card</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <Input
          type="text"
          placeholder="Search by notes or customer name..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
      </div>
    </div>
  );
};
