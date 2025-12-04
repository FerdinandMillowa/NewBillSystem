import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailySalesService } from "../services/daily-sales.service";
import { productsService } from "../services/products.service";
import { productCategoriesService } from "../services/product-categories.service";
import { billsService } from "../services/bills.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DailySalesInventoryGrid } from "../components/daily-sales/DailySalesInventoryGrid";
import { DailySalesRevenueForm } from "../components/daily-sales/DailySalesRevenueForm";
import { DailySalesExpensesForm } from "../components/daily-sales/DailySalesExpensesForm";
import { DailySalesStockPurchases } from "../components/daily-sales/DailySalesStockPurchases";
import { DailySalesSummary } from "../components/daily-sales/DailySalesSummary";
import { DailySalesBillsSection } from "../components/daily-sales/DailySalesBillsSection";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  ArrowPathIcon,
  LockOpenIcon,
  PencilIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import type {
  DailyInventoryItem,
  DailyExpenseItem,
  StockPurchaseItem,
} from "../types/daily-sales.types";

export const DailySales = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [showPreviousDayWarning, setShowPreviousDayWarning] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Form state
  const [inventories, setInventories] = useState<DailyInventoryItem[]>([]);
  const [revenue, setRevenue] = useState({
    airtelMoney: 0,
    mpamba: 0,
    bank: 0,
  });
  const [expenses, setExpenses] = useState<DailyExpenseItem[]>([]);
  const [stockPurchases, setStockPurchases] = useState<StockPurchaseItem[]>([]);
  const [notes, setNotes] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesService.getAll(),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-for-daily-sales"],
    queryFn: () =>
      productsService.getAll({
        isActive: true,
        limit: 500,
      }),
  });

  const { data: existingDailySales, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["daily-sales-by-date", selectedDate],
    queryFn: () => dailySalesService.getByDate(selectedDate),
    retry: false,
    enabled: !!selectedDate,
  });

  const { data: billsForDate } = useQuery({
    queryKey: ["bills-by-date", selectedDate],
    queryFn: async () => {
      const response = await dailySalesService.getBillsForDate(selectedDate);
      return response || [];
    },
    enabled: !!selectedDate,
  });

  const billsAmount = (billsForDate || []).reduce(
    (sum: number, bill: any) => sum + parseFloat(bill.amount || 0),
    0
  );

  useEffect(() => {
    if (existingDailySales) {
      setInventories(
        existingDailySales.inventories.map((inv) => ({
          productId: inv.productId,
          openingStock: inv.openingStock,
          stockIn: inv.stockIn,
          closingStock: inv.closingStock,
        }))
      );
      setRevenue({
        airtelMoney: Number(existingDailySales.airtelMoney) || 0,
        mpamba: Number(existingDailySales.mpamba) || 0,
        bank: Number(existingDailySales.bank) || 0,
      });
      setExpenses(existingDailySales.expenses || []);
      setStockPurchases(existingDailySales.stockPurchases || []);
      setNotes(existingDailySales.notes || "");
    } else if (productsData?.products) {
      const initialInventories = productsData.products.map((product) => ({
        productId: product.id,
        openingStock: product.currentStock,
        stockIn: 0,
        closingStock: product.currentStock,
      }));
      setInventories(initialInventories);
      setRevenue({ airtelMoney: 0, mpamba: 0, bank: 0 });
      setExpenses([]);
      setStockPurchases([]);
      setNotes("");
    }
  }, [existingDailySales, productsData]);

  const validateStockPurchases = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    inventories.forEach((inv) => {
      const stockIn = inv.stockIn || 0;

      if (stockIn > 0) {
        const purchase = stockPurchases.find(
          (p) => p.productId === inv.productId
        );

        if (!purchase || purchase.quantity === 0) {
          const product = productsData?.products.find(
            (p) => p.id === inv.productId
          );
          errors.push(
            `Stock In entered for "${product?.name}" but no Stock Purchase recorded.`
          );
        } else if (purchase.quantity !== stockIn) {
          const product = productsData?.products.find(
            (p) => p.id === inv.productId
          );
          errors.push(
            `Stock In (${stockIn}) doesn't match Stock Purchase (${purchase.quantity}) for "${product?.name}".`
          );
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const calculateTotals = () => {
    let totalSalesFromInventory = 0;

    if (productsData?.products && inventories.length > 0) {
      inventories.forEach((inv) => {
        const product = productsData.products.find(
          (p) => p.id === inv.productId
        );
        if (product) {
          const soldQuantity =
            inv.openingStock + inv.stockIn - inv.closingStock;
          const revenue = soldQuantity * product.currentPrice;
          totalSalesFromInventory += revenue;
        }
      });
    }

    const airtelMoney = parseFloat(String(revenue.airtelMoney)) || 0;
    const mpamba = parseFloat(String(revenue.mpamba)) || 0;
    const bank = parseFloat(String(revenue.bank)) || 0;
    const nonCashCollected = airtelMoney + mpamba + bank;

    const totalExpensesAmount = expenses.reduce(
      (sum, exp) => sum + (parseFloat(String(exp.amount)) || 0),
      0
    );

    const cashAtHand =
      totalSalesFromInventory -
      totalExpensesAmount -
      nonCashCollected -
      billsAmount;

    const totalSales = totalSalesFromInventory;

    const totalCollected = cashAtHand + nonCashCollected;

    const shortage = totalSales - totalCollected;

    const netRevenue = totalSales - totalExpensesAmount;

    const cashExpenses = expenses
      .filter((exp) => exp.paymentMethod === "cash")
      .reduce((sum, exp) => sum + (parseFloat(String(exp.amount)) || 0), 0);

    return {
      totalSales,
      totalCollected,
      totalExpenses: totalExpensesAmount,
      shortage: shortage > 0 ? shortage : 0,
      netRevenue,
      cashAtHand,
      cashExpenses,
      totalSalesFromInventory,
    };
  };

  const totals = calculateTotals();

  useEffect(() => {
    if (stockPurchases.length > 0) {
      const updatedInventories = [...inventories];

      stockPurchases.forEach((purchase) => {
        const invIndex = updatedInventories.findIndex(
          (inv) => inv.productId === purchase.productId
        );

        if (invIndex !== -1) {
          if (updatedInventories[invIndex].stockIn === 0) {
            updatedInventories[invIndex] = {
              ...updatedInventories[invIndex],
              stockIn: purchase.quantity,
            };
          }
        }
      });

      setInventories(updatedInventories);
    }
  }, [stockPurchases]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (existingDailySales) {
        return dailySalesService.update(existingDailySales.id, data);
      } else {
        return dailySalesService.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sales-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["daily-sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setValidationErrors([]);
      toast.success("Daily sales saved successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to save daily sales";

      if (message.includes("not finalized")) {
        setShowPreviousDayWarning(true);
      }

      toast.error(message);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => dailySalesService.finalize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sales-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["daily-sales"] });
      toast.success("Daily sales finalized!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to finalize daily sales"
      );
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => dailySalesService.unlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sales-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["daily-sales"] });
      toast.success("Daily sales unlocked! You can now edit it.");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to unlock daily sales"
      );
    },
  });

  const handleSaveDraft = () => {
    const validation = validateStockPurchases();
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      toast.error("Please fix validation errors before saving");
      return;
    }

    setValidationErrors([]);

    const data = {
      date: selectedDate,
      cash: totals.cashAtHand,
      ...revenue,
      billsAmount,
      inventories: inventories.filter((inv) => {
        return inv.openingStock > 0 || inv.stockIn > 0 || inv.closingStock > 0;
      }),
      expenses,
      stockPurchases,
      notes,
    };

    saveMutation.mutate(data);
  };

  const handleFinalize = () => {
    if (!existingDailySales) {
      toast.error("Please save the daily sales first");
      return;
    }

    const validation = validateStockPurchases();
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      toast.error("Please fix validation errors before finalizing");
      return;
    }

    setValidationErrors([]);

    if (
      window.confirm(
        "Are you sure you want to finalize this daily sales? You won't be able to edit it afterwards without admin approval."
      )
    ) {
      finalizeMutation.mutate(existingDailySales.id);
    }
  };

  const handleUnlock = () => {
    if (!existingDailySales) return;

    if (
      window.confirm(
        "Are you sure you want to unlock this finalized daily sales? This will allow editing again."
      )
    ) {
      unlockMutation.mutate(existingDailySales.id);
    }
  };

  const isFinalized = existingDailySales?.status === "finalized";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Daily Sales Entry
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Record today's inventory, revenue, and expenses
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {existingDailySales && (
            <>
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {isFinalized ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Finalized
                    </span>
                  </>
                ) : (
                  <>
                    <DocumentCheckIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      Draft
                    </span>
                  </>
                )}
              </div>
              {isFinalized && isAdmin && (
                <>
                  <Button
                    variant="secondary"
                    onClick={handleUnlock}
                    isLoading={unlockMutation.isPending}
                    className="flex items-center"
                  >
                    <LockOpenIcon className="w-5 h-5 mr-2" />
                    Unlock
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      unlockMutation.mutate(existingDailySales.id);
                    }}
                    className="flex items-center"
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Edit (Admin)
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showPreviousDayWarning && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Previous Day Not Finalized
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                The previous day's sales have not been finalized. Please
                finalize the previous day before entering sales for this date to
                maintain sequential data integrity.
              </p>
              <button
                onClick={() => setShowPreviousDayWarning(false)}
                className="text-sm font-medium text-yellow-800 dark:text-yellow-200 underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Card>
      )}

      {validationErrors.length > 0 && (
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Validation Errors
              </h3>
              <ul className="mt-2 space-y-1">
                {validationErrors.map((error, index) => (
                  <li
                    key={index}
                    className="text-sm text-red-700 dark:text-red-300"
                  >
                    • {error}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setValidationErrors([])}
                className="text-sm font-medium text-red-800 dark:text-red-200 underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center space-x-4">
          <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <div className="flex-1">
            <label className="label">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")}
              disabled={isFinalized}
              className="input max-w-xs"
            />
          </div>
          {isLoadingExisting && (
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      </Card>

      <DailySalesBillsSection
        selectedDate={selectedDate}
        billsForDate={billsForDate || []}
        billsAmount={billsAmount}
        isDisabled={isFinalized}
        onBillCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["bills-by-date"] });
        }}
      />

      <DailySalesSummary totals={totals} billsAmount={billsAmount} />

      <DailySalesInventoryGrid
        products={productsData?.products || []}
        categories={categories || []}
        inventories={inventories}
        onInventoriesChange={setInventories}
        isDisabled={isFinalized}
      />

      <DailySalesRevenueForm
        revenue={revenue}
        cashAtHand={totals.cashAtHand}
        onRevenueChange={setRevenue}
        isDisabled={isFinalized}
      />

      <DailySalesExpensesForm
        expenses={expenses}
        onExpensesChange={setExpenses}
        isDisabled={isFinalized}
      />

      <DailySalesStockPurchases
        stockPurchases={stockPurchases}
        products={productsData?.products || []}
        onStockPurchasesChange={setStockPurchases}
        isDisabled={isFinalized}
      />

      <Card title="Additional Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add any additional notes or comments..."
          disabled={isFinalized}
          className="input"
        />
      </Card>

      {!isFinalized && (
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            isLoading={saveMutation.isPending}
            disabled={saveMutation.isPending || finalizeMutation.isPending}
          >
            Save Draft
          </Button>
          {existingDailySales && (
            <Button
              variant="primary"
              onClick={handleFinalize}
              isLoading={finalizeMutation.isPending}
              disabled={saveMutation.isPending || finalizeMutation.isPending}
              className="flex items-center"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Finalize Daily Sales
            </Button>
          )}
        </div>
      )}

      {isFinalized && (
        <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Daily Sales Finalized
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                This daily sales record has been finalized and locked.
                {isAdmin &&
                  " As an admin, you can unlock it using the button above."}
                {!isAdmin &&
                  " Contact an administrator if you need to make changes."}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
