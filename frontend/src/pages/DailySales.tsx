import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailySalesService } from "../services/daily-sales.service";
import { productsService } from "../services/products.service";
import { productCategoriesService } from "../services/product-categories.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DailySalesInventoryGrid } from "../components/daily-sales/DailySalesInventoryGrid";
import { DailySalesRevenueForm } from "../components/daily-sales/DailySalesRevenueForm";
import { DailySalesExpensesForm } from "../components/daily-sales/DailySalesExpensesForm";
import { DailySalesStockPurchases } from "../components/daily-sales/DailySalesStockPurchases";
import { DailySalesSummary } from "../components/daily-sales/DailySalesSummary";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import type {
  DailyInventoryItem,
  DailyExpenseItem,
  StockPurchaseItem,
} from "../types/daily-sales.types";

export const DailySales = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  // Form state
  const [inventories, setInventories] = useState<DailyInventoryItem[]>([]);
  const [revenue, setRevenue] = useState({
    cash: 0,
    airtelMoney: 0,
    mpamba: 0,
    bank: 0,
  });
  const [expenses, setExpenses] = useState<DailyExpenseItem[]>([]);
  const [stockPurchases, setStockPurchases] = useState<StockPurchaseItem[]>([]);
  const [billsAmount, setBillsAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesService.getAll(),
  });

  // Fetch all active products
  const { data: productsData } = useQuery({
    queryKey: ["products-for-daily-sales"],
    queryFn: () =>
      productsService.getAll({
        isActive: true,
        limit: 500, // Get all products
      }),
  });

  // Fetch existing daily sales for selected date
  const { data: existingDailySales, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["daily-sales-by-date", selectedDate],
    queryFn: () => dailySalesService.getByDate(selectedDate),
    retry: false,
    enabled: !!selectedDate,
  });

  // Initialize form with existing data or previous day's closing stock
  useEffect(() => {
    if (existingDailySales) {
      // Load existing daily sales data
      setInventories(
        existingDailySales.inventories.map((inv) => ({
          productId: inv.productId,
          openingStock: inv.openingStock,
          stockIn: inv.stockIn,
          closingStock: inv.closingStock,
        }))
      );
      setRevenue({
        cash: Number(existingDailySales.cash),
        airtelMoney: Number(existingDailySales.airtelMoney),
        mpamba: Number(existingDailySales.mpamba),
        bank: Number(existingDailySales.bank),
      });
      setExpenses(existingDailySales.expenses || []);
      setStockPurchases(existingDailySales.stockPurchases || []);
      setBillsAmount(Number(existingDailySales.billsAmount));
      setNotes(existingDailySales.notes || "");
    } else if (productsData?.products) {
      // Initialize with product current stock as opening stock
      const initialInventories = productsData.products.map((product) => ({
        productId: product.id,
        openingStock: product.currentStock,
        stockIn: 0,
        closingStock: product.currentStock,
      }));
      setInventories(initialInventories);
      setRevenue({ cash: 0, airtelMoney: 0, mpamba: 0, bank: 0 });
      setExpenses([]);
      setStockPurchases([]);
      setBillsAmount(0);
      setNotes("");
    }
  }, [existingDailySales, productsData]);

  // Calculate totals
  const calculateTotals = () => {
    let totalSales = 0;

    if (productsData?.products && inventories.length > 0) {
      inventories.forEach((inv) => {
        const product = productsData.products.find(
          (p) => p.id === inv.productId
        );
        if (product) {
          const soldQuantity =
            inv.openingStock + inv.stockIn - inv.closingStock;
          totalSales += soldQuantity * product.currentPrice;
        }
      });
    }

    const totalCollected =
      revenue.cash + revenue.airtelMoney + revenue.mpamba + revenue.bank;
    const totalExpensesAmount = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const shortage = totalSales - totalCollected;
    const cashExpenses = expenses
      .filter((exp) => exp.paymentMethod === "cash")
      .reduce((sum, exp) => sum + exp.amount, 0);
    const netRevenue = totalSales - totalExpensesAmount;
    const cashAtHand = revenue.cash - cashExpenses;

    return {
      totalSales,
      totalCollected,
      totalExpenses: totalExpensesAmount,
      shortage: shortage > 0 ? shortage : 0,
      netRevenue,
      cashAtHand,
    };
  };

  const totals = calculateTotals();

  // Create/Update mutation
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
      toast.success("Daily sales saved successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to save daily sales"
      );
    },
  });

  // Finalize mutation
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

  const handleSaveDraft = () => {
    const data = {
      date: selectedDate,
      ...revenue,
      billsAmount,
      inventories: inventories.filter((inv) => {
        // Only include products that have some activity
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

    if (
      window.confirm(
        "Are you sure you want to finalize this daily sales? You won't be able to edit it afterwards without admin approval."
      )
    ) {
      finalizeMutation.mutate(existingDailySales.id);
    }
  };

  const isFinalized = existingDailySales?.status === "finalized";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Daily Sales Entry
          </h1>
          <p className="text-gray-600 mt-1">
            Record today's inventory, revenue, and expenses
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {existingDailySales && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
              {isFinalized ? (
                <>
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    Finalized
                  </span>
                </>
              ) : (
                <>
                  <DocumentCheckIcon className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">
                    Draft
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Date Selector */}
      <Card>
        <div className="flex items-center space-x-4">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
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
            <div className="flex items-center space-x-2 text-gray-500">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Summary Dashboard */}
      <DailySalesSummary totals={totals} billsAmount={billsAmount} />

      {/* Inventory Grid */}
      <DailySalesInventoryGrid
        products={productsData?.products || []}
        categories={categories || []}
        inventories={inventories}
        onInventoriesChange={setInventories}
        isDisabled={isFinalized}
      />

      {/* Revenue Collection */}
      <DailySalesRevenueForm
        revenue={revenue}
        billsAmount={billsAmount}
        onRevenueChange={setRevenue}
        onBillsAmountChange={setBillsAmount}
        isDisabled={isFinalized}
      />

      {/* Expenses */}
      <DailySalesExpensesForm
        expenses={expenses}
        onExpensesChange={setExpenses}
        isDisabled={isFinalized}
      />

      {/* Stock Purchases */}
      <DailySalesStockPurchases
        stockPurchases={stockPurchases}
        products={productsData?.products || []}
        onStockPurchasesChange={setStockPurchases}
        isDisabled={isFinalized}
      />

      {/* Notes */}
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

      {/* Action Buttons */}
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
        <Card className="bg-green-50 border border-green-200">
          <div className="flex items-center">
            <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Daily Sales Finalized
              </h3>
              <p className="text-sm text-green-700 mt-1">
                This daily sales record has been finalized and locked. Contact
                an administrator if you need to make changes.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
