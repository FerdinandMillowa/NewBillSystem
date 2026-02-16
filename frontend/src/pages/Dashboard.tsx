import { useQuery } from "@tanstack/react-query";
import { reportsService } from "../services/reports.service";
import { customersService } from "../services/customers.service";
import { billsService } from "../services/bills.service";
import { paymentsService } from "../services/payments.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
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
  ShoppingBagIcon,
  ChartBarIcon,
  BanknotesIcon,
  MinusCircleIcon,
  ShoppingCartIcon,
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
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => reportsService.getDashboard(),
    retry: 1,
  });

  const { data: pendingCustomers } = useQuery({
    queryKey: ["pending-customers"],
    queryFn: () => customersService.getPending(),
  });

  const { data: recentBills } = useQuery({
    queryKey: ["recent-bills"],
    queryFn: () => billsService.getRecent(3), // ← Changed from 5 to 3
  });

  const { data: recentPayments } = useQuery({
    queryKey: ["recent-payments"],
    queryFn: () => paymentsService.getRecent(3), // ← Changed from 5 to 3
  });

  // FIX APPLIED IN reports.service.ts: This call now defaults to a valid date range.
  // CUSTOMER BILLING: Get monthly billing data (bills & payments)
  const { data: monthlyBillingData } = useQuery({
    queryKey: ["monthly-billing-report"],
    queryFn: () => reportsService.getMonthlyBilling(),
  });

  // UPDATED: Now using billing payment methods (from payments table)
  const { data: billingPaymentMethods } = useQuery({
    queryKey: ["billing-payment-methods"],
    queryFn: () => reportsService.getBillingPaymentMethods(),
  });

  // NEW: Daily Operations queries - Get weekly summary
  const { data: dailySalesSummary } = useQuery({
    queryKey: ["daily-sales-summary"],
    queryFn: () => reportsService.getDailySalesSummary(),
  });

  // Calculate weekly totals from daily breakdown
  const calculateWeeklySummary = () => {
    if (!dailySalesSummary?.dailyBreakdown) {
      return {
        totalSales: 0,
        totalExpenses: 0,
        totalStockPurchases: 0,
        netRevenue: 0,
        daysCount: 0,
      };
    }

    // Get last 7 days of data
    const last7Days = dailySalesSummary.dailyBreakdown.slice(-7);

    return {
      totalSales: last7Days.reduce((sum, day) => sum + day.totalSales, 0),
      totalExpenses: last7Days.reduce((sum, day) => sum + day.totalExpenses, 0),
      totalStockPurchases: last7Days.reduce(
        (sum, day) => sum + (day.stockPurchasesAmount || 0),
        0
      ),
      netRevenue: last7Days.reduce((sum, day) => sum + day.netRevenue, 0),
      daysCount: last7Days.length,
    };
  };

  const weeklySummary = calculateWeeklySummary();

  if (dashboardError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to Load Dashboard
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {(dashboardError as any)?.response?.data?.message ||
            "Unable to fetch dashboard data"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isDashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Customer Billing Module Stats
  const billingStats = [
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
      subtext: `${dashboardData?.bills?.total || 0} bills issued`,
    },
    {
      name: "Total Collected",
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
        dashboardData?.revenue?.collectionRate?.toFixed(1) || 0
      }% collected`,
    },
  ];

  // Prepare chart data for Customer Billing Module
  const monthlyChartData =
    monthlyBillingData?.map((item: any) => ({
      month: item.month.substring(5), // Get MM from YYYY-MM
      billsAmount: item.billsAmount || 0,
      paymentsAmount: item.paymentsAmount || 0,
    })) || [];

  const paymentMethodChartData =
    billingPaymentMethods?.breakdown?.map((item: any) => ({
      name: item.name,
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

      {/* Module Sections */}

      {/* Customer Billing Module */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Customer Billing Module
          </h2>
          <Link
            to="/reports?tab=billing"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            View detailed reports →
          </Link>
        </div>

        {/* Billing Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {billingStats.map((stat) => (
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
            </Card>
          ))}
        </div>

        {/* Billing Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <Card title="Revenue Trend (Last 6 Months)">
            {monthlyChartData.length > 0 ? (
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
                    dataKey="billsAmount"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Bills"
                    dot={{ r: 4, fill: "#8b5cf6" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="paymentsAmount"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Payments"
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No billing data available
              </div>
            )}
          </Card>

          {/* Payment Methods Chart - NOW SHOWS BILLING PAYMENTS */}
          <Card title="Payment Methods Distribution (All Payments)">
            {paymentMethodChartData && paymentMethodChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) =>
                      `${entry.name}: ${entry.percentage?.toFixed(1) || 0}%`
                    }
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
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No payment data available
              </div>
            )}
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
      </div>

      {/* =============== UPDATED: Daily Operations Module - 7 Day Summary =============== */}
      {/* Daily Operations */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Daily Operations
          </h2>
          <Link to="/reports?tab=operations">
            <Button variant="secondary" size="sm">
              View All
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Weekly Sales */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">
                  This Week's Sales
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(weeklySummary.totalSales)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Last 7 days • {weeklySummary.daysCount} days
                </p>
              </div>
              <ShoppingBagIcon className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          {/* Weekly Net Revenue */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">
                  Net Revenue
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {formatCurrency(weeklySummary.netRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Sales - Expenses - Stock
                </p>
              </div>
              <ArrowTrendingUpIcon className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Weekly Expenses */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">
                  This Week's Expenses
                </p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {formatCurrency(weeklySummary.totalExpenses)}
                </p>
                <p className="text-xs text-red-600 mt-1">Operating costs</p>
              </div>
              <MinusCircleIcon className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>

        {/* Stock Purchases & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-purple-700 font-medium">
                  Stock Purchases (7 days)
                </p>
                <p className="text-xl font-bold text-purple-900 mt-1">
                  {formatCurrency(weeklySummary.totalStockPurchases)}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Inventory restocked
                </p>
              </div>
              <ShoppingCartIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-orange-700 font-medium">
                  Daily Average
                </p>
                <p className="text-xl font-bold text-orange-900 mt-1">
                  {formatCurrency(
                    weeklySummary.daysCount > 0
                      ? weeklySummary.totalSales / weeklySummary.daysCount
                      : 0
                  )}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Per day this week
                </p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Quick Action - Show if today's sales not finalized */}
        {dashboardData?.todaySales?.status !== "finalized" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Today's sales not finalized
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Complete today's inventory and finalize to lock in the
                  records.
                </p>
                <Link to="/daily-sales" className="inline-block mt-2">
                  <Button variant="secondary" size="sm">
                    Go to Daily Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Card>
      {/* =============== END UPDATED: Daily Operations Module =============== */}
    </div>
  );
};
