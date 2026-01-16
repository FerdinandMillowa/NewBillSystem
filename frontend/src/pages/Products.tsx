import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "../services/products.service";
import { productCategoriesService } from "../services/product-categories.service";
import type { Product, ProductCategory } from "../types/product.types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CreateProductModal } from "../components/products/CreateProductModal";
import { EditProductModal } from "../components/products/EditProductModal";
import { CreateCategoryModal } from "../components/products/CreateCategoryModal";
import { UpdatePriceModal } from "../components/products/UpdatePriceModal";
import { ProductsTable } from "../components/products/ProductsTable";
import { CategoryTabs } from "../components/products/CategoryTabs";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PlusIcon,
  CubeIcon,
  FolderIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/formatters";

export const Products = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [updatingPriceProduct, setUpdatingPriceProduct] =
    useState<Product | null>(null);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesService.getAll(),
  });

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", selectedCategory, searchTerm],
    queryFn: () =>
      productsService.getAll({
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        search: searchTerm || undefined,
        isActive: true,
        limit: 100,
      }),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["product-stats"],
    queryFn: () => productsService.getStats(),
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success("Product deactivated successfully!");
    },
    onError: () => {
      toast.error("Failed to deactivate product");
    },
  });

  const handleDelete = (product: Product) => {
    if (!isAdmin) {
      toast.error("Only administrators can deactivate products");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to deactivate "${product.name}"? This will hide it from daily sales.`
      )
    ) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleUpdatePrice = (product: Product) => {
    setUpdatingPriceProduct(product);
  };

  const statCards = [
    {
      name: "Total Products",
      value: stats?.total || 0,
      icon: CubeIcon,
      color: "bg-blue-500",
      subtext: `${stats?.active || 0} active`,
    },
    {
      name: "Categories",
      value: categories?.length || 0,
      icon: FolderIcon,
      color: "bg-purple-500",
      subtext: "Product categories",
    },
    {
      name: "Inventory Value",
      value: formatCurrency(stats?.totalInventoryValue || 0),
      icon: CurrencyDollarIcon,
      color: "bg-green-500",
      subtext: "Total stock value",
    },
    {
      name: "Low Stock",
      value: stats?.lowStock || 0,
      icon: ExclamationTriangleIcon,
      color: "bg-red-500",
      subtext: "Products below 10",
    },
  ];

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">View product inventory</p>
          </div>
        </div>
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Admin Access Required
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Product management is only available to administrators. Contact
              your admin for access.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Products Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your product inventory and categories
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => {
              // Find unlinked bottles and their potential shot matches
              const unlinkedBottles =
                productsData?.products.filter(
                  (p) => p.unit === "bottle" && !p.linkedShotProductId
                ) || [];

              const shotProducts =
                productsData?.products.filter((p) => p.unit === "shot") || [];

              if (unlinkedBottles.length === 0) {
                toast.success("All bottles are already linked!");
                return;
              }

              // Show a modal or alert with suggestions
              toast.success(
                `${unlinkedBottles.length} bottles need linking. ` +
                  `Edit each bottle product to link to one of ${shotProducts.length} available shot products.`
              );
            }}
            className="flex items-center"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Check Bottle Links
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsCreateCategoryOpen(true)}
            className="flex items-center"
          >
            <FolderIcon className="w-5 h-5 mr-2" />
            Add Category
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateProductOpen(true)}
            className="flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories || []}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Search */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          {searchTerm && (
            <Button variant="secondary" onClick={() => setSearchTerm("")}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <ProductsTable
          products={productsData?.products || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdatePrice={handleUpdatePrice}
          isDeleting={deleteMutation.isPending}
        />
      </Card>

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        categories={categories || []}
      />

      <CreateCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
      />

      {editingProduct && (
        <EditProductModal
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          product={editingProduct}
          categories={categories || []}
        />
      )}

      {updatingPriceProduct && (
        <UpdatePriceModal
          isOpen={true}
          onClose={() => setUpdatingPriceProduct(null)}
          product={updatingPriceProduct}
        />
      )}
    </div>
  );
};
