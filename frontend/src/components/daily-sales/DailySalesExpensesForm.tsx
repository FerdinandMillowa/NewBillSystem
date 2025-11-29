import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { DailyExpenseItem } from "../../types/daily-sales.types";
import { formatCurrency } from "../../utils/formatters";

interface DailySalesExpensesFormProps {
  expenses: DailyExpenseItem[];
  onExpensesChange: (expenses: DailyExpenseItem[]) => void;
  isDisabled?: boolean;
}

const EXPENSE_CATEGORIES = [
  { value: "utilities", label: "Utilities (Electricity, Water)" },
  { value: "supplies", label: "Supplies (Candles, Cleaning)" },
  { value: "wages", label: "Wages (Staff Payments)" },
  { value: "transport", label: "Transport" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "airtel_money", label: "Airtel Money" },
  { value: "mpamba", label: "Mpamba" },
  { value: "bank", label: "Bank" },
];

export const DailySalesExpensesForm = ({
  expenses,
  onExpensesChange,
  isDisabled = false,
}: DailySalesExpensesFormProps) => {
  const [newExpense, setNewExpense] = useState<DailyExpenseItem>({
    category: "supplies",
    description: "",
    amount: 0,
    paymentMethod: "cash",
  });

  const handleAddExpense = () => {
    if (newExpense.description && newExpense.amount > 0) {
      onExpensesChange([...expenses, newExpense]);
      setNewExpense({
        category: "supplies",
        description: "",
        amount: 0,
        paymentMethod: "cash",
      });
    }
  };

  const handleRemoveExpense = (index: number) => {
    const newExpenses = expenses.filter((_, i) => i !== index);
    onExpensesChange(newExpenses);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Card title="Expenses">
      {/* Existing Expenses List */}
      {expenses.length > 0 && (
        <div className="mb-6 space-y-2">
          {expenses.map((expense, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {expense.category.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm font-medium text-gray-900">
                    {expense.description}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {expense.paymentMethod?.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
              {!isDisabled && (
                <button
                  onClick={() => handleRemoveExpense(index)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

          <div className="flex justify-end p-3 bg-gray-100 rounded-lg">
            <div className="text-right">
              <p className="text-xs text-gray-600">Total Expenses</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Expense Form */}
      {!isDisabled && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900">Add Expense</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="label text-xs">Category</label>
              <select
                value={newExpense.category}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, category: e.target.value })
                }
                className="input text-sm"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label text-xs">Description</label>
              <Input
                type="text"
                value={newExpense.description}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, description: e.target.value })
                }
                placeholder="e.g., Candles, Water"
                className="text-sm"
              />
            </div>

            <div>
              <label className="label text-xs">Amount (MK)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) =>
                  setNewExpense({
                    ...newExpense,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="text-sm"
              />
            </div>

            <div>
              <label className="label text-xs">Payment Method</label>
              <select
                value={newExpense.paymentMethod}
                onChange={(e) =>
                  setNewExpense({
                    ...newExpense,
                    paymentMethod: e.target.value,
                  })
                }
                className="input text-sm"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleAddExpense}
            disabled={!newExpense.description || newExpense.amount <= 0}
            className="flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Expense
          </Button>
        </div>
      )}
    </Card>
  );
};
