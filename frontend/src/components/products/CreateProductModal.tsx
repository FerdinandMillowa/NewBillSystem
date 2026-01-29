import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { productsService } from "../../services/products.service";
import type {
  ProductCategory,
  CreateProductDto,
} from "../../types/product.types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
}

/**
 * Helper function to check if a product category supports shot conversion
 * Only "Spirits 750ml" category needs shot linking capability
 */
const categorySupportsShots = (
  categoryId: string,
  categories: ProductCategory[]
): boolean => {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return false;

  const name = category.name.toLowerCase();
  return name.includes("spirits") && name.includes("750ml");
};

export const CreateProductModal = ({
  isOpen,
  onClose,
  categories,
}: CreateProductModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateProductDto>({
    categoryId: "",
    name: "",
    unit: "bottle",
    size: "",
    currentPrice: 0,
    currentStock: 0,
    shotsPerBottle: undefined,
    linkedShotProductId: undefined,
    notes: "",
  });

  // Fetch all products for linking (only shots)
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsService.getAll({ isActive: true, limit: 500 }),
  });

  // Filter shot products
  const shotProducts =
    productsData?.products.filter((p) => p.unit === "shot") || [];

  // Determine if the selected category supports shot conversion
  const showShotConversion =
    formData.unit === "bottle" &&
    categorySupportsShots(formData.categoryId, categories);

  const createMutation = useMutation({
    mutationFn: (data: CreateProductDto) => productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success("Product created successfully!");
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create product");
    },
  });

  const resetForm = () => {
    setFormData({
      categoryId: "",
      name: "",
      unit: "bottle",
      size: "",
      currentPrice: 0,
      currentStock: 0,
      shotsPerBottle: undefined,
      linkedShotProductId: undefined,
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.categoryId || !formData.name || !formData.currentPrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Clean up data - only include shot fields if category supports it
    const submitData: CreateProductDto = {
      ...formData,
      shotsPerBottle:
        showShotConversion && formData.shotsPerBottle
          ? Number(formData.shotsPerBottle)
          : undefined,
      linkedShotProductId:
        showShotConversion && formData.linkedShotProductId
          ? formData.linkedShotProductId
          : undefined,
    };

    createMutation.mutate(submitData);
  };

  const handleUnitChange = (unit: string) => {
    setFormData({
      ...formData,
      unit,
      // Clear shot-related fields when changing unit
      shotsPerBottle: unit === "bottle" ? formData.shotsPerBottle : undefined,
      linkedShotProductId:
        unit === "bottle" ? formData.linkedShotProductId : undefined,
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData({
      ...formData,
      categoryId,
      // Clear shot-related fields if new category doesn't support shots
      shotsPerBottle: categorySupportsShots(categoryId, categories)
        ? formData.shotsPerBottle
        : undefined,
      linkedShotProductId: categorySupportsShots(categoryId, categories)
        ? formData.linkedShotProductId
        : undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Product">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <Input
          label="Product Name *"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Malawi Gin, Carlsberg Beer"
          required
        />

        {/* Category */}
        <div>
          <label className="label">Category *</label>
          <select
            value={formData.categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="input"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Type */}
        <div>
          <label className="label">Unit Type *</label>
          <select
            value={formData.unit || "bottle"}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="input"
            required
          >
            <option value="bottle">Bottle</option>
            <option value="can">Can</option>
            <option value="shot">Shot</option>
            <option value="pack">Pack</option>
          </select>
        </div>

        {/* Size */}
        <Input
          label="Size"
          type="text"
          value={formData.size || ""}
          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
          placeholder="e.g., 750ml, 330ml, 25ml"
        />

        {/* Price */}
        <Input
          label="Price (MK) *"
          type="number"
          step="0.01"
          value={formData.currentPrice}
          onChange={(e) =>
            setFormData({ ...formData, currentPrice: Number(e.target.value) })
          }
          placeholder="0.00"
          required
        />

        {/* Initial Stock */}
        <Input
          label="Initial Stock"
          type="number"
          value={formData.currentStock}
          onChange={(e) =>
            setFormData({ ...formData, currentStock: Number(e.target.value) })
          }
          placeholder="0"
        />

        {/* ✅ Bottle-Specific Fields - ONLY for Spirits 750ml */}
        {showShotConversion && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
              🔄 Bottle-to-Shot Conversion Setup
            </h4>

            {/* Shots Per Bottle */}
            <Input
              label="Shots Per Bottle"
              type="number"
              value={formData.shotsPerBottle || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shotsPerBottle: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              placeholder="e.g., 25 (for 750ml bottle)"
              hint="How many shots can be poured from this bottle?"
            />

            {/* Linked Shot Product */}
            <div className="mt-3">
              <label className="label">Link to Shot Product</label>
              <select
                value={formData.linkedShotProductId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    linkedShotProductId: e.target.value || undefined,
                  })
                }
                className="input"
              >
                <option value="">-- Select Shot Product --</option>
                {shotProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.category?.name || "Uncategorized"})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select the shot product this bottle converts to
              </p>
            </div>

            {formData.shotsPerBottle && formData.linkedShotProductId && (
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-800 dark:text-green-200">
                ✅ When you convert 1 bottle, it will add{" "}
                {formData.shotsPerBottle} shots to the linked product
              </div>
            )}
          </div>
        )}

        {/* ✅ Info message when shot conversion is not available */}
        {formData.unit === "bottle" &&
          !showShotConversion &&
          formData.categoryId && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ℹ️ Bottle-to-shot conversion is only available for products in
                the "Spirits 750ml" category.
              </p>
            </div>
          )}

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={3}
            placeholder="Additional notes or description..."
            className="input"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createMutation.isPending}
          >
            Create Product
          </Button>
        </div>
      </form>
    </Modal>
  );
};
