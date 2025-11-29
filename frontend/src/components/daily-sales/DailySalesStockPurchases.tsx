import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "../../utils/formatters";
import type { StockPurchaseItem, Product } from "../../types/daily-sales.types";

interface DailySalesStockPurchasesProps {
  stockPurchases: StockPurchaseItem[];
  products: Product[];
  onStockPurchasesChange: (purchases: StockPurchaseItem[]) => void;
  isDisabled?: boolean;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "airtel_money", label: "Airtel Money" },
  { value: "mpamba", label: "Mpamba" },
  { value: "bank", label: "Bank" },
];

export const DailySalesStockPurchases = ({
  stockPurchases,
  products,
  onStockPurchasesChange,
  isDisabled = false,
}: DailySalesStockPurchasesProps) => {
  const [newPurchase, setNewPurchase] = useState<StockPurchaseItem>({
    productId: "",
    quantity: 0,
    unitCost: 0,
    paymentMethod: "cash",
    supplier: "",
    notes: "",
  });

  const handleAddPurchase = () => {
    if (
      newPurchase.productId &&
      newPurchase.quantity > 0 &&
      newPurchase.unitCost > 0
    ) {
      onStockPurchasesChange([...stockPurchases, newPurchase]);
      setNewPurchase({
        productId: "",
        quantity: 0,
        unitCost: 0,
        paymentMethod: "cash",
        supplier: "",
        notes: "",
      });
    }
  };

  const handleRemovePurchase = (index: number) => {
    const newPurchases = stockPurchases.filter((_, i) => i !== index);
    onStockPurchasesChange(newPurchases);
  };

  const totalPurchases = stockPurchases.reduce(
    (sum, purchase) => sum + purchase.quantity * purchase.unitCost,
    0
  );

  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product
      ? `${product.name} ${product.size ? `(${product.size})` : ""}`
      : "Unknown";
  };

  return (
    <Card title="Stock Purchases">
      {/* Existing Purchases List */}
      {stockPurchases.length > 0 && (
        <div className="mb-6 space-y-2">
          {stockPurchases.map((purchase, index) => {
            const totalCost = purchase.quantity * purchase.unitCost;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Product</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getProductName(purchase.productId)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="text-sm font-medium text-gray-900">
                      {purchase.quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Unit Cost</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(purchase.unitCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Cost</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(totalCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {purchase.paymentMethod.replace("_", " ")}
                    </p>
                  </div>
                </div>
                {!isDisabled && (
                  <button
                    onClick={() => handleRemovePurchase(index)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            );
          })}

          <div className="flex justify-end p-3 bg-gray-100 rounded-lg">
            <div className="text-right">
              <p className="text-xs text-gray-600">Total Stock Purchases</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalPurchases)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Purchase Form */}
      {!isDisabled && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900">
            Record Stock Purchase
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="label text-xs">Product</label>
              <select
                value={newPurchase.productId}
                onChange={(e) =>
                  setNewPurchase({ ...newPurchase, productId: e.target.value })
                }
                className="input text-sm"
              >
                <option value="">Select a product</option>
                {products
                  .filter((p) => p.isActive)
                  .sort((a, b) => {
                    // Sort by category first, then by name
                    const catCompare =
                      (a.category?.displayOrder || 0) -
                      (b.category?.displayOrder || 0);
                    if (catCompare !== 0) return catCompare;
                    return a.name.localeCompare(b.name);
                  })
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.category?.name} - {product.name}{" "}
                      {product.size ? `(${product.size})` : ""}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="label text-xs">Quantity</label>
              <Input
                type="number"
                min="1"
                value={newPurchase.quantity}
                onChange={(e) =>
                  setNewPurchase({
                    ...newPurchase,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="text-sm"
              />
            </div>

            <div>
              <label className="label text-xs">Unit Cost (MK)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newPurchase.unitCost}
                onChange={(e) =>
                  setNewPurchase({
                    ...newPurchase,
                    unitCost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="text-sm"
              />
            </div>

            <div>
              <label className="label text-xs">Payment Method</label>
              <select
                value={newPurchase.paymentMethod}
                onChange={(e) =>
                  setNewPurchase({
                    ...newPurchase,
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

            <div>
              <label className="label text-xs">Supplier (Optional)</label>
              <Input
                type="text"
                value={newPurchase.supplier}
                onChange={(e) =>
                  setNewPurchase({ ...newPurchase, supplier: e.target.value })
                }
                placeholder="Supplier name"
                className="text-sm"
              />
            </div>
          </div>

          {/* Total Cost Display */}
          {newPurchase.quantity > 0 && newPurchase.unitCost > 0 && (
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Cost:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(newPurchase.quantity * newPurchase.unitCost)}
                </span>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleAddPurchase}
            disabled={
              !newPurchase.productId ||
              newPurchase.quantity <= 0 ||
              newPurchase.unitCost <= 0
            }
            className="flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Stock Purchase
          </Button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">About Stock Purchases</p>
            <p className="text-xs mt-1">
              Stock purchases automatically increase the "Stock In" column for
              the selected product. The amount spent is tracked separately and
              does NOT reduce your cash at hand in the summary.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
