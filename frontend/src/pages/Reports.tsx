/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "../services/reports.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ExportModal } from "../components/reports/ExportModal";
import {
  formatCurrency,
  formatDate,
  formatCustomerName,
  getPaymentMethodLabel,
} from "../utils/formatters";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
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
import { format, subDays, subMonths } from "date-fns";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Fetch all reports data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => reportsService.getDashboard(),
  });

  const { data: monthlyData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ["monthly-report", dateRange],
    queryFn: () => reportsService.getMonthly(dateRange),
  });

  const { data: dailyData, isLoading: isDailyLoading } = useQuery({
    queryKey: ["daily-report", dateRange],
    queryFn: () => reportsService.getDaily(dateRange),
  });

  const { data: outstandingData, isLoading: isOutstandingLoading } = useQuery({
    queryKey: ["outstanding-balances"],
    queryFn: () => reportsService.getOutstanding(),
  });

  const { data: paymentMethods, isLoading: isPaymentMethodsLoading } = useQuery(
    {
      queryKey: ["payment-methods"],
      queryFn: () => reportsService.getPaymentMethods(),
    }
  );

  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: ["revenue-report", dateRange],
    queryFn: () => reportsService.getRevenue(dateRange),
  });

  const { data: topCustomers, isLoading: isTopCustomersLoading } = useQuery({
    queryKey: ["top-customers"],
    queryFn: () => reportsService.getTopCustomers(10),
  });

  // Handle loading states
  const isLoading =
    isDashboardLoading ||
    isMonthlyLoading ||
    isDailyLoading ||
    isOutstandingLoading ||
    isPaymentMethodsLoading ||
    isRevenueLoading ||
    isTopCustomersLoading;

  // Prepare chart data
  const monthlyChartData =
    monthlyData?.map((item: any) => ({
      month: item.month.substring(5),
      bills: item.billsAmount,
      payments: item.paymentsAmount,
      net: item.netRevenue,
    })) || [];

  const dailyChartData =
    dailyData?.slice(-14).map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      bills: item.billsAmount,
      payments: item.paymentsAmount,
    })) || [];

  const paymentMethodChartData =
    paymentMethods?.map((item: any) => ({
      name: getPaymentMethodLabel(item.method),
      value: item.amount,
      percentage: item.percentage,
    })) || [];

  const handleDateRangeChange = (
    field: "startDate" | "endDate",
    value: string
  ) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const totalOutstanding =
    outstandingData?.reduce(
      (sum: number, item: any) => sum + item.balance,
      0
    ) || 0;

  // Quick date range presets
  const quickDateRanges = [
    { label: "Last 7 Days", start: subDays(new Date(), 7), end: new Date() },
    { label: "Last 30 Days", start: subDays(new Date(), 30), end: new Date() },
    { label: "Last 90 Days", start: subDays(new Date(), 90), end: new Date() },
    {
      label: "This Month",
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    },
    { label: "Last Month", start: subMonths(new Date(), 1), end: new Date() },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive financial insights and statistics
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center"
        >
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <h3 className="text-lg font-semibold">Date Range Filter</h3>
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Quick Date Range Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickDateRanges.map((range) => (
                <Button
                  key={range.label}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDateRange({
                      startDate: format(range.start, "yyyy-MM-dd"),
                      endDate: format(range.end, "yyyy-MM-dd"),
                    });
                  }}
                >
                  {range.label}
                </Button>
              ))}
            </div>

            {/* Custom Date Range */}
            <div className="flex items-center space-x-4">
              <div>
                <label className="label text-xs">From</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    handleDateRangeChange("startDate", e.target.value)
                  }
                  className="input py-1 text-sm"
                />
              </div>
              <div>
                <label className="label text-xs">To</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    handleDateRangeChange("endDate", e.target.value)
                  }
                  className="input py-1 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(revenueData?.billsAmount || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {revenueData?.totalBills || 0} bills issued
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(revenueData?.paymentsAmount || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {revenueData?.totalPayments || 0} payments received
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(revenueData?.outstandingAmount || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Yet to collect</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500">
              <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {revenueData?.collectionRate?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Payment efficiency</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card title="Monthly Revenue Trend">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                labelStyle={{ color: "#000" }}
              />
              <Legend />
              <Bar dataKey="bills" fill="#8b5cf6" name="Bills Issued" />
              <Bar dataKey="payments" fill="#10b981" name="Payments Received" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Daily Trend (Last 14 Days) */}
        <Card title="Daily Activity (Last 14 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
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
                name="Bills"
                dot={{ fill: "#8b5cf6" }}
              />
              <Line
                type="monotone"
                dataKey="payments"
                stroke="#10b981"
                strokeWidth={2}
                name="Payments"
                dot={{ fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card title="Payment Methods Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            {paymentMethods?.map((method: any, index: number) => (
              <div
                key={method.method}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-700">
                    {getPaymentMethodLabel(method.method)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {method.count}
                  </span>
                  <span className="text-xs text-gray-500 block">
                    {formatCurrency(method.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Customers */}
        <Card title="Top 10 Customers by Payments" className="flex flex-col">
          <div className="flex-1 space-y-2 max-h-80 overflow-y-auto">
            {topCustomers && topCustomers.length > 0 ? (
              topCustomers.map((customer: any, index: number) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold text-sm mr-3">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(customer.totalPaid)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No customer data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Outstanding Balances */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Outstanding Balances</h3>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOutstanding)}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Bills
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {outstandingData && outstandingData.length > 0 ? (
                outstandingData.slice(0, 10).map((customer: any) => (
                  <tr key={customer.customerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.customerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {customer.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(customer.totalBills)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-green-600">
                        {formatCurrency(customer.totalPayments)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-red-600">
                        {formatCurrency(customer.balance)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No outstanding balances! All customers are paid up. 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {outstandingData && outstandingData.length > 10 && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Showing top 10 customers with outstanding balances. Total{" "}
              {outstandingData.length} customers have outstanding balances.
            </p>
          </div>
        )}
      </Card>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
