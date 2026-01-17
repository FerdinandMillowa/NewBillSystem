import { Fragment, useState } from "react";
import { Card } from "../ui/Card";
import { formatCurrency } from "../../utils/formatters";
// ✅ FIXED: Using product.types to match productsData
import type { Product, ProductCategory } from "../../types/product.types";
import type { DailyInventoryItem } from "../../types/daily-sales.types";

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
  // ✅ ADDED: Null checks for products and categories
  if (!products || products.length === 0) {
    return (
      <Card title="Product Inventory & Sales">
        <div className="text-center py-8">
          <p className="text-gray-500">No products available</p>
          <p className="text-sm text-gray-400 mt-1">
            Products need to be created first
          </p>
        </div>
      </Card>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card title="Product Inventory & Sales">
        <div className="text-center py-8">
          <p className="text-gray-500">No categories available</p>
          <p className="text-sm text-gray-400 mt-1">
            Create product categories first
          </p>
        </div>
      </Card>
    );
  }

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

  const calculateCategoryTotal = (categoryProducts: Product[]): number => {
    return categoryProducts.reduce((sum, product) => {
      const inv = getInventoryForProduct(product.id);
      return sum + calculateRevenue(product, inv);
    }, 0);
  };

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
                  <Fragment key={category.id}>
                    <tr
                      className="bg-primary-50 hover:bg-primary-100 cursor-pointer"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <td
                        colSpan={8}
                        className="px-4 py-3 text-sm font-bold text-primary-900"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="uppercase">{category.name}</span>
                          </div>
                          <span>{formatCurrency(categoryTotal)}</span>
                        </div>
                      </td>
                    </tr>

                    {isExpanded &&
                      categoryProducts.map((product) => {
                        const inv = getInventoryForProduct(product.id);
                        const soldQuantity = calculateSoldQuantity(inv);
                        const revenue = calculateRevenue(product, inv);
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={inv.openingStock}
                                onChange={(e) =>
                                  handleInventoryChange(
                                    product.id,
                                    "openingStock",
                                    +e.target.value
                                  )
                                }
                                disabled={isDisabled}
                                className="w-16 p-1 border rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={inv.stockIn}
                                onChange={(e) =>
                                  handleInventoryChange(
                                    product.id,
                                    "stockIn",
                                    +e.target.value
                                  )
                                }
                                disabled={isDisabled}
                                className="w-16 p-1 border rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {inv.openingStock + inv.stockIn}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold">
                              {soldQuantity}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={inv.closingStock}
                                onChange={(e) =>
                                  handleInventoryChange(
                                    product.id,
                                    "closingStock",
                                    +e.target.value
                                  )
                                }
                                disabled={isDisabled}
                                className="w-16 p-1 border rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {formatCurrency(product.currentPrice)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold">
                              {formatCurrency(revenue)}
                            </td>
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
