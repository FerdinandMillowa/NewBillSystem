import { useQuery } from "@tanstack/react-query";
import { reportsService } from "../services/reports.service";
import { customersService } from "../services/customers.service";
import { billsService } from "../services/bills.service";
import { paymentsService } from "../services/payments.service";
import { Card } from "../components/ui/Card";
import {
  formatCurrency,
  formatDate,
  formatCustomerName,
  getPaymentMethodLabel,
} from "../utils/formatters";
import { Link } from "react-router-dom";
import {
  UsersIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export const Dashboard = () => {
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => reportsService.getDashboard(),
  });

  const { data: pendingCustomers } = useQuery({
    queryKey: ["pending-customers"],
    queryFn: () => customersService.getPending(),
  });

  const { data: recentBills } = useQuery({
    queryKey: ["recent-bills"],
    queryFn: () => billsService.getRecent(5),
  });

  const { data: recentPayments } = useQuery({
    queryKey: ["recent-payments"],
    queryFn: () => paymentsService.getRecent(5),
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["monthly-report"],
    queryFn: () => reportsService.getMonthly(),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => reportsService.getPaymentMethods(),
  });

  if (isDashboardLoading) {
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
      change: "+12%",
      changeType: "positive",
    },
    {
      name: "Total Bills",
      value: formatCurrency(dashboardData?.bills?.amount || 0),
      icon: DocumentTextIcon,
      color: "bg-purple-500",
      subtext: `${dashboardData?.bills?.total || 0} bills issued`,
      change: "+8%",
      changeType: "positive",
    },
    {
      name: "Total Collected",
      value: formatCurrency(dashboardData?.payments?.amount || 0),
      icon: CreditCardIcon,
      color: "bg-green-500",
      subtext: `${dashboardData?.payments?.total || 0} payments`,
      change: "+15%",
      changeType: "positive",
    },
    {
      name: "Outstanding",
      value: formatCurrency(dashboardData?.revenue?.outstanding || 0),
      icon: CurrencyDollarIcon,
      color: "bg-red-500",
      subtext: `${dashboardData?.revenue?.collectionRate || 0}% collected`,
      change: "-5%",
      changeType: "negative",
    },
  ];

  // Prepare chart data
  const monthlyChartData =
    monthlyData?.map((item: any) => ({
      month: item.month.substring(5), // Get MM from YYYY-MM
      bills: item.billsAmount,
      payments: item.paymentsAmount,
    })) || [];

  const paymentMethodChartData =
    paymentMethods?.map((item: any) => ({
      name: getPaymentMethodLabel(item.method),
      value: item.amount,
      percentage: item.percentage,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your business overview
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-600">All systems operational</span>
        </div>
      </div>

      {/* Pending Customers Alert */}
      {pendingCustomers && pendingCustomers.length > 0 && (
        <Card className="bg-yellow-50 border border-yellow-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Pending Customer Approvals
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                You have {pendingCustomers.length} customer(s) waiting for
                approval.
              </p>
              <div className="mt-3">
                <Link
                  to="/customers?status=pending"
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  Review pending customers →
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card
            key={stat.name}
            className="relative overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-xs text-gray-500 ml-2">vs last month</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card title="Revenue Trend (Last 6 Months)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                labelStyle={{ color: "#000" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="bills"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Bills Issued"
              />
              <Line
                type="monotone"
                dataKey="payments"
                stroke="#10b981"
                strokeWidth={2}
                name="Payments Received"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Payment Methods Chart */}
        <Card title="Payment Methods Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.percent}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodChartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Bills</h3>
            <Link
              to="/bills"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentBills && recentBills.length > 0 ? (
              recentBills.map((bill: any) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCustomerName(
                        bill.customer.firstName,
                        bill.customer.lastName
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {bill.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(bill.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(bill.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No recent bills
              </p>
            )}
          </div>
        </Card>

        {/* Recent Payments */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Payments</h3>
            <Link
              to="/payments"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentPayments && recentPayments.length > 0 ? (
              recentPayments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCustomerName(
                        payment.customer.firstName,
                        payment.customer.lastName
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      via {getPaymentMethodLabel(payment.paymentMethod)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(payment.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No recent payments
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Stats Bar */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">
              {dashboardData?.revenue?.collectionRate?.toFixed(1) || 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Collection Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {dashboardData?.customers?.approved || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Active Customers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {dashboardData?.bills?.total || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Bills</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {dashboardData?.payments?.total || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Payments</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
