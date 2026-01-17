import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { Product } from "../../types/product.types";

interface BottleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bottleProducts: Product[];
  onSelect: (product: Product) => void;
}

export const BottleSelectionModal = ({
  isOpen,
  onClose,
  bottleProducts,
  onSelect,
}: BottleSelectionModalProps) => {
  // Filter for bottles that CAN be converted (have shotsPerBottle and linkedShotProductId)
  const convertibleBottles = bottleProducts.filter(
    (product) =>
      product.unit === "bottle" &&
      product.shotsPerBottle &&
      product.shotsPerBottle > 0 &&
      product.linkedShotProductId
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Bottle to Convert">
      <div className="space-y-3">
        {convertibleBottles.length === 0 ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <ArrowPathIcon className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-gray-600 font-medium mb-2">
              No convertible bottles found
            </p>
            <p className="text-sm text-gray-500">
              Ensure bottle products have:
            </p>
            <ul className="text-sm text-gray-500 mt-2 space-y-1">
              <li>• Unit type: "bottle"</li>
              <li>• Shots per bottle configured (e.g., 25)</li>
              <li>• Linked to a shot product</li>
            </ul>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
              <p className="text-sm text-blue-800 font-medium">
                💡 How to set this up:
              </p>
              <ol className="text-sm text-blue-700 mt-2 space-y-1">
                <li>1. Go to Products page (admin only)</li>
                <li>2. Edit a bottle product (e.g., "Jameson 750ml")</li>
                <li>3. Set "Shots Per Bottle" (e.g., 25)</li>
                <li>4. Link to shot product (e.g., "Jameson Shot")</li>
                <li>5. Save and return to Daily Sales</li>
              </ol>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Important:</strong> Converting bottles does NOT count
                as a sale. It only adjusts inventory (bottles → shots).
              </p>
            </div>

            {convertibleBottles.map((product) => (
              <button
                key={product.id}
                onClick={() => onSelect(product)}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {product.name}
                    </h4>
                    <div className="mt-1 text-sm text-gray-600 space-y-1">
                      <p>
                        📦 Current Stock:{" "}
                        <strong>{product.currentStock} bottles</strong>
                      </p>
                      <p>
                        🥃 Conversion Rate:{" "}
                        <strong>
                          1 bottle = {product.shotsPerBottle} shots
                        </strong>
                      </p>
                      <p className="text-xs text-purple-600">
                        ✓ Linked to shot product
                      </p>
                    </div>
                  </div>
                  <ArrowPathIcon className="w-6 h-6 text-purple-500 ml-4 flex-shrink-0" />
                </div>
              </button>
            ))}
          </>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t mt-6">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};
