// ============================================
// src/pages/Settings.tsx
// ============================================

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "../services/settings.service";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ProfileSection } from "../components/settings/ProfileSection";
import { PasswordSection } from "../components/settings/PasswordSection";
import { PreferencesSection } from "../components/settings/PreferencesSection";
import { DangerZoneSection } from "../components/settings/DangerZoneSection";
import toast from "react-hot-toast";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const tabs = [
  { id: "profile", name: "Profile", icon: UserCircleIcon },
  { id: "password", name: "Password", icon: ShieldCheckIcon },
  { id: "preferences", name: "Preferences", icon: Cog6ToothIcon },
  { id: "danger", name: "Danger Zone", icon: ExclamationTriangleIcon },
];

export const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => settingsService.getProfile(),
    initialData: user,
  });

  const renderActiveTab = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSection profile={profile} />;
      case "password":
        return <PasswordSection />;
      case "preferences":
        return <PreferencesSection />;
      case "danger":
        return <DangerZoneSection />;
      default:
        return <ProfileSection profile={profile} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <Card className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary-50 text-primary-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card>{renderActiveTab()}</Card>
        </div>
      </div>
    </div>
  );
};
