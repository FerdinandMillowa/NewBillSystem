import type { ProductCategory } from "../../types/product.types";
import clsx from "clsx";

interface CategoryTabsProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryTabs = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        <button
          onClick={() => onSelectCategory("all")}
          className={clsx(
            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
            selectedCategory === "all"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          )}
        >
          All Products
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={clsx(
              "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
              selectedCategory === category.id
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {category.name}
            {category.products && (
              <span className="ml-2 text-xs text-gray-400">
                ({category.products.length})
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
