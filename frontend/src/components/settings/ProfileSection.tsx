import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "../../services/settings.service";
import type {
  UserProfile,
  UpdateProfileRequest,
} from "../../types/settings.types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";
import { z } from "zod";
import { formatDate } from "../../utils/formatters";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

interface ProfileSectionProps {
  profile: UserProfile;
}

export const ProfileSection = ({ profile }: ProfileSectionProps) => {
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
      username: profile.username,
      email: profile.email,
      fullName: profile.fullName,
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

  // Format dates properly
  const memberSince = formatDate(profile.createdAt);
  const lastUpdated = formatDate(profile.updatedAt);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Profile Information
          </h2>
          <p className="text-gray-600 mt-1">
            Update your account profile information
          </p>
        </div>
        {!isEditing && (
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Username"
            disabled={!isEditing}
            error={errors.username?.message}
            {...register("username")}
          />

          <Input
            label="Email"
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

        {/* Read-only fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Role</label>
            <Input value={profile.role} disabled className="capitalize" />
          </div>
          <div>
            <label className="label">Status</label>
            <Input value={profile.status} disabled className="capitalize" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Member Since</label>
            <Input value={memberSince} disabled />
          </div>
          <div>
            <label className="label">Last Updated</label>
            <Input value={lastUpdated} disabled />
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
