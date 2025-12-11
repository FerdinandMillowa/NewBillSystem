import { Card } from "../ui/Card";
import type { ActivityLogStats } from "../../types/activity-log.types";
import {
  DocumentTextIcon,
  ArrowPathIcon,
  TrashIcon,
  LockOpenIcon,
  LockClosedIcon,
  CheckCircleIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

interface ActivityLogsStatsProps {
  stats: ActivityLogStats;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "create":
      return DocumentTextIcon;
    case "update":
      return ArrowPathIcon;
    case "delete":
      return TrashIcon;
    case "login":
      return LockOpenIcon;
    case "logout":
      return LockClosedIcon;
    case "approve":
      return CheckCircleIcon;
    default:
      return CogIcon;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case "create":
      return "bg-green-500";
    case "update":
      return "bg-blue-500";
    case "delete":
      return "bg-red-500";
    case "login":
      return "bg-green-500";
    case "logout":
      return "bg-gray-500";
    case "approve":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

export const ActivityLogsStats = ({ stats }: ActivityLogsStatsProps) => {
  // Sort actions by count
  const sortedActions = [...stats.actions].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Action Distribution
      </h3>
      <div className="space-y-4">
        {sortedActions.map((action) => {
          const Icon = getActionIcon(action.action);
          const colorClass = getActionColor(action.action);

          return (
            <div key={action.action}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded ${colorClass}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {action.action}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{action.count}</span>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {action.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${colorClass} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${action.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            Total Activities
          </span>
          <span className="text-2xl font-bold text-primary-600">
            {stats.total}
          </span>
        </div>
      </div>
    </Card>
  );
};
