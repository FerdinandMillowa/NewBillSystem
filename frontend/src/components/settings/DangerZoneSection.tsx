import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";

export const DangerZoneSection = () => {
  const { user, logout } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAccountDeletion = async () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    if (
      !window.confirm("Are you absolutely sure? This action cannot be undone!")
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      // In a real app, you would call an API endpoint here
      // await usersService.deleteAccount();
      toast.error("Account deletion is not implemented in this demo");
      setConfirmText("");
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportData = () => {
    // In a real app, you would call an API endpoint here
    toast.success("Data export feature coming soon!");
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Danger Zone</h2>
        <p className="text-gray-600 mt-1">
          Irreversible and destructive actions
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Export Data */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Export Your Data
              </h3>
              <p className="text-gray-600 mt-1">
                Download all your data in a portable format
              </p>
            </div>
            <Button variant="secondary" onClick={exportData}>
              Export Data
            </Button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-900">
                Delete Account
              </h3>
              <p className="text-red-700 mt-1">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>

              <div className="mt-4">
                <label className="label text-red-700">
                  Type "DELETE MY ACCOUNT" to confirm
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="border-red-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="danger"
              onClick={handleAccountDeletion}
              isLoading={isDeleting}
              disabled={confirmText !== "DELETE MY ACCOUNT"}
            >
              Delete My Account
            </Button>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Important Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Account deletion is permanent and cannot be reversed. All your
                  data including customers, bills, and payment records will be
                  permanently removed from our systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
