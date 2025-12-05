import { Card } from "../ui/Card";
import { ShieldCheckIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

interface ProfileHeaderProps {
  profile: any;
}

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  if (!profile) return null;

  // Generate initials for avatar
  const initials = profile.fullName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-primary-500 to-purple-600"></div>

      {/* Profile Content */}
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start -mt-16 sm:-mt-12">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {initials}
                </span>
              </div>
            </div>
            {/* Status Badge */}
            {profile.status === "active" && (
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.fullName}
              </h1>
              {profile.role === "admin" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <ShieldCheckIcon className="w-3 h-3 mr-1" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              @{profile.username}
            </p>
            <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <EnvelopeIcon className="w-4 h-4" />
              <span>{profile.email}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 sm:mt-0 flex space-x-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.role === "admin" ? "∞" : "0"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Permissions
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {profile.status === "active" ? "✓" : "✗"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
