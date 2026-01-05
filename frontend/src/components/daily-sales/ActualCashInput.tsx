import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dailySalesService } from "../../services/daily-sales.service";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import toast from "react-hot-toast";

interface ActualCashInputProps {
  dailySalesId: string;
  currentCashAtHand: number; // Expected cash from system (should equal cashAtHand)
  currentActualCash?: number | null; // Actual cash already entered (if any)
  isDisabled?: boolean;
  onSuccess?: () => void;
}

export const ActualCashInput = ({
  dailySalesId,
  currentCashAtHand,
  currentActualCash,
  isDisabled = false,
  onSuccess,
}: ActualCashInputProps) => {
  const [actualCash, setActualCash] = useState<string>(
    currentActualCash?.toString() || ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (actualCashCollected: number | null) =>
      dailySalesService.updateActualCashCollected(
        dailySalesId,
        actualCashCollected
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sales"] });
      queryClient.invalidateQueries({ queryKey: ["daily-sales-by-date"] });
      setIsEditing(false);
      toast.success("Actual cash updated successfully!");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update actual cash"
      );
    },
  });

  const handleSave = () => {
    const value = actualCash.trim() === "" ? null : parseFloat(actualCash);
    updateMutation.mutate(value);
  };

  const handleCancel = () => {
    setActualCash(currentActualCash?.toString() || "");
    setIsEditing(false);
  };

  // ✅ FIX: Calculate shortage based on actual vs expected
  const parsedActualCash = actualCash ? parseFloat(actualCash) : null;
  const shortage =
    parsedActualCash !== null && currentCashAtHand > parsedActualCash
      ? currentCashAtHand - parsedActualCash
      : parsedActualCash !== null && parsedActualCash > currentCashAtHand
      ? currentCashAtHand - parsedActualCash // Negative = overage
      : 0;

  return (
    <Card title="Actual Cash Collected (Manager Only)">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ✅ FIX: Expected Cash = Cash at Hand (not a separate calculation) */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Expected Cash (System)
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              MK {currentCashAtHand.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              This should equal Cash at Hand
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Shortage/Overage
            </p>
            <p
              className={`text-2xl font-bold ${
                shortage > 0
                  ? "text-red-600 dark:text-red-400"
                  : shortage < 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {shortage > 0
                ? `- MK ${shortage.toLocaleString()}`
                : shortage < 0
                ? `+ MK ${Math.abs(shortage).toLocaleString()}`
                : "MK 0"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {shortage > 0
                ? "Shortage (Missing cash)"
                : shortage < 0
                ? "Overage (Extra cash)"
                : "Perfect match"}
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="label">
                Enter Actual Cash (Physical Count)
              </label>
              <input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="Enter physical cash amount"
                className="input"
                autoFocus
                min="0"
                step="0.01"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Leave empty if not counted yet
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                isLoading={updateMutation.isPending}
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Actual Cash Collected
                </p>
                <p className="text-xl font-semibold">
                  {currentActualCash !== null && currentActualCash !== undefined
                    ? `MK ${currentActualCash.toLocaleString()}`
                    : "Not entered yet"}
                </p>
              </div>
              {!isDisabled && (
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                  disabled={isDisabled}
                >
                  {currentActualCash ? "Edit Amount" : "Enter Cash"}
                </Button>
              )}
            </div>
            {currentActualCash !== null && currentActualCash !== undefined && (
              <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                <p className="text-sm">
                  <span className="font-medium">System Expected:</span> MK{" "}
                  {currentCashAtHand.toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Actual Counted:</span> MK{" "}
                  {currentActualCash.toLocaleString()}
                </p>
                <p
                  className={`text-sm font-medium ${
                    shortage > 0
                      ? "text-red-600 dark:text-red-400"
                      : shortage < 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {shortage > 0
                    ? `Shortage: MK ${shortage.toLocaleString()}`
                    : shortage < 0
                    ? `Overage: MK ${Math.abs(shortage).toLocaleString()}`
                    : "Perfect match"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
