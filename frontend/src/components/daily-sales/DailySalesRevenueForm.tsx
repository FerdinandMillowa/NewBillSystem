import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { formatCurrency } from "../../utils/formatters";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface Revenue {
  airtelMoney: number;
  mpamba: number;
  bank: number;
}

interface DailySalesRevenueFormProps {
  revenue: Revenue;
  cashAtHand: number; // System-calculated cash
  onRevenueChange: (revenue: Revenue) => void;
  isDisabled?: boolean;
}

export const DailySalesRevenueForm = ({
  revenue,
  cashAtHand,
  onRevenueChange,
  isDisabled = false,
}: DailySalesRevenueFormProps) => {
  const totalIncome =
    cashAtHand + revenue.airtelMoney + revenue.mpamba + revenue.bank;

  const handleChange = (field: keyof Revenue, value: number) => {
    onRevenueChange({
      ...revenue,
      [field]: value,
    });
  };

  return (
    <Card title="Income Avenue (Revenue Collection)">
      {/* Info Box with Correct Formula */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Cash at Hand is Auto-Calculated</p>
            <p className="text-xs mt-1">
              Cash = Total Sales (inventory) - Total Expenses - (Airtel Money +
              Mpamba + Bank) - Bills Amount
            </p>
            <p className="text-xs mt-1 italic">
              Bills are credit sales (customers didn't pay today), so they
              reduce cash at hand.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Cash at Hand - Display Only (System Calculated) */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <label className="label text-green-900 dark:text-green-100">
            Cash at Hand (Auto)
          </label>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(cashAtHand)}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            System calculated
          </p>
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
        <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
          <label className="label text-primary-900 dark:text-primary-100">
            Total Income
          </label>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(totalIncome)}
          </p>
          <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
            All methods
          </p>
        </div>
      </div>

      {/* Breakdown Display */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Income Breakdown
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Cash</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(cashAtHand)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Airtel Money
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(revenue.airtelMoney)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Mpamba</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(revenue.mpamba)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Bank</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(revenue.bank)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
