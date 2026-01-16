import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
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
      product.linkedShotProductId
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Bottle to Convert"
      icon={<ArrowPathIcon className="w-6 h-6 text-purple-600" />}
    >
      <div className="space-y-3">
        {convertibleBottles.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600">
              No convertible bottles found. Ensure bottle products have:
            </p>
            <ul className="text-sm text-gray-500 mt-2">
              <li>• Unit type: "bottle"</li>
              <li>• Shots per bottle configured</li>
              <li>• Linked to a shot product</li>
            </ul>
          </div>
        ) : (
          convertibleBottles.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <div className="mt-1 text-sm text-gray-600">
                    <p>Current Stock: {product.currentStock} bottles</p>
                    <p>Shots per bottle: {product.shotsPerBottle}</p>
                    <p className="text-xs text-purple-600">
                      Converts to linked shot product
                    </p>
                  </div>
                </div>
                <ArrowPathIcon className="w-5 h-5 text-purple-500" />
              </div>
            </button>
          ))
        )}
      </div>

      <div className="flex justify-end pt-6">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};
