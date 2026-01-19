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
import { DailySalesBillsSection } from "../components/daily-sales/DailySalesBillsSection";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { ActualCashInput } from "../components/daily-sales/ActualCashInput";
import {
  CalendarIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  ArrowPathIcon,
  LockOpenIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import type { DailyInventoryItem } from "../types/daily-sales.types";
import type { Product } from "../types/product.types";
import { BottleSelectionModal } from "../components/daily-sales/BottleSelectionModal";
import { BottleConversionModal } from "../components/daily-sales/BottleConversionModal";

export const DailySales = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [inventories, setInventories] = useState<DailyInventoryItem[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stockPurchases, setStockPurchases] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [revenueData, setRevenueData] = useState({
    airtelMoney: 0,
    mpamba: 0,
    bank: 0,
  });

  // Modal States
  const [showBottleSelection, setShowBottleSelection] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState<Product | null>(null);

  // Fetch product categories
  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesService.getAll(),
  });

  // Fetch daily sales record for the selected date
  const {
    data: existingDailySales,
    isLoading: isSalesLoading,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ["daily-sales-by-date", selectedDate],
    queryFn: () => dailySalesService.getOrCreateDraft(selectedDate),
  });

  // Fetch active products for initialization
  const { data: productsData } = useQuery({
    queryKey: ["products-for-daily-sales"],
    queryFn: () => productsService.getAll({ isActive: true, limit: 100 }),
  });

  // Calculate billsAmount from actual bills array
  const billsAmount = (existingDailySales?.bills || []).reduce(
    (sum: number, bill: any) =>
      sum + parseFloat(bill.amount?.toString() || "0"),
    0
  );

  const isFinalized = existingDailySales?.status === "finalized";

  // Calculation helper functions
  const calculateTotalSales = () => {
    if (!productsData?.products) return 0;

    return inventories.reduce((total, inv) => {
      const product = productsData.products.find((p) => p.id === inv.productId);
      if (!product) return total;

      const soldQuantity = inv.openingStock + inv.stockIn - inv.closingStock;
      const revenue = soldQuantity * product.currentPrice;
      return total + revenue;
    }, 0);
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce(
      (sum, exp) => sum + (parseFloat(String(exp.amount)) || 0),
      0
    );
  };

  const calculateTotalCollected = () => {
    const airtelMoney = parseFloat(String(revenueData.airtelMoney)) || 0;
    const mpamba = parseFloat(String(revenueData.mpamba)) || 0;
    const bank = parseFloat(String(revenueData.bank)) || 0;
    const cashAtHand = calculateCashAtHand();
    return cashAtHand + airtelMoney + mpamba + bank;
  };

  const calculateCashAtHand = () => {
    const totalSales = calculateTotalSales();
    const totalExpenses = calculateTotalExpenses();
    const airtelMoney = parseFloat(String(revenueData.airtelMoney)) || 0;
    const mpamba = parseFloat(String(revenueData.mpamba)) || 0;
    const bank = parseFloat(String(revenueData.bank)) || 0;

    // Use calculated billsAmount, not from backend
    return (
      totalSales - totalExpenses - airtelMoney - mpamba - bank - billsAmount
    );
  };

  // Initialize form when daily sales record is fetched
  useEffect(() => {
    if (existingDailySales) {
      // NOTE: Do NOT include soldQuantity when setting frontend inventories state,
      // and only keep the fields the API expects (DailyInventoryItem).
      setInventories(
        existingDailySales.inventories.map((inv: any) => ({
          productId: inv.productId,
          openingStock: inv.openingStock,
          stockIn: inv.stockIn,
          closingStock: inv.closingStock,
          productName: inv.product?.name,
          unit: inv.product?.unit,
          categoryId: inv.product?.categoryId,
        }))
      );
      setExpenses(existingDailySales.expenses || []);
      setStockPurchases(existingDailySales.stockPurchases || []);
      setNotes(existingDailySales.notes || "");
      setRevenueData({
        airtelMoney: Number(existingDailySales.airtelMoney) || 0,
        mpamba: Number(existingDailySales.mpamba) || 0,
        bank: Number(existingDailySales.bank) || 0,
      });
    }
  }, [existingDailySales]);

  const transferMutation = useMutation({
    mutationFn: async (data: {
      fromProductId: string;
      toProductId: string;
      quantity: number;
      notes?: string;
    }) => {
      if (!existingDailySales) {
        throw new Error("No daily sales record found");
      }
      return dailySalesService.createInventoryTransfer(
        existingDailySales.id,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sales-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["products-for-daily-sales"] });
      toast.success("Bottle converted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to convert bottle");
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      dailySalesService.update(existingDailySales!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sales-by-date"] });
      toast.success("Daily sales saved successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to save daily sales"
      );
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => dailySalesService.finalize(existingDailySales!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sales-by-date"] });
      toast.success("Daily sales finalized and inventory updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to finalize sales");
    },
  });

  const unlockMutation = useMutation({
    mutationFn: () => dailySalesService.unlock(existingDailySales!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sales-by-date"] });
      toast.success("Daily sales unlocked for editing");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to unlock sales");
    },
  });

  const handleSave = () => {
    if (!existingDailySales) return;

    // Ensure we send only the inventory fields the API accepts.
    const payloadInventories = inventories.map(
      ({ productId, openingStock, stockIn, closingStock }) => ({
        productId,
        openingStock,
        stockIn,
        closingStock,
      })
    );

    saveMutation.mutate({
      inventories: payloadInventories,
      expenses,
      stockPurchases,
      notes,
      ...revenueData,
    });
  };

  const handleFinalize = () => {
    if (!existingDailySales) return;
    if (
      window.confirm(
        "Are you sure you want to finalize? This will lock the record and update master inventory."
      )
    ) {
      finalizeMutation.mutate();
    }
  };

  const handleUnlock = () => {
    if (!isAdmin) return;
    if (window.confirm("Admin: Unlock this record for editing?")) {
      unlockMutation.mutate();
    }
  };

  const handleConvertClick = () => {
    setShowBottleSelection(true);
  };

  const handleBottleSelect = (bottleProduct: Product) => {
    setSelectedBottle(bottleProduct);
    setShowBottleSelection(false);
  };

  const bottleProducts =
    productsData?.products.filter((p) => p.unit === "bottle") || [];

  if (isSalesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Sales</h1>
          <p className="text-gray-600 mt-1">
            Record inventory and sales for{" "}
            {format(new Date(selectedDate), "PPPP")}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <CalendarIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input pl-10"
            />
          </div>
          {isFinalized && isAdmin && (
            <Button
              variant="secondary"
              onClick={handleUnlock}
              isLoading={unlockMutation.isPending}
            >
              <LockOpenIcon className="w-5 h-5 mr-2" />
              Unlock
            </Button>
          )}
        </div>
      </div>

      {/* Bills Section */}
      {existingDailySales && (
        <DailySalesBillsSection
          selectedDate={selectedDate}
          billsForDate={existingDailySales.bills || []}
          billsAmount={billsAmount}
          isDisabled={isFinalized}
          onBillCreated={() => refetchSales()}
        />
      )}

      {/* Summary */}
      <DailySalesSummary
        totals={{
          totalSales: calculateTotalSales(),
          totalCollected: calculateTotalCollected(),
          totalExpenses: calculateTotalExpenses(),
          shortage: existingDailySales?.shortage || 0,
          netRevenue: calculateTotalSales() - calculateTotalExpenses(),
          cashAtHand: calculateCashAtHand(),
          inventories: inventories,
        }}
        billsAmount={billsAmount}
      />

      {/* Inventory Tracking */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <DocumentCheckIcon className="w-5 h-5 mr-2 text-primary-600" />
            Inventory Tracking
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleConvertClick}
              disabled={isFinalized || bottleProducts.length === 0}
              className="flex items-center"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1.5" />
              Convert Bottle
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchSales()}
            >
              <ArrowPathIcon className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        {productsData?.products && productsData.products.length > 0 ? (
          <DailySalesInventoryGrid
            products={productsData.products}
            categories={categories || []}
            inventories={inventories}
            onInventoriesChange={setInventories}
            isDisabled={isFinalized}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading products...</p>
          </div>
        )}
      </Card>

      {/* Income Avenue (Revenue Collection) */}
      <DailySalesRevenueForm
        revenue={revenueData}
        cashAtHand={calculateCashAtHand()}
        onRevenueChange={setRevenueData}
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
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special notes for today..."
          className="input min-h-[100px]"
          disabled={isFinalized}
        />
      </Card>

      {/* Action Bar */}
      {!isFinalized && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end space-x-4 z-10 lg:left-64">
          <Button
            variant="secondary"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            disabled={finalizeMutation.isPending}
          >
            <PencilIcon className="w-5 h-5 mr-2" />
            Save Draft
          </Button>
          <Button
            variant="primary"
            onClick={handleFinalize}
            isLoading={finalizeMutation.isPending}
            disabled={saveMutation.isPending}
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Finalize Daily Sales
          </Button>
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

      {isFinalized && isAdmin && existingDailySales && (
        <ActualCashInput
          dailySalesId={existingDailySales.id}
          currentCashAtHand={existingDailySales.cashAtHand || 0}
          currentActualCash={existingDailySales.actualCashCollected}
        />
      )}

      {/* Modals */}
      {showBottleSelection && (
        <BottleSelectionModal
          isOpen={true}
          onClose={() => setShowBottleSelection(false)}
          bottleProducts={bottleProducts}
          onSelect={handleBottleSelect}
        />
      )}

      {selectedBottle && (
        <BottleConversionModal
          isOpen={true}
          onClose={() => setSelectedBottle(null)}
          bottleProduct={selectedBottle}
          shotProduct={productsData?.products.find(
            (p) => p.id === selectedBottle.linkedShotProductId
          )}
          onSubmit={(data) => {
            if (!selectedBottle.linkedShotProductId) {
              toast.error("No linked shot product found");
              return;
            }

            transferMutation.mutate({
              fromProductId: selectedBottle.id,
              toProductId: selectedBottle.linkedShotProductId,
              quantity: data.quantity,
              notes: data.notes,
            });
            setSelectedBottle(null);
          }}
          isLoading={transferMutation.isPending}
        />
      )}
    </div>
  );
};
