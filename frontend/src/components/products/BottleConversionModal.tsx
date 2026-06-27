import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { productsService } from "../../services/products.service";
import type { Product } from "../../types/product.types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface BottleConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bottleProduct: Product;
}

export const BottleConversionModal = ({
  isOpen,
  onClose,
  bottleProduct,
}: BottleConversionModalProps) => {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

  // Fetch the linked shot product details
  const { data: shotProduct } = useQuery({
    queryKey: ["product", bottleProduct.linkedShotProductId],
    queryFn: () => productsService.getById(bottleProduct.linkedShotProductId!),
    enabled: !!bottleProduct.linkedShotProductId,
  });

  const conversionMutation = useMutation({
    mutationFn: async (data: { quantity: number }) => {
      if (!bottleProduct.linkedShotProductId) {
        throw new Error("No linked shot product found");
      }

      // Update bottle stock (decrease)
      await productsService.update(bottleProduct.id, {
        currentStock: bottleProduct.currentStock - data.quantity,
      });

      // Update shot stock (increase)
      if (shotProduct) {
        const shotsToAdd = data.quantity * (bottleProduct.shotsPerBottle || 0);
        await productsService.update(bottleProduct.linkedShotProductId, {
          currentStock: shotProduct.currentStock + shotsToAdd,
        });
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });

      const shotsAdded = data.quantity * (bottleProduct.shotsPerBottle || 0);
      toast.success(
        `Converted ${data.quantity} bottle(s) to ${shotsAdded} shots!`
      );
      onClose();
      setQuantity(1);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to convert bottles");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (quantity > bottleProduct.currentStock) {
      toast.error(
        `Not enough stock. Available: ${bottleProduct.currentStock} bottles`
      );
      return;
    }

    if (
      window.confirm(
        `Convert ${quantity} bottle(s) of ${bottleProduct.name} to ${
          quantity * (bottleProduct.shotsPerBottle || 0)
        } shots?`
      )
    ) {
      conversionMutation.mutate({ quantity });
    }
  };

  const shotsToAdd = quantity * (bottleProduct.shotsPerBottle || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convert Bottles to Shots">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bottle Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            From Bottle:
          </h4>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {bottleProduct.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Available Stock: {bottleProduct.currentStock} bottles
          </p>
        </div>

        {/* Shot Info */}
        {shotProduct && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
              To Shots:
            </h4>
            <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
              {shotProduct.name}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
              Current Stock: {shotProduct.currentStock} shots
            </p>
          </div>
        )}

        {/* Conversion Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Conversion Rate:</p>
              <p className="mt-1">
                1 bottle = {bottleProduct.shotsPerBottle} shots
              </p>
            </div>
          </div>
        </div>

        {/* Quantity Input */}
        <Input
          label="Number of Bottles to Convert"
          type="number"
          min="1"
          max={bottleProduct.currentStock}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          placeholder="1"
          required
        />

        {/* Preview */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <div className="text-sm text-green-800 dark:text-green-200">
              <p className="font-medium">After Conversion:</p>
              <ul className="mt-2 space-y-1">
                <li>
                  • Bottles: {bottleProduct.currentStock} →{" "}
                  {bottleProduct.currentStock - quantity}
                </li>
                <li>
                  • Shots: {shotProduct?.currentStock || 0} →{" "}
                  {(shotProduct?.currentStock || 0) + shotsToAdd}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Warning for high quantities */}
        {quantity > 5 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You're converting {quantity} bottles. Please verify this is
              correct.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={conversionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={conversionMutation.isPending}
            className="flex items-center"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Convert Bottles
          </Button>
        </div>
      </form>
    </Modal>
  );
};
