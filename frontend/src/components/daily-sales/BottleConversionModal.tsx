import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import toast from "react-hot-toast";
import {
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import type { Product } from "../../types/product.types";

interface BottleConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bottleProduct: Product;
  shotProduct?: Product;
  onSubmit: (data: { quantity: number; notes?: string }) => void;
  isLoading: boolean;
}

export const BottleConversionModal = ({
  isOpen,
  onClose,
  bottleProduct,
  shotProduct,
  onSubmit,
  isLoading,
}: BottleConversionModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const shotsPerBottle = bottleProduct.shotsPerBottle || 0;
  const shotsToAdd = quantity * shotsPerBottle;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!bottleProduct.linkedShotProductId || !shotProduct) {
      toast.error("This bottle is not correctly linked to a shot product");
      return;
    }

    onSubmit({ quantity, notes });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convert Bottle to Shots">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Comparison Header */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
              FROM (BOTTLE)
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {bottleProduct.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stock: {bottleProduct.currentStock} bottles
            </p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">
              TO (SHOTS)
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {shotProduct?.name || "Not linked"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stock: {shotProduct?.currentStock || 0} shots
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-center">
            <InformationCircleIcon className="w-4 h-4 mr-2" />
            💡 Important: This is NOT a sale!
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Converting {quantity} bottle(s) = {shotsToAdd} shots added to
            inventory. The bottle price (MK{" "}
            {bottleProduct.currentPrice.toLocaleString()}) is NOT included in
            today's sales.
          </p>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="label">Number of Bottles to Open</label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            max={bottleProduct.currentStock}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Rate: 1 bottle = {shotsPerBottle} shots
          </p>
        </div>

        {/* Stock Impact Preview */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Stock Impact Preview
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-red-700 dark:text-red-400">
              <p className="font-medium">{bottleProduct.name}:</p>
              <p>
                {bottleProduct.currentStock} →{" "}
                {bottleProduct.currentStock - quantity}
              </p>
            </div>
            <div className="text-green-700 dark:text-green-400">
              <p className="font-medium">{shotProduct?.name}:</p>
              <p>
                {shotProduct?.currentStock || 0} →{" "}
                {(shotProduct?.currentStock || 0) + shotsToAdd}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g., Opened for bar service, Customer requested shots..."
            className="input"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="flex items-center"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Convert and Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
