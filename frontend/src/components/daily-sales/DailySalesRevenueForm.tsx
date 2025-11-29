import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { formatCurrency } from "../../utils/formatters";

interface Revenue {
  cash: number;
  airtelMoney: number;
  mpamba: number;
  bank: number;
}

interface DailySalesRevenueFormProps {
  revenue: Revenue;
  billsAmount: number;
  onRevenueChange: (revenue: Revenue) => void;
  onBillsAmountChange: (amount: number) => void;
  isDisabled?: boolean;
}

export const DailySalesRevenueForm = ({
  revenue,
  billsAmount,
  onRevenueChange,
  onBillsAmountChange,
  isDisabled = false,
}: DailySalesRevenueFormProps) => {
  const totalIncome =
    revenue.cash + revenue.airtelMoney + revenue.mpamba + revenue.bank;

  const handleChange = (field: keyof Revenue, value: number) => {
    onRevenueChange({
      ...revenue,
      [field]: value,
    });
  };

  return (
    <Card title="Income Avenue (Revenue Collection)">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Cash */}
        <div>
          <label className="label">Cash (MK)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={revenue.cash}
            onChange={(e) =>
              handleChange("cash", parseFloat(e.target.value) || 0)
            }
            disabled={isDisabled}
            placeholder="0.00"
          />
        </div>

        {/* Airtel Money */}
        <div>
          <label className="label">Airtel Money (MK)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={revenue.airtelMoney}
            onChange={(e) =>
              handleChange("airtelMoney", parseFloat(e.target.value) || 0)
            }
            disabled={isDisabled}
            placeholder="0.00"
          />
        </div>

        {/* Mpamba */}
        <div>
          <label className="label">Mpamba (MK)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={revenue.mpamba}
            onChange={(e) =>
              handleChange("mpamba", parseFloat(e.target.value) || 0)
            }
            disabled={isDisabled}
            placeholder="0.00"
          />
        </div>

        {/* Bank */}
        <div>
          <label className="label">Bank Transfer (MK)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={revenue.bank}
            onChange={(e) =>
              handleChange("bank", parseFloat(e.target.value) || 0)
            }
            disabled={isDisabled}
            placeholder="0.00"
          />
        </div>

        {/* Total Income - Display Only */}
        <div className="bg-primary-50 p-4 rounded-lg">
          <label className="label text-primary-900">Total Income</label>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(totalIncome)}
          </p>
        </div>
      </div>

      {/* Bills Amount - Tracked Separately */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="max-w-xs">
          <label className="label">Bills Amount (Optional)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={billsAmount}
            onChange={(e) =>
              onBillsAmountChange(parseFloat(e.target.value) || 0)
            }
            disabled={isDisabled}
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Track bills created today separately from actual payments
          </p>
        </div>
      </div>
    </Card>
  );
};
