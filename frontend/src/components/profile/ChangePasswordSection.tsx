import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { settingsService } from "../../services/settings.service";
import type { ChangePasswordRequest } from "../../types/settings.types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        "Password must contain uppercase, lowercase, and number/special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const ChangePasswordSection = () => {
  const [showPasswords, setShowPasswords] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordRequest & { confirmPassword: string }>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch("newPassword", "");

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      settingsService.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed successfully!");
      reset();
      setShowPasswords(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to change password");
    },
  });

  const onSubmit = (
    data: ChangePasswordRequest & { confirmPassword: string }
  ) => {
    const { confirmPassword, ...passwordData } = data;
    changePasswordMutation.mutate(passwordData);
  };

  // Password strength checker
  const getPasswordStrength = () => {
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/\d/.test(newPassword)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength++;

    if (strength <= 2)
      return { label: "Weak", color: "bg-red-500", percent: 33 };
    if (strength <= 3)
      return { label: "Medium", color: "bg-yellow-500", percent: 66 };
    return { label: "Strong", color: "bg-green-500", percent: 100 };
  };

  const strength = newPassword.length > 0 ? getPasswordStrength() : null;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start mb-6">
          <div className="flex-shrink-0 p-3 rounded-lg bg-purple-500">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Change Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Keep your account secure by using a strong password
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Password */}
          <div>
            <div className="relative">
              <Input
                label="Current Password"
                type={showPasswords ? "text" : "password"}
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
                placeholder="Enter your current password"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <div className="relative">
              <Input
                label="New Password"
                type={showPasswords ? "text" : "password"}
                error={errors.newPassword?.message}
                {...register("newPassword")}
                placeholder="Enter your new password"
              />
            </div>

            {/* Password Strength Indicator */}
            {strength && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Password Strength:
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      strength.label === "Weak"
                        ? "text-red-600"
                        : strength.label === "Medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${strength.color}`}
                    style={{ width: `${strength.percent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showPasswords ? "text" : "password"}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
                placeholder="Confirm your new password"
              />
            </div>
          </div>

          {/* Show Password Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPasswordsProfile"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label
              htmlFor="showPasswordsProfile"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center cursor-pointer"
            >
              {showPasswords ? (
                <>
                  <EyeSlashIcon className="w-4 h-4 mr-1" />
                  Hide passwords
                </>
              ) : (
                <>
                  <EyeIcon className="w-4 h-4 mr-1" />
                  Show passwords
                </>
              )}
            </label>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Password Requirements:
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
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
                (A-Z)
              </li>
              <li
                className={
                  /[a-z]/.test(newPassword) ? "text-green-600" : "text-gray-600"
                }
              >
                {/[a-z]/.test(newPassword) ? "✓" : "○"} One lowercase letter
                (a-z)
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

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => reset()}
              disabled={changePasswordMutation.isPending || !isDirty}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={changePasswordMutation.isPending}
              disabled={!isDirty}
            >
              Change Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Security Tips */}
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ShieldCheckIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Security Best Practices
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Use a unique password that you don't use elsewhere</li>
                <li>Never share your password with anyone</li>
                <li>Change your password regularly (every 90 days)</li>
                <li>Avoid using personal information in your password</li>
                <li>Consider using a password manager</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
