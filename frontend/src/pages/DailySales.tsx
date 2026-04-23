import { useState, useEffect, useRef } from "react";
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

  // Track if we've initialized the form for the current record
  const initializedRecordId = useRef<string | null>(null);

  // Fetch product categories
  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesService.getAll(),
  });

  // Fetch existing daily sales (NO auto-create)
  const {
    data: existingDailySales,
    isLoading: isSalesLoading,
    refetch: refetchDailySales,
  } = useQuery({
    queryKey: ["daily-sales-by-date", selectedDate],
    queryFn: async () => {
      try {
        return await dailySalesService.getByDate(selectedDate);
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null; // No record exists
        }
        throw error;
      }
    },
    retry: false,
  });

  // Get nearest finalized record before selected date
  const { data: nearestPreviousRecord } = useQuery({
    queryKey: ["daily-sales-nearest-before", selectedDate],
    queryFn: async () => {
      try {
        return await dailySalesService.getNearestBefore(selectedDate);
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !existingDailySales, // Only fetch when no current record exists
  });

  // For display: Calculate how many days ago the nearest record was
  const daysSinceLastRecord = nearestPreviousRecord
    ? Math.floor(
        (new Date(selectedDate).getTime() -
          new Date(nearestPreviousRecord.date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Fetch active products for initialization
  const { data: productsData } = useQuery({
    queryKey: ["products", undefined, undefined], // ✅ Matches the key invalidated by EditProductModal
    queryFn: () => productsService.getAll({ isActive: true, limit: 100 }),
    staleTime: 0, // ✅ Always re-fetch fresh data when navigating to this page
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

      // ✅ CRITICAL: Calculate sold quantity EXCLUDING conversions
      const soldQuantity =
        inv.openingStock +
        inv.stockIn -
        inv.closingStock -
        (inv.convertedOut || 0); // Exclude bottles converted

      const actualSold = Math.max(0, soldQuantity); // Ensure non-negative
      const revenue = actualSold * product.currentPrice;
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

  const calculateCashExpenses = () => {
    return expenses.reduce((sum, exp) => {
      const method = exp.paymentMethod || "cash";
      if (method === "cash") {
        return sum + (parseFloat(String(exp.amount)) || 0);
      }
      return sum;
    }, 0);
  };

  const calculateCashAtHand = () => {
    const totalSales = calculateTotalSales();
    const cashExpenses = calculateCashExpenses(); // only cash-paid expenses
    const airtelMoney = parseFloat(String(revenueData.airtelMoney)) || 0;
    const mpamba = parseFloat(String(revenueData.mpamba)) || 0;
    const bank = parseFloat(String(revenueData.bank)) || 0;

    // Non-cash expenses do not reduce physical cash at hand.
    // Only cash expenses, digital collections, and bills reduce it.
    return (
      totalSales - cashExpenses - airtelMoney - mpamba - bank - billsAmount
    );
  };

  // Initialize form when daily sales record is fetched
  // CRITICAL: Only initialize once per record to prevent wiping unsaved changes
  useEffect(() => {
    if (
      existingDailySales &&
      initializedRecordId.current !== existingDailySales.id
    ) {
      // Mark this record as initialized
      initializedRecordId.current = existingDailySales.id;

      setInventories(
        existingDailySales.inventories.map((inv: any) => ({
          productId: inv.productId,
          openingStock: inv.openingStock,
          stockIn: inv.stockIn,
          closingStock: inv.closingStock,
          soldQuantity: inv.soldQuantity,
          productName: inv.product?.name,
          unit: inv.product?.unit,
          categoryId: inv.product?.categoryId,
          // ✅ NEW: Include conversion fields
          convertedOut: inv.convertedOut || 0,
          convertedIn: inv.convertedIn || 0,
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
    } else if (!existingDailySales) {
      // Reset initialization tracking when no record exists
      initializedRecordId.current = null;
    }
  }, [existingDailySales]);

  const handleStockPurchasesChange = (purchases: any[]) => {
    // Calculate purchased quantities per product
    const newPurchasesByProduct = new Map<string, number>();
    purchases.forEach((purchase) => {
      const current = newPurchasesByProduct.get(purchase.productId) || 0;
      newPurchasesByProduct.set(
        purchase.productId,
        current + purchase.quantity
      );
    });

    // Calculate from old purchases
    const oldPurchasesByProduct = new Map<string, number>();
    stockPurchases.forEach((purchase) => {
      const current = oldPurchasesByProduct.get(purchase.productId) || 0;
      oldPurchasesByProduct.set(
        purchase.productId,
        current + purchase.quantity
      );
    });

    // Update inventories with new purchase quantities
    setInventories((prev) =>
      prev.map((inv) => {
        const newPurchased = newPurchasesByProduct.get(inv.productId) || 0;
        const oldPurchased = oldPurchasesByProduct.get(inv.productId) || 0;
        const manualStockIn = inv.stockIn - oldPurchased;
        return {
          ...inv,
          stockIn: manualStockIn + newPurchased,
        };
      })
    );

    setStockPurchases(purchases);
  };

  // AFTER
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
      // ✅ FIX: Force re-initialization by resetting the guard BEFORE invalidating.
      // The useEffect guard compares record ID — resetting it allows the effect
      // to re-run and reload inventories from the freshly fetched record.
      initializedRecordId.current = null;

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

  // Create a new draft when user wants to start entering data for non-today dates
  const createDraftMutation = useMutation({
    mutationFn: async () => {
      let initialInventories: any[] = [];

      // Use nearest finalized record before this date
      if (nearestPreviousRecord?.inventories) {
        initialInventories = nearestPreviousRecord.inventories.map(
          (inv: any) => ({
            productId: inv.productId,
            openingStock: inv.closingStock, // Use closing stock from nearest previous
            stockIn: 0,
            closingStock: inv.closingStock,
            // ✅ REMOVED: convertedOut and convertedIn
            // These are backend-only fields managed during conversions
          })
        );
      }
      // Fallback: If no previous records exist at all, use current product stock
      else if (productsData?.products) {
        initialInventories = productsData.products
          .filter((p) => p.isActive)
          .map((p) => ({
            productId: p.id,
            openingStock: p.currentStock,
            stockIn: 0,
            closingStock: p.currentStock,
            // ✅ REMOVED: convertedOut and convertedIn
          }));
      }

      return dailySalesService.create({
        date: selectedDate,
        inventories: initialInventories,
        expenses: [],
        stockPurchases: [],
      });
    },
    onSuccess: () => {
      refetchDailySales();
      toast.success(
        nearestPreviousRecord
          ? `Record created using ${format(
              new Date(nearestPreviousRecord.date),
              "MMM d"
            )} data`
          : "Record created with current inventory"
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create record");
    },
  });

  const handleSave = () => {
    if (!existingDailySales) return;

    // ✅ FIX #1: Remove database-generated fields before sending to backend
    const cleanInventories = inventories.map(
      ({
        soldQuantity, // Remove - calculated field
        productName, // Remove - display field
        unit, // Remove - display field
        categoryId, // Remove - display field
        revenue, // Remove - calculated field
        productPrice, // Remove - managed by backend
        ...rest
      }) => rest
    );

    // ✅ FIX #1: Strip database-generated fields from expenses
    const cleanExpenses = expenses.map((exp) => ({
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      paymentMethod: exp.paymentMethod || "cash",
    }));

    // ✅ FIX #1: Strip database-generated fields from stock purchases
    const cleanStockPurchases = stockPurchases.map((sp) => ({
      productId: sp.productId,
      quantity: sp.quantity,
      unitCost: sp.unitCost,
      paymentMethod: sp.paymentMethod || "cash",
      supplierId: sp.supplierId || null,
      notes: sp.notes || "",
    }));

    saveMutation.mutate({
      inventories: cleanInventories,
      expenses: cleanExpenses,
      stockPurchases: cleanStockPurchases,
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
              max={new Date().toISOString().split("T")[0]}
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

      {/* Show "Create Record" button when no record exists for non-today dates */}
      {!existingDailySales && !isSalesLoading && (
        <Card className="mb-6">
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No record for {format(new Date(selectedDate), "MMMM d, yyyy")}
            </h3>
            <p className="text-gray-500 mb-4">
              {nearestPreviousRecord ? (
                <>
                  Will initialize from{" "}
                  <span className="font-medium text-gray-700">
                    {format(
                      new Date(nearestPreviousRecord.date),
                      "MMM d, yyyy"
                    )}
                  </span>
                  {daysSinceLastRecord > 1 && (
                    <span className="text-yellow-600">
                      {" "}
                      ({daysSinceLastRecord} days ago)
                    </span>
                  )}
                </>
              ) : (
                "No previous records found. Will use current inventory levels."
              )}
            </p>
            <Button
              onClick={() => createDraftMutation.mutate()}
              isLoading={createDraftMutation.isPending}
            >
              Create Record for This Date
            </Button>

            {/* Warning if there's a large gap */}
            {daysSinceLastRecord && daysSinceLastRecord > 7 && (
              <div className="mt-4 text-sm text-yellow-600">
                ⚠️ Large gap detected. Consider entering intermediate dates
                first for accuracy.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Bills Section - only show if record exists */}
      {existingDailySales && (
        <DailySalesBillsSection
          selectedDate={selectedDate}
          billsForDate={existingDailySales.bills || []}
          billsAmount={billsAmount}
          isDisabled={isFinalized}
          onBillCreated={() => {}}
          existingDailySales={existingDailySales}
        />
      )}

      {/* Summary - only show if record exists */}
      {existingDailySales && (
        <DailySalesSummary
          totals={{
            totalSales: calculateTotalSales(),
            totalCollected: calculateTotalCollected(),
            totalExpenses: calculateTotalExpenses(),
            netRevenue: calculateTotalSales() - calculateTotalExpenses(),
            cashAtHand: calculateCashAtHand(),
            inventories: inventories,
            actualCashCollected:
              existingDailySales?.actualCashCollected ?? null,
          }}
          billsAmount={billsAmount}
        />
      )}

      {/* Show main form only if record exists */}
      {existingDailySales ? (
        <>
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
                  onClick={() => refetchDailySales()}
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
            onStockPurchasesChange={handleStockPurchasesChange}
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
              currentCashAtHand={calculateCashAtHand()}
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

                // Proper bottle conversion implementation
                if (!existingDailySales) {
                  toast.error(
                    "Please save the daily sales draft before converting bottles"
                  );
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
        </>
      ) : null}
    </div>
  );
};
