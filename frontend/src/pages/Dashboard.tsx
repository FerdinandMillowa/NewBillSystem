import { useQuery } from "@tanstack/react-query";
import { reportsService } from "../services/reports.service";
import { customersService } from "../services/customers.service";
import { Card } from "../components/ui/Card";
import { formatCurrency } from "../utils/formatters";
import {
  UsersIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

export const Dashboard = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => reportsService.getDashboard(),
  });

  const { data: pendingCustomers } = useQuery({
    queryKey: ["pending-customers"],
    queryFn: () => customersService.getPending(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Customers",
      value: dashboardData?.customers?.total || 0,
      icon: UsersIcon,
      color: "bg-blue-500",
      subtext: `${dashboardData?.customers?.approved || 0} approved`,
    },
    {
      name: "Total Bills",
      value: formatCurrency(dashboardData?.bills?.amount || 0),
      icon: DocumentTextIcon,
      color: "bg-purple-500",
      subtext: `${dashboardData?.bills?.total || 0} bills`,
    },
    {
      name: "Total Payments",
      value: formatCurrency(dashboardData?.payments?.amount || 0),
      icon: CreditCardIcon,
      color: "bg-green-500",
      subtext: `${dashboardData?.payments?.total || 0} payments`,
    },
    {
      name: "Outstanding",
      value: formatCurrency(dashboardData?.revenue?.outstanding || 0),
      icon: CurrencyDollarIcon,
      color: "bg-red-500",
      subtext: `${
        dashboardData?.revenue?.collectionRate || 0
      }% collection rate`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pending Customers Alert */}
      {pendingCustomers && pendingCustomers.length > 0 && (
        <Card className="bg-yellow-50 border border-yellow-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Pending Approvals
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                You have {pendingCustomers.length} customer(s) waiting for
                approval.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Recent Activity">
          <p className="text-gray-600 text-sm">
            View your recent transactions and updates
          </p>
        </Card>
        <Card title="Top Customers">
          <p className="text-gray-600 text-sm">
            See your best paying customers
          </p>
        </Card>
        <Card title="Payment Methods">
          <p className="text-gray-600 text-sm">
            Popular payment methods breakdown
          </p>
        </Card>
      </div>
    </div>
  );
};
