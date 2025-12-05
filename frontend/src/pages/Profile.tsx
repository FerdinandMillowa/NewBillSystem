import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "../services/settings.service";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileInfoSection } from "../components/profile/ProfileInfoSection";
import { ChangePasswordSection } from "../components/profile/ChangePasswordSection";
import { ProfileActivitySection } from "../components/profile/ProfileActivitySection";
import toast from "react-hot-toast";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "../utils/formatters";

export const Profile = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"info" | "password" | "activity">(
    "info"
  );

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => settingsService.getProfile(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const tabs = [
    {
      id: "info",
      name: "Profile Information",
      icon: UserCircleIcon,
    },
    {
      id: "password",
      name: "Change Password",
      icon: ShieldCheckIcon,
    },
    {
      id: "activity",
      name: "Activity Log",
      icon: ClockIcon,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <ProfileHeader profile={profile} />

      {/* Profile Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
              <UserCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {profile?.role}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-500">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="text-lg font-bold text-green-600 capitalize">
                {profile?.status}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-purple-500">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Member Since
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {profile?.createdAt && formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${
                      activeTab === tab.id
                        ? "text-primary-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }
                  `}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "info" && <ProfileInfoSection profile={profile} />}
        {activeTab === "password" && <ChangePasswordSection />}
        {activeTab === "activity" && (
          <ProfileActivitySection userId={profile?.id} />
        )}
      </div>
    </div>
  );
};
