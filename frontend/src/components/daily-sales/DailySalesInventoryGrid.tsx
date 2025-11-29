import { useState } from "react";
import { Card } from "../ui/Card";
import { formatCurrency } from "../../utils/formatters";
import type {
  Product,
  DailyInventoryItem,
} from "../../types/daily-sales.types";
import type { ProductCategory } from "../../types/product.types";

interface DailySalesInventoryGridProps {
  products: Product[];
  categories: ProductCategory[];
  inventories: DailyInventoryItem[];
  onInventoriesChange: (inventories: DailyInventoryItem[]) => void;
  isDisabled?: boolean;
}

export const DailySalesInventoryGrid = ({
  products,
  categories,
  inventories,
  onInventoriesChange,
  isDisabled = false,
}: DailySalesInventoryGridProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleInventoryChange = (
    productId: string,
    field: "openingStock" | "stockIn" | "closingStock",
    value: number
  ) => {
    const newInventories = [...inventories];
    const index = newInventories.findIndex(
      (inv) => inv.productId === productId
    );

    if (index !== -1) {
      newInventories[index] = {
        ...newInventories[index],
        [field]: value,
      };
    } else {
      newInventories.push({
        productId,
        openingStock: field === "openingStock" ? value : 0,
        stockIn: field === "stockIn" ? value : 0,
        closingStock: field === "closingStock" ? value : 0,
      });
    }

    onInventoriesChange(newInventories);
  };

  const getInventoryForProduct = (productId: string): DailyInventoryItem => {
    return (
      inventories.find((inv) => inv.productId === productId) || {
        productId,
        openingStock: 0,
        stockIn: 0,
        closingStock: 0,
      }
    );
  };

  const calculateSoldQuantity = (inv: DailyInventoryItem): number => {
    return inv.openingStock + inv.stockIn - inv.closingStock;
  };

  const calculateRevenue = (
    product: Product,
    inv: DailyInventoryItem
  ): number => {
    const soldQuantity = calculateSoldQuantity(inv);
    return soldQuantity * product.currentPrice;
  };

  // Group products by category
  const productsByCategory = categories.map((category) => ({
    category,
    products: products.filter((p) => p.categoryId === category.id),
  }));

  // Calculate category totals
  const calculateCategoryTotal = (categoryProducts: Product[]): number => {
    return categoryProducts.reduce((sum, product) => {
      const inv = getInventoryForProduct(product.id);
      return sum + calculateRevenue(product, inv);
    }, 0);
  };

  // Calculate grand total
  const grandTotal = products.reduce((sum, product) => {
    const inv = getInventoryForProduct(product.id);
    return sum + calculateRevenue(product, inv);
  }, 0);

  return (
    <Card title="Product Inventory & Sales">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                Product
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Opening
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Stock In
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Total
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Sold
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Closing
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productsByCategory.map(
              ({ category, products: categoryProducts }) => {
                if (categoryProducts.length === 0) return null;

                const isExpanded = expandedCategories.has(category.id);
                const categoryTotal = calculateCategoryTotal(categoryProducts);

                return (
                  <>
                    {/* Category Header Row */}
                    <tr
                      key={`category-${category.id}`}
                      className="bg-primary-50 hover:bg-primary-100 cursor-pointer"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <td
                        colSpan={8}
                        className="px-4 py-3 text-sm font-bold text-primary-900"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg
                              className={`w-5 h-5 mr-2 transform transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="uppercase">{category.name}</span>
                            <span className="ml-2 text-xs text-primary-600">
                              ({categoryProducts.length} products)
                            </span>
                          </div>
                          <span className="font-bold text-primary-900">
                            {formatCurrency(categoryTotal)}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Product Rows */}
                    {isExpanded &&
                      categoryProducts.map((product) => {
                        const inv = getInventoryForProduct(product.id);
                        const soldQuantity = calculateSoldQuantity(inv);
                        const revenue = calculateRevenue(product, inv);
                        const total = inv.openingStock + inv.stockIn;

                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            {/* Product Name */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              {product.size && (
                                <div className="text-xs text-gray-500">
                                  {product.size}
                                </div>
                              )}
                            </td>

                            {/* Opening Stock */}
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={inv.openingStock}
                                onChange={(e) =>
                                  handleInventoryChange(
                                    product.id,
                                    "openingStock",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                disabled={isDisabled}
                                className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </td>

                            {/* Stock In */}
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={inv.stockIn}
                                onChange={(e) =>
                                  handleInventoryChange(
                                    product.id,
                                    "stockIn",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                disabled={isDisabled}
                                className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </td>

                            {/* Total (calculated) */}
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-medium text-gray-700">
                                {total}
                              </span>
                            </td>

                            {/* Sold (calculated) */}
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`text-sm font-bold ${
                                  soldQuantity > 0
                                    ? "text-green-600"
                                    : soldQuantity < 0
                                    ? "text-red-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {soldQuantity}
                              </span>
                            </td>

                            {/* Closing Stock */}
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={inv.closingStock}
                                onChange={(e) =>
                                  handleInventoryChange(
                                    product.id,
                                    "closingStock",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                disabled={isDisabled}
                                className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </td>

                            {/* Price */}
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm text-gray-900">
                                {formatCurrency(product.currentPrice)}
                              </span>
                            </td>

                            {/* Revenue */}
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(revenue)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </>
                );
              }
            )}

            {/* Grand Total Row */}
            <tr className="bg-gray-100 font-bold">
              <td
                colSpan={7}
                className="px-4 py-3 text-right text-sm text-gray-900"
              >
                TOTAL SALES
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-900">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Helper Text */}
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
            <p className="font-medium mb-1">How to use this grid:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <strong>Opening Stock:</strong> Starting inventory (auto-filled
                from previous day's closing)
              </li>
              <li>
                <strong>Stock In:</strong> New stock purchased/received today
              </li>
              <li>
                <strong>Closing Stock:</strong> Remaining inventory at end of
                day
              </li>
              <li>
                <strong>Sold:</strong> Automatically calculated as (Opening +
                Stock In - Closing)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};
