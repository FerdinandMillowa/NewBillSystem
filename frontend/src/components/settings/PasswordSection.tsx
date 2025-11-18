import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { settingsService } from "../../services/settings.service";
import type { ChangePasswordRequest } from "../../types/settings.types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";
import { z } from "zod";

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

export const PasswordSection = () => {
  const [showPasswords, setShowPasswords] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordRequest & { confirmPassword: string }>({
    resolver: zodResolver(passwordSchema),
  });

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
        <p className="text-gray-600 mt-1">
          Update your password to keep your account secure
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Input
          label="Current Password"
          type={showPasswords ? "text" : "password"}
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />

        <Input
          label="New Password"
          type={showPasswords ? "text" : "password"}
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        <Input
          label="Confirm New Password"
          type={showPasswords ? "text" : "password"}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="showPasswords"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="showPasswords" className="ml-2 text-sm text-gray-700">
            Show passwords
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            🔒 Password must be at least 8 characters and contain uppercase,
            lowercase, and number/special character.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
    </div>
  );
};
