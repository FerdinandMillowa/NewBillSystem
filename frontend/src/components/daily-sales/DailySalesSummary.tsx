import type { DailyInventoryItem } from "../../types/daily-sales.types";
import { formatCurrency } from "../../utils/formatters";
import { Card } from "../ui/Card";
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  MinusCircleIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

interface DailySalesSummaryProps {
  totals: {
    totalSales: number;
    totalCollected: number;
    totalExpenses: number;
    netRevenue: number;
    cashAtHand: number;
    inventories: DailyInventoryItem[];
    actualCashCollected?: number | null;
  };
  billsAmount: number;
}

export const DailySalesSummary = ({
  totals,
  billsAmount,
}: DailySalesSummaryProps) => {
  const shortage =
    totals.actualCashCollected != null
      ? Math.max(0, totals.cashAtHand - totals.actualCashCollected)
      : 0;

  const stats = [
    {
      name: "Total Sales",
      value: formatCurrency(totals.totalSales),
      icon: CurrencyDollarIcon,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      name: "Total Collected",
      value: formatCurrency(totals.totalCollected),
      icon: BanknotesIcon,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      name: "Total Expenses",
      value: formatCurrency(totals.totalExpenses),
      icon: MinusCircleIcon,
      color: "bg-red-500",
      textColor: "text-red-600",
    },
    {
      name: "Net Revenue",
      value: formatCurrency(totals.netRevenue),
      icon: ArrowTrendingUpIcon,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className={`text-2xl font-bold ${stat.textColor} mt-2`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shortage only shows when actual cash has been entered AND there is a shortage */}
        {shortage > 0 && (
          <Card className="bg-yellow-50 border border-yellow-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MinusCircleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Shortage
                </h3>
                <p className="text-lg font-bold text-yellow-900 mt-1">
                  {formatCurrency(shortage)}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="bg-green-50 border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Cash at Hand
              </h3>
              <p className="text-lg font-bold text-green-900 mt-1">
                {formatCurrency(totals.cashAtHand)}
              </p>
            </div>
          </div>
        </Card>

        {billsAmount > 0 && (
          <Card className="bg-blue-50 border border-blue-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Bills Amount
                </h3>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  {formatCurrency(billsAmount)}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
