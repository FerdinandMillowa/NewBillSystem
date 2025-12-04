import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { formatCurrency } from "../../utils/formatters";
import {
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface CashCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedCashAtHand: number; // System-calculated cash
  currentActualCash: number | null; // Previously entered (if any)
  onSubmit: (actualCashCollected: number) => void;
  isLoading?: boolean;
}

export const CashCollectionModal = ({
  isOpen,
  onClose,
  expectedCashAtHand,
  currentActualCash,
  onSubmit,
  isLoading = false,
}: CashCollectionModalProps) => {
  const [actualCash, setActualCash] = useState<number>(
    currentActualCash ?? expectedCashAtHand
  );

  const difference = expectedCashAtHand - actualCash;
  const hasShortage = difference > 0;
  const hasOverage = difference < 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(actualCash);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Actual Cash Collected"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <BanknotesIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Cash Verification</p>
              <p className="text-xs mt-1">
                Enter the physical cash amount collected from the
                bartender/cashier. The system will calculate if there's a
                shortage or overage.
              </p>
            </div>
          </div>
        </div>

        {/* Expected Cash (Read-only) */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="label text-gray-700">
            Expected Cash at Hand (System Calculated)
          </label>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(expectedCashAtHand)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Based on sales, expenses, and other payment methods
          </p>
        </div>

        {/* Actual Cash Input */}
        <div>
          <label className="label">
            Actual Cash Collected (Physical Count) *
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={actualCash}
            onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            required
            autoFocus
            className="text-2xl font-semibold"
          />
          <p className="text-xs text-gray-500 mt-1">
            Count the physical cash and enter the exact amount here
          </p>
        </div>

        {/* Difference Display */}
        {actualCash > 0 && (
          <div
            className={`p-4 rounded-lg border ${
              hasShortage
                ? "bg-red-50 border-red-200"
                : hasOverage
                ? "bg-yellow-50 border-yellow-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-start">
              {hasShortage ? (
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
              ) : hasOverage ? (
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" />
              ) : (
                <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h4
                  className={`text-sm font-medium ${
                    hasShortage
                      ? "text-red-800"
                      : hasOverage
                      ? "text-yellow-800"
                      : "text-green-800"
                  }`}
                >
                  {hasShortage
                    ? "⚠️ Shortage Detected"
                    : hasOverage
                    ? "⚠️ Overage Detected"
                    : "✅ Cash Matches Perfectly"}
                </h4>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    hasShortage
                      ? "text-red-600"
                      : hasOverage
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {hasShortage || hasOverage
                    ? formatCurrency(Math.abs(difference))
                    : "No Difference"}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    hasShortage
                      ? "text-red-700"
                      : hasOverage
                      ? "text-yellow-700"
                      : "text-green-700"
                  }`}
                >
                  {hasShortage
                    ? "Physical cash is less than expected. Possible causes: theft, miscounting, wrong change given."
                    : hasOverage
                    ? "Physical cash is more than expected. Possible causes: miscounting, wrong change received."
                    : "Physical cash matches system calculation perfectly!"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
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
            disabled={isLoading || actualCash < 0}
          >
            {hasShortage || hasOverage
              ? "Record Discrepancy"
              : "Confirm Cash Collection"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
