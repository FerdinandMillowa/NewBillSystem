import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usersService } from "../../services/users.service";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";
import { KeyIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export const ResetPasswordModal = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}: ResetPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetMutation = useMutation({
    mutationFn: (password: string) =>
      usersService.resetPassword(user.id, password),
    onSuccess: () => {
      toast.success(
        `Password reset successfully for ${user.username}! User has been notified.`
      );
      onSuccess();
      onClose();
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reset password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Password strength check
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || (!hasNumber && !hasSpecial)) {
      toast.error(
        "Password must contain uppercase, lowercase, and number/special character"
      );
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to reset the password for ${user.username}?`
      )
    ) {
      resetMutation.mutate(newPassword);
    }
  };

  const passwordStrength = () => {
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/\d/.test(newPassword)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength++;

    if (strength <= 2) return { label: "Weak", color: "text-red-600" };
    if (strength <= 3) return { label: "Medium", color: "text-yellow-600" };
    return { label: "Strong", color: "text-green-600" };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset User Password"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <KeyIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Resetting password for:
              </p>
              <p className="text-base font-bold text-blue-900 mt-1">
                {user?.fullName} (@{user?.username})
              </p>
              <p className="text-sm text-blue-700 mt-1">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> The user will need to use this new
              password to log in. Make sure to communicate it securely to them.
            </p>
          </div>
        </div>

        {/* New Password */}
        <div>
          <Input
            label="New Password *"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Enter new password"
          />
          {newPassword.length > 0 && (
            <div className="mt-2">
              <p className="text-sm">
                Password Strength:{" "}
                <span className={`font-semibold ${passwordStrength().color}`}>
                  {passwordStrength().label}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <Input
            label="Confirm Password *"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Confirm new password"
          />
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
          )}
          {confirmPassword.length > 0 && newPassword === confirmPassword && (
            <p className="text-sm text-green-600 mt-1">✓ Passwords match</p>
          )}
        </div>

        {/* Show Password Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showPassword"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="showPassword" className="ml-2 text-sm text-gray-700">
            Show passwords
          </label>
        </div>

        {/* Password Requirements */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-2">
            Password Requirements:
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li
              className={
                newPassword.length >= 8 ? "text-green-600" : "text-gray-600"
              }
            >
              {newPassword.length >= 8 ? "✓" : "○"} At least 8 characters
            </li>
            <li
              className={
                /[A-Z]/.test(newPassword) ? "text-green-600" : "text-gray-600"
              }
            >
              {/[A-Z]/.test(newPassword) ? "✓" : "○"} One uppercase letter
            </li>
            <li
              className={
                /[a-z]/.test(newPassword) ? "text-green-600" : "text-gray-600"
              }
            >
              {/[a-z]/.test(newPassword) ? "✓" : "○"} One lowercase letter
            </li>
            <li
              className={
                /\d/.test(newPassword) ||
                /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                  ? "text-green-600"
                  : "text-gray-600"
              }
            >
              {/\d/.test(newPassword) ||
              /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                ? "✓"
                : "○"}{" "}
              One number or special character
            </li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onClose();
              setNewPassword("");
              setConfirmPassword("");
              setShowPassword(false);
            }}
            disabled={resetMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={resetMutation.isPending}
            disabled={
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              newPassword.length < 8
            }
          >
            Reset Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};
