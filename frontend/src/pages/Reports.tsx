import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "../services/reports.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { formatCurrency } from "../utils/formatters";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
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
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Existing reports queries
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => reportsService.getDashboard(),
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["monthly-report", dateRange],
    queryFn: () => reportsService.getMonthly(dateRange),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => reportsService.getPaymentMethods(),
  });

  // NEW: Daily Sales Analytics queries
  const { data: dailySalesSummary } = useQuery({
    queryKey: ["daily-sales-summary", dateRange],
    queryFn: () =>
      reportsService.getDailySalesSummary(
        dateRange.startDate,
        dateRange.endDate
      ),
    enabled: activeTab === "daily-sales",
  });

  const { data: productPerformance } = useQuery({
    queryKey: ["product-performance", dateRange],
    queryFn: () =>
      reportsService.getProductPerformance(
        dateRange.startDate,
        dateRange.endDate
      ),
    enabled: activeTab === "daily-sales",
  });

  const { data: categorySales } = useQuery({
    queryKey: ["category-sales", dateRange],
    queryFn: () =>
      reportsService.getCategorySales(dateRange.startDate, dateRange.endDate),
    enabled: activeTab === "daily-sales",
  });

  const { data: expenseAnalysis } = useQuery({
    queryKey: ["expense-analysis", dateRange],
    queryFn: () =>
      reportsService.getExpenseAnalysis(dateRange.startDate, dateRange.endDate),
    enabled: activeTab === "daily-sales",
  });

  const { data: dailySalesPaymentMethods } = useQuery({
    queryKey: ["daily-sales-payment-methods", dateRange],
    queryFn: () =>
      reportsService.getDailySalesPaymentMethods(
        dateRange.startDate,
        dateRange.endDate
      ),
    enabled: activeTab === "daily-sales",
  });

  const { data: shortageTracking } = useQuery({
    queryKey: ["shortage-tracking", dateRange],
    queryFn: () =>
      reportsService.getShortageTracking(
        dateRange.startDate,
        dateRange.endDate
      ),
    enabled: activeTab === "daily-sales",
  });

  const { data: weeklyComparison } = useQuery({
    queryKey: ["weekly-comparison"],
    queryFn: () => reportsService.getWeeklyComparison(),
    enabled: activeTab === "daily-sales",
  });

  const tabs = [
    { id: "overview", name: "Overview", icon: ChartBarIcon },
    {
      id: "daily-sales",
      name: "Daily Sales Analytics",
      icon: DocumentTextIcon,
    },
  ];

  const quickDateRanges = [
    { label: "Last 7 Days", start: subDays(new Date(), 7), end: new Date() },
    { label: "Last 30 Days", start: subDays(new Date(), 30), end: new Date() },
    { label: "Last 90 Days", start: subDays(new Date(), 90), end: new Date() },
    {
      label: "This Month",
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    },
  ];

  const handleDateRangeChange = (
    field: "startDate" | "endDate",
    value: string
  ) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  // Render Daily Sales Analytics Tab
  const renderDailySalesTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(dailySalesSummary?.summary?.totalSales || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {dailySalesSummary?.summary?.totalDays || 0} days
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(
                  dailySalesSummary?.summary?.totalCollected || 0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">Revenue collected</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(dailySalesSummary?.summary?.totalExpenses || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Operating costs</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Revenue</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {formatCurrency(
                  dailySalesSummary?.summary?.totalNetRevenue || 0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">Profit</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly Comparison */}
      {weeklyComparison && (
        <Card title="This Week vs Last Week">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Sales Change</p>
              <p
                className={`text-3xl font-bold mt-2 ${
                  weeklyComparison.comparison.salesChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {weeklyComparison.comparison.salesChange >= 0 ? "+" : ""}
                {weeklyComparison.comparison.salesChange.toFixed(1)}%
              </p>
              <div className="mt-4 space-y-1 text-xs">
                <p className="text-gray-600">
                  This Week:{" "}
                  {formatCurrency(weeklyComparison.thisWeek.totalSales)}
                </p>
                <p className="text-gray-500">
                  Last Week:{" "}
                  {formatCurrency(weeklyComparison.lastWeek.totalSales)}
                </p>
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Expenses Change</p>
              <p
                className={`text-3xl font-bold mt-2 ${
                  weeklyComparison.comparison.expensesChange <= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {weeklyComparison.comparison.expensesChange >= 0 ? "+" : ""}
                {weeklyComparison.comparison.expensesChange.toFixed(1)}%
              </p>
              <div className="mt-4 space-y-1 text-xs">
                <p className="text-gray-600">
                  This Week:{" "}
                  {formatCurrency(weeklyComparison.thisWeek.totalExpenses)}
                </p>
                <p className="text-gray-500">
                  Last Week:{" "}
                  {formatCurrency(weeklyComparison.lastWeek.totalExpenses)}
                </p>
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Revenue Change</p>
              <p
                className={`text-3xl font-bold mt-2 ${
                  weeklyComparison.comparison.revenueChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {weeklyComparison.comparison.revenueChange >= 0 ? "+" : ""}
                {weeklyComparison.comparison.revenueChange.toFixed(1)}%
              </p>
              <div className="mt-4 space-y-1 text-xs">
                <p className="text-gray-600">
                  This Week:{" "}
                  {formatCurrency(weeklyComparison.thisWeek.netRevenue)}
                </p>
                <p className="text-gray-500">
                  Last Week:{" "}
                  {formatCurrency(weeklyComparison.lastWeek.netRevenue)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Row 1: Daily Trend & Category Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <Card title="Daily Sales Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySalesSummary?.dailyBreakdown || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
              />
              <YAxis />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                labelFormatter={(date) =>
                  format(new Date(date), "MMM dd, yyyy")
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalSales"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Sales"
              />
              <Line
                type="monotone"
                dataKey="totalExpenses"
                stroke="#ef4444"
                strokeWidth={2}
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="netRevenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Net Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Sales Pie Chart */}
        <Card title="Sales by Category">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categorySales || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) =>
                  `${entry.categoryName}: ${entry.percentage.toFixed(1)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="totalRevenue"
              >
                {(categorySales || []).map((entry: any, index: number) => (
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

      {/* Charts Row 2: Top Products & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card title="Top 10 Products by Revenue">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={productPerformance?.topProducts?.slice(0, 10) || []}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="productName" type="category" width={100} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="totalRevenue" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Breakdown */}
        <Card title="Expenses by Category">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={expenseAnalysis?.byCategory || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Payment Methods Distribution */}
      <Card title="Payment Methods Distribution (Daily Sales)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(dailySalesPaymentMethods || []).map((method: any) => (
            <div
              key={method.method}
              className="text-center p-4 bg-gray-50 rounded-lg"
            >
              <p className="text-sm text-gray-600 font-medium capitalize">
                {method.method.replace("_", " ")}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(method.amount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {method.percentage.toFixed(1)}% of total
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Shortage Tracking */}
      {shortageTracking && shortageTracking.totalShortage > 0 && (
        <Card title="Shortage Tracking">
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Shortage</p>
              <p className="text-xl font-bold text-yellow-600">
                {formatCurrency(shortageTracking.totalShortage)}
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Days with Shortage</p>
              <p className="text-xl font-bold text-red-600">
                {shortageTracking.daysWithShortage} /{" "}
                {shortageTracking.totalDays}
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Average Shortage</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(shortageTracking.averageShortage)}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={shortageTracking.dailyShortage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
              />
              <YAxis />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                labelFormatter={(date) =>
                  format(new Date(date), "MMM dd, yyyy")
                }
              />
              <Line
                type="monotone"
                dataKey="shortage"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Shortage"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Product Performance Table */}
      <Card title="Product Performance Details">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Qty Sold
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Avg Price
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(productPerformance?.topProducts || [])
                .slice(0, 15)
                .map((product: any, index: number) => (
                  <tr key={product.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 mr-3">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.categoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {product.totalSold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatCurrency(product.averagePrice)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive business insights and statistics
          </p>
        </div>
        <Button variant="primary" className="flex items-center">
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold">Date Range Filter</h3>
          </div>
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Customers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {dashboardData?.customers?.total || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dashboardData?.customers?.approved || 0} approved
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Bills
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(dashboardData?.bills?.amount || 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dashboardData?.bills?.total || 0} bills
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Collected
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {formatCurrency(dashboardData?.payments?.amount || 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dashboardData?.payments?.total || 0} payments
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Outstanding
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {formatCurrency(dashboardData?.revenue?.outstanding || 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dashboardData?.revenue?.collectionRate?.toFixed(1) || 0}%
                    collected
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-500">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend Chart */}
            <Card title="Revenue Trend">
              {monthlyData && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalSales"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Total Sales"
                      dot={{ r: 4, fill: "#8b5cf6" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalCollected"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Collected"
                      dot={{ r: 4, fill: "#10b981" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No data available for selected period
                </div>
              )}
            </Card>

            {/* Payment Methods Chart */}
            <Card title="Payment Methods Distribution">
              {paymentMethods?.breakdown &&
              paymentMethods.breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethods.breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) =>
                        `${entry.name}: ${entry.percentage?.toFixed(1) || 0}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {paymentMethods.breakdown.map(
                        (_entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No payment method data available
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "daily-sales" && renderDailySalesTab()}
    </div>
  );
};
