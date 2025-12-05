import { Card } from "../ui/Card";
import { ClockIcon } from "@heroicons/react/24/outline";

interface ProfileActivitySectionProps {
  userId: string;
}

export const ProfileActivitySection = ({
  userId,
}: ProfileActivitySectionProps) => {
  return (
    <Card>
      <div className="text-center py-12">
        <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Activity Log Coming Soon
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Track your account activity, login history, and actions performed in
          the system.
        </p>
      </div>
    </Card>
  );
};
