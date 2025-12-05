import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "../../services/settings.service";
import type { UpdateProfileRequest } from "../../types/settings.types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";
import { z } from "zod";
import { formatDate } from "../../utils/formatters";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

interface ProfileInfoSectionProps {
  profile: any;
}

export const ProfileInfoSection = ({ profile }: ProfileInfoSectionProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileRequest>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || "",
      email: profile?.email || "",
      fullName: profile?.fullName || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      settingsService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["user-profile"], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const onSubmit = (data: UpdateProfileRequest) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Editable Profile Information */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Personal Information
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Update your personal details and information
            </p>
          </div>
          {!isEditing ? (
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="flex items-center"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="flex items-center"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                isLoading={updateMutation.isPending}
                disabled={!isDirty}
                className="flex items-center"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Username"
              disabled={!isEditing}
              error={errors.username?.message}
              {...register("username")}
            />

            <Input
              label="Email Address"
              type="email"
              disabled={!isEditing}
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

          <Input
            label="Full Name"
            disabled={!isEditing}
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          {/* Read-only Information */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Account Information (Read-only)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Role</label>
                <Input
                  value={profile?.role || ""}
                  disabled
                  className="capitalize"
                />
              </div>
              <div>
                <label className="label">Status</label>
                <Input
                  value={profile?.status || ""}
                  disabled
                  className="capitalize"
                />
              </div>
              <div>
                <label className="label">Account Created</label>
                <Input
                  value={
                    profile?.createdAt ? formatDate(profile.createdAt) : ""
                  }
                  disabled
                />
              </div>
              <div>
                <label className="label">Last Updated</label>
                <Input
                  value={
                    profile?.updatedAt ? formatDate(profile.updatedAt) : ""
                  }
                  disabled
                />
              </div>
              <div>
                <label className="label">Last Login</label>
                <Input
                  value={
                    profile?.lastLogin ? formatDate(profile.lastLogin) : "Never"
                  }
                  disabled
                />
              </div>
              <div>
                <label className="label">User ID</label>
                <Input value={profile?.id || ""} disabled />
              </div>
            </div>
          </div>
        </form>
      </Card>

      {/* Profile Tips */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Profile Tips
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Keep your email up-to-date to receive important notifications
                </li>
                <li>
                  Use a professional username that represents you in the system
                </li>
                <li>
                  Your role and status can only be changed by administrators
                </li>
                <li>
                  Contact an admin if you need to update restricted fields
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
