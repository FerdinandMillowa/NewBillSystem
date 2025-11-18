// ============================================
// src/components/settings/PreferencesSection.tsx
// ============================================

import { useState, useEffect } from "react";
import { settingsService } from "../../services/settings.service";
import type { SystemPreferences } from "../../types/settings.types";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";

export const PreferencesSection = () => {
  const [preferences, setPreferences] = useState<SystemPreferences>(() =>
    settingsService.getPreferences()
  );

  useEffect(() => {
    // Apply theme preference
    const root = document.documentElement;
    if (
      preferences.theme === "dark" ||
      (preferences.theme === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [preferences.theme]);

  const handlePreferenceChange = (key: keyof SystemPreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleNotificationChange = (
    key: keyof SystemPreferences["notifications"],
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const savePreferences = () => {
    settingsService.savePreferences(preferences);
    toast.success("Preferences saved successfully!");
  };

  const timeZones = [
    "Africa/Blantyre",
    "Africa/Lilongwe",
    "UTC",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
  ];

  const dateFormats = [
    "MMM dd, yyyy",
    "dd/MM/yyyy",
    "MM/dd/yyyy",
    "yyyy-MM-dd",
    "dd MMMM yyyy",
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
        <p className="text-gray-600 mt-1">
          Customize your application experience
        </p>
      </div>

      <div className="space-y-8 max-w-2xl">
        {/* Theme Preference */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                value: "light",
                label: "Light",
                description: "Always light mode",
              },
              { value: "dark", label: "Dark", description: "Always dark mode" },
              {
                value: "auto",
                label: "Auto",
                description: "Follow system preference",
              },
            ].map((theme) => (
              <button
                key={theme.value}
                onClick={() => handlePreferenceChange("theme", theme.value)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  preferences.theme === theme.value
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-gray-900">{theme.label}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {theme.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Language and Formatting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Language</label>
            <select
              value={preferences.language}
              onChange={(e) =>
                handlePreferenceChange("language", e.target.value)
              }
              className="input"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div>
            <label className="label">Date Format</label>
            <select
              value={preferences.dateFormat}
              onChange={(e) =>
                handlePreferenceChange("dateFormat", e.target.value)
              }
              className="input"
            >
              {dateFormats.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Zone */}
        <div>
          <label className="label">Time Zone</label>
          <select
            value={preferences.timeZone}
            onChange={(e) => handlePreferenceChange("timeZone", e.target.value)}
            className="input"
          >
            {timeZones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Notifications
          </h3>
          <div className="space-y-4">
            {[
              {
                key: "email",
                label: "Email Notifications",
                description: "Receive updates via email",
              },
              {
                key: "push",
                label: "Push Notifications",
                description: "Receive browser notifications",
              },
              {
                key: "sms",
                label: "SMS Notifications",
                description: "Receive text messages (if available)",
              },
            ].map((notif) => (
              <div
                key={notif.key}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">{notif.label}</div>
                  <div className="text-sm text-gray-500">
                    {notif.description}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      preferences.notifications[
                        notif.key as keyof SystemPreferences["notifications"]
                      ]
                    }
                    onChange={(e) =>
                      handleNotificationChange(
                        notif.key as keyof SystemPreferences["notifications"],
                        e.target.checked
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button variant="primary" onClick={savePreferences}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};
