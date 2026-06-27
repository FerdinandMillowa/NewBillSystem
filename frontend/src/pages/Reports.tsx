import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  UsersIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingLibraryIcon,
  DevicePhoneMobileIcon,
  WalletIcon,
  ReceiptPercentIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
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
import { format, subDays } from "date-fns";
import { toast } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import {
  fixedExpensesService,
  FIXED_EXPENSE_CATEGORY_LABELS,
  type FixedExpense,
  type CreateFixedExpenseDto,
  type FixedExpenseCategory,
} from "../services/fixed-expenses.service";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export const Reports = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "billing";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  // Customer Billing queries 
  const { data: billingDashboardData } = useQuery({
    queryKey: ["billing-dashboard"],
    queryFn: () => reportsService.getDashboard(),
    enabled: activeTab === "billing",
  });

  const { data: billingMonthlyData } = useQuery({
    queryKey: [
      "monthly-billing-report",
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: () =>
      reportsService.getMonthlyBilling({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
  });

  const { data: billingPaymentMethods } = useQuery({
    queryKey: ["billing-payment-methods", dateRange],
    queryFn: () => reportsService.getBillingPaymentMethods(dateRange),
    enabled: activeTab === "billing",
  });

  const { data: topBillers } = useQuery({
    queryKey: ["top-billers"],
    queryFn: () => reportsService.getTopBillers(5),
  });

  const { data: topPayers } = useQuery({
    queryKey: ["top-payers"],
    queryFn: () => reportsService.getTopPayers(5),
  });

  const { data: overdueCustomers } = useQuery({
    queryKey: ["overdue-customers"],
    queryFn: () => reportsService.getOverdueCustomers(5),
  });

  // Daily Operations queries 
  const { data: dailySalesSummary } = useQuery({
    queryKey: ["daily-sales-summary", dateRange],
    queryFn: () =>
      reportsService.getDailySalesSummary(
        dateRange.startDate,
        dateRange.endDate
      ),
    enabled: activeTab === "operations",
  });

  const { data: productPerformance } = useQuery({
    queryKey: ["product-performance", dateRange],
    queryFn: () =>
      reportsService.getProductPerformance(
        dateRange.startDate,
        dateRange.endDate
      ),
    enabled: activeTab === "operations",
  });

  const { data: categorySales } = useQuery({
    queryKey: ["category-sales", dateRange],
    queryFn: () =>
      reportsService.getCategorySales(dateRange.startDate, dateRange.endDate),
    enabled: activeTab === "operations",
  });

  const { data: expenseAnalysis } = useQuery({
    queryKey: ["expense-analysis", dateRange],
    queryFn: () =>
      reportsService.getExpenseAnalysis(dateRange.startDate, dateRange.endDate),
    enabled: activeTab === "operations",
  });

  const { data: operationsPaymentMethods } = useQuery({
    queryKey: ["operations-payment-methods", dateRange],
    queryFn: () =>
      reportsService.getDailySalesPaymentMethods(
        dateRange.startDate,
        dateRange.endDate
      ),
    enabled: activeTab === "operations",
  });

  const { data: shortageTracking } = useQuery({
    queryKey: ["shortage-tracking", dateRange],
    queryFn: () =>
      reportsService.getShortageTracking(
        dateRange.startDate,
        dateRange.endDate
      ),
    enabled: activeTab === "operations",
  });

  const { data: weeklyComparison } = useQuery({
    queryKey: ["weekly-comparison"],
    queryFn: () => reportsService.getWeeklyComparison(),
    enabled: activeTab === "operations",
  });

  // Business Position query
  const { data: profitLossData, isLoading: isProfitLossLoading } = useQuery({
    queryKey: ["profit-loss", dateRange],
    queryFn: () =>
      reportsService.getProfitLoss(dateRange.startDate, dateRange.endDate),
    enabled: activeTab === "position",
  });

  // Supplier Analytics query
  const { data: supplierAnalytics, isLoading: isSupplierAnalyticsLoading } =
    useQuery({
      queryKey: ["supplier-analytics", dateRange],
      queryFn: () =>
        reportsService.getSupplierAnalytics(
          dateRange.startDate,
          dateRange.endDate
        ),
      enabled: activeTab === "position",
    });

  // Fixed Expenses state & query
  const emptyExpenseForm: CreateFixedExpenseDto = {
    category: "rent",
    description: "",
    amount: 0,
    paymentMethod: "cash",
    expenseDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  };

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(
    null
  );
  const [expenseForm, setExpenseForm] =
    useState<CreateFixedExpenseDto>(emptyExpenseForm);
  const [deleteConfirmExpenseId, setDeleteConfirmExpenseId] = useState<
    string | null
  >(null);

  const { data: fixedExpensesData, isLoading: isFixedExpensesLoading } =
    useQuery({
      queryKey: ["fixed-expenses", dateRange],
      queryFn: () =>
        fixedExpensesService.getAll(dateRange.startDate, dateRange.endDate),
      enabled: activeTab === "fixed-expenses",
    });

  const createExpenseMutation = useMutation({
    mutationFn: fixedExpensesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] });
      toast.success("Fixed expense added");
      setExpenseForm(emptyExpenseForm);
      setShowExpenseForm(false);
    },
    onError: () => toast.error("Failed to add expense"),
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateFixedExpenseDto>;
    }) => fixedExpensesService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] });
      toast.success("Expense updated");
      setEditingExpense(null);
      setExpenseForm(emptyExpenseForm);
      setShowExpenseForm(false);
    },
    onError: () => toast.error("Failed to update expense"),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: fixedExpensesService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] });
      toast.success("Expense deleted");
      setDeleteConfirmExpenseId(null);
    },
    onError: () => toast.error("Failed to delete expense"),
  });

  const handleExpenseEdit = (expense: FixedExpense) => {
    setExpenseForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      expenseDate: expense.expenseDate.split("T")[0],
      notes: expense.notes || "",
    });
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleExpenseSubmit = () => {
    if (!expenseForm.description.trim() || expenseForm.amount <= 0) {
      toast.error("Description and amount are required");
      return;
    }
    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, dto: expenseForm });
    } else {
      createExpenseMutation.mutate(expenseForm);
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm(emptyExpenseForm);
    setEditingExpense(null);
    setShowExpenseForm(false);
  };

  // Tabs
  const tabs = [
    {
      id: "billing",
      name: "Customer Billing",
      icon: CreditCardIcon,
      description: "Bills, Payments & Customer Analytics",
    },
    {
      id: "operations",
      name: "Daily Operations",
      icon: ShoppingBagIcon,
      description: "Sales, Products & Inventory Analytics",
    },
    {
      id: "position",
      name: "Business Position",
      icon: BanknotesIcon,
      description: "Profit / Loss & Where Your Money Is",
    },
    {
      id: "fixed-expenses",
      name: "Fixed Expenses",
      icon: ReceiptPercentIcon,
      description: "Rent, Salaries, Insurance & Permits",
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

  const billingMonthlyChartData =
    billingMonthlyData?.map((item: any) => ({
      month: item.month.substring(5),
      billsAmount: item.billsAmount || 0,
      paymentsAmount: item.paymentsAmount || 0,
    })) || [];

  // renderBillingTab 
  const renderBillingTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {billingDashboardData?.customers?.total || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {billingDashboardData?.customers?.approved || 0} approved
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bills</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(billingDashboardData?.bills?.amount || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {billingDashboardData?.bills?.total || 0} bills
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
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(billingDashboardData?.payments?.amount || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {billingDashboardData?.payments?.total || 0} payments
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
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(
                  billingDashboardData?.revenue?.outstanding || 0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {billingDashboardData?.revenue?.collectionRate?.toFixed(1) || 0}
                % collected
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-500">
              <CreditCardIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue Trend">
          {billingMonthlyChartData && billingMonthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={billingMonthlyChartData}>
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
              No billing data available for selected period
            </div>
          )}
        </Card>

        <Card title="Payment Methods Distribution">
          {billingPaymentMethods?.breakdown &&
          billingPaymentMethods.breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={billingPaymentMethods.breakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) =>
                    `${entry.name}: ${entry.percentage?.toFixed(1) || 0}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {billingPaymentMethods.breakdown.map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No payment method data available
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Top Billers">
          {topBillers && topBillers.length > 0 ? (
            <div className="space-y-3">
              {topBillers.map((customer: any, index: number) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {customer.billCount} bills
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-purple-600">
                    {formatCurrency(customer.totalBilled)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No billing data yet
            </p>
          )}
        </Card>

        <Card title="Top Payers">
          {topPayers && topPayers.length > 0 ? (
            <div className="space-y-3">
              {topPayers.map((customer: any, index: number) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {customer.paymentCount} payments
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(customer.totalPaid)}
                    </p>
                    {customer.balance > 0 && (
                      <p className="text-xs text-red-500">
                        Owes: {formatCurrency(customer.balance)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No payment data yet
            </p>
          )}
        </Card>

        <Card title="Outstanding Balances">
          {overdueCustomers && overdueCustomers.length > 0 ? (
            <div className="space-y-3">
              {overdueCustomers.map((customer: any) => (
                <div
                  key={customer.customerId}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {customer.customerName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Bills: {formatCurrency(customer.totalBills)} | Paid:{" "}
                      {formatCurrency(customer.totalPayments)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">
                      {formatCurrency(customer.balance)}
                    </p>
                    <p className="text-xs text-gray-500">Overdue</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              All balances cleared! 🎉
            </p>
          )}
        </Card>
      </div>
    </div>
  );

  // renderOperationsTab
  const renderOperationsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(dailySalesSummary?.summary?.totalSales || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {dailySalesSummary?.summary?.days || 0} days
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <ShoppingBagIcon className="w-6 h-6 text-white" />
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
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
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
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Purchases</p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">
                {formatCurrency(
                  dailySalesSummary?.summary?.totalStockPurchases || 0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Purchases within range
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500">
              <ShoppingBagIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Revenue</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {formatCurrency(
                  dailySalesSummary?.summary?.totalNetRevenue ??
                    (dailySalesSummary?.summary?.totalSales || 0) -
                      (dailySalesSummary?.summary?.totalExpenses || 0) -
                      (dailySalesSummary?.summary?.totalStockPurchases || 0)
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                After expenses & stock
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card title="Sales by Category">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categorySales || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) =>
                  `${entry.categoryName}: ${entry.percentage?.toFixed(1) || 0}%`
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      <Card title="Payment Methods Distribution">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(operationsPaymentMethods || []).map((method: any) => (
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
  // renderPositionTab
  const renderPositionTab = () => {
    if (isProfitLossLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      );
    }

    if (!profitLossData) {
      return (
        <div className="flex items-center justify-center min-h-[400px] text-gray-500">
          No data available for the selected period
        </div>
      );
    }

    const { profitLoss, moneyLocation, period, details, dailyBreakdown } =
      profitLossData;
    const isProfit = (profitLoss.trueNetProfit ?? profitLoss.netProfit) >= 0;
    const displayNetProfit = profitLoss.trueNetProfit ?? profitLoss.netProfit;

    return (
      <div className="space-y-6">
        {/* Hero: Profit / Loss Banner */}
        <div
          className={`rounded-2xl p-8 text-white ${
            isProfit
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : "bg-gradient-to-r from-red-500 to-rose-600"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                {isProfit ? (
                  <ArrowTrendingUpIcon className="w-8 h-8" />
                ) : (
                  <ArrowTrendingDownIcon className="w-8 h-8" />
                )}
                <span className="text-xl font-semibold opacity-90">
                  {isProfit ? "Net Profit" : "Net Loss"} for Period
                </span>
              </div>
              <p className="text-5xl font-bold tracking-tight">
                {formatCurrency(Math.abs(displayNetProfit))}
              </p>
              <p className="text-sm opacity-75 mt-2">
                {period.startDate} → {period.endDate} &nbsp;·&nbsp;{" "}
                {period.totalDays} trading days
              </p>
            </div>

            {/* Quick breakdown inside banner */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-xs opacity-80 uppercase tracking-wide">
                  Total Sales
                </p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(profitLoss.totalSales)}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-xs opacity-80 uppercase tracking-wide">
                  Total Expenses
                </p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(profitLoss.totalExpenses)}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-xs opacity-80 uppercase tracking-wide">
                  Stock Purchased
                </p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(profitLoss.totalStockPurchases)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* P&L Breakdown */}
        <Card title="Profit & Loss Breakdown">
          <div className="space-y-3">
            {[
              {
                label: "Total Sales (Revenue)",
                value: profitLoss.totalSales,
                color: "text-blue-600",
                bg: "bg-blue-50",
                sign: "+",
              },
              {
                label: "Operating Expenses",
                value: profitLoss.totalExpenses,
                color: "text-red-600",
                bg: "bg-red-50",
                sign: "−",
              },
              {
                label: "Gross Profit",
                value: profitLoss.grossProfit,
                color:
                  profitLoss.grossProfit >= 0
                    ? "text-green-600"
                    : "text-red-600",
                bg: profitLoss.grossProfit >= 0 ? "bg-green-50" : "bg-red-50",
                sign: "=",
                bold: true,
              },
              {
                label: "Stock Purchases (Cost of Goods)",
                value: profitLoss.totalStockPurchases,
                color: "text-orange-600",
                bg: "bg-orange-50",
                sign: "−",
              },
              {
                label: "Fixed Expenses (Rent, Salaries, etc.)",
                value: profitLoss.totalFixedExpenses ?? 0,
                color: "text-purple-600",
                bg: "bg-purple-50",
                sign: "−",
              },
              {
                label: displayNetProfit >= 0 ? "Net Profit" : "Net Loss",
                value: displayNetProfit,
                color:
                  displayNetProfit >= 0 ? "text-green-700" : "text-red-700",
                bg: displayNetProfit >= 0 ? "bg-green-100" : "bg-red-100",
                sign: "=",
                bold: true,
                large: true,
              },
            ].map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between p-4 rounded-lg ${row.bg}`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-8 text-center font-bold text-lg ${row.color}`}
                  >
                    {row.sign}
                  </span>
                  <span
                    className={`text-gray-700 ${
                      row.bold ? "font-semibold" : "font-normal"
                    } ${row.large ? "text-base" : "text-sm"}`}
                  >
                    {row.label}
                  </span>
                </div>
                <span
                  className={`font-bold ${row.color} ${
                    row.large ? "text-xl" : "text-base"
                  }`}
                >
                  {formatCurrency(Math.abs(row.value))}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Where Is The Money? */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <WalletIcon className="w-5 h-5 mr-2 text-primary-600" />
            Where Is The Money?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Cash at Hand */}
            <Card>
              <div className="flex flex-col items-center text-center p-2">
                <div className="p-3 bg-green-100 rounded-full mb-3">
                  <BanknotesIcon className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Cash at Hand
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(moneyLocation.cashAtHand)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  After cash stock purchases
                </p>
              </div>
            </Card>

            {/* Airtel Money */}
            <Card>
              <div className="flex flex-col items-center text-center p-2">
                <div className="p-3 bg-red-100 rounded-full mb-3">
                  <DevicePhoneMobileIcon className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Airtel Money
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(moneyLocation.airtelMoney)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Net of Airtel purchases
                </p>
              </div>
            </Card>

            {/* Mpamba */}
            <Card>
              <div className="flex flex-col items-center text-center p-2">
                <div className="p-3 bg-yellow-100 rounded-full mb-3">
                  <DevicePhoneMobileIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Mpamba
                </p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {formatCurrency(moneyLocation.mpamba)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Net of Mpamba purchases
                </p>
              </div>
            </Card>

            {/* Bank */}
            <Card>
              <div className="flex flex-col items-center text-center p-2">
                <div className="p-3 bg-blue-100 rounded-full mb-3">
                  <BuildingLibraryIcon className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Bank
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatCurrency(moneyLocation.bank)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Net of bank purchases
                </p>
              </div>
            </Card>

            {/* Outstanding Bills */}
            <Card>
              <div className="flex flex-col items-center text-center p-2">
                <div className="p-3 bg-purple-100 rounded-full mb-3">
                  <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Outstanding Bills
                </p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {formatCurrency(moneyLocation.outstandingBills)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Owed to business</p>
              </div>
            </Card>
          </div>

          {/* Total Business Position */}
          <div className="mt-4 p-6 bg-gray-900 rounded-2xl text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wide">
                Total Business Position
              </p>
              <p className="text-xs text-gray-500 mt-1">
                All money locations combined (including outstanding receivables)
              </p>
            </div>
            <p className="text-4xl font-bold text-white">
              {formatCurrency(moneyLocation.totalBusinessPosition)}
            </p>
          </div>
        </div>

        {/* ── Supporting Detail Cards───── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-xs text-gray-500">Bills Raised (Period)</p>
            <p className="text-lg font-bold text-gray-800 mt-1">
              {formatCurrency(details.totalBillsRaised)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-xs text-gray-500">Bill Payments Received</p>
            <p className="text-lg font-bold text-gray-800 mt-1">
              {formatCurrency(details.totalBillPaymentsReceived)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-xs text-gray-500">Cash Spent on Stock</p>
            <p className="text-lg font-bold text-gray-800 mt-1">
              {formatCurrency(details.cashStockPurchases)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-xs text-gray-500">Digital Spent on Stock</p>
            <p className="text-lg font-bold text-gray-800 mt-1">
              {formatCurrency(
                details.airtelStockPurchases +
                  details.mpambaStockPurchases +
                  details.bankStockPurchases
              )}
            </p>
          </div>
        </div>

        {/* Daily Profit/Loss Trend Chart  */}
        <Card title="Daily Profit / Loss Trend">
          {dailyBreakdown && dailyBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyBreakdown}>
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
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Sales"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Expenses"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Net Profit"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No daily data available for this period
            </div>
          )}
        </Card>

        {/* Supplier Analytics */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <ShoppingBagIcon className="w-5 h-5 mr-2 text-primary-600" />
            Supplier Analytics
          </h2>

          {isSupplierAnalyticsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : !supplierAnalytics ||
            supplierAnalytics.spendPerSupplier.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-400 text-center py-8">
                No supplier purchase data for this period.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Total Spend Per Supplier — bar chart */}
              <Card title="Total Spend Per Supplier">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={supplierAnalytics.spendPerSupplier}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <YAxis dataKey="supplierName" type="category" width={120} />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Bar
                      dataKey="totalSpend"
                      fill="#8b5cf6"
                      name="Total Spend"
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Summary table below chart */}
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Supplier
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Total Spend
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Purchases
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {supplierAnalytics.spendPerSupplier.map((s: any) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {s.supplierName}
                          </td>
                          <td className="px-4 py-2 text-sm font-bold text-purple-600 text-right">
                            {formatCurrency(s.totalSpend)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 text-right">
                            {s.purchaseCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Purchase Trend Over Time */}
              {supplierAnalytics.purchaseTrend.length > 0 && (
                <Card title="Supplier Purchase Trend">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={supplierAnalytics.purchaseTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Legend />
                      {supplierAnalytics.supplierNames.map(
                        (name: string, index: number) => (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        )
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Most Purchased Products Per Supplier */}
              <Card title="Top Products by Supplier">
                <div className="space-y-4">
                  {supplierAnalytics.spendPerSupplier
                    .filter((s: any) => s.totalSpend > 0)
                    .map((supplier: any) => {
                      const products =
                        supplierAnalytics.productsBySupplier.filter(
                          (p: any) => p.supplierId === supplier.id
                        );
                      if (products.length === 0) return null;
                      return (
                        <div
                          key={supplier.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">
                              {supplier.supplierName}
                            </span>
                            <span className="text-xs text-purple-600 font-medium">
                              {formatCurrency(supplier.totalSpend)} total
                            </span>
                          </div>
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-gray-50 border-t border-gray-100">
                                <th className="px-4 py-1.5 text-left text-xs text-gray-400 uppercase">
                                  Product
                                </th>
                                <th className="px-4 py-1.5 text-right text-xs text-gray-400 uppercase">
                                  Qty
                                </th>
                                <th className="px-4 py-1.5 text-right text-xs text-gray-400 uppercase">
                                  Spend
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {products.slice(0, 5).map((p: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm text-gray-700">
                                    {p.productName}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500 text-right">
                                    {p.totalQuantity}
                                  </td>
                                  <td className="px-4 py-2 text-sm font-medium text-gray-800 text-right">
                                    {formatCurrency(p.totalSpend)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFixedExpensesTab = () => {
    if (isFixedExpensesLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      );
    }

    const expenses: FixedExpense[] = fixedExpensesData?.expenses || [];
    const total: number = fixedExpensesData?.total || 0;
    const byCategory = fixedExpensesData?.byCategory || [];
    const byPaymentMethod = fixedExpensesData?.byPaymentMethod || [];

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 p-6 bg-gray-900 rounded-2xl text-white flex flex-col justify-between">
            <p className="text-sm text-gray-400 uppercase tracking-wide">
              Total Fixed Expenses
            </p>
            <p className="text-3xl font-bold mt-2">{formatCurrency(total)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {expenses.length} record{expenses.length !== 1 ? "s" : ""} in
              period
            </p>
          </div>

          {byCategory.map((cat: any) => (
            <div
              key={cat.category}
              className="p-4 bg-white rounded-xl border border-gray-200 flex flex-col justify-between"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {FIXED_EXPENSE_CATEGORY_LABELS[
                  cat.category as FixedExpenseCategory
                ] || cat.category}
              </p>
              <p className="text-xl font-bold text-gray-900 mt-2">
                {formatCurrency(cat.amount)}
              </p>
            </div>
          ))}
        </div>

        {/* Add button */}
        <div className="flex justify-end">
          {!showExpenseForm && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowExpenseForm(true)}
              className="flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Fixed Expense
            </Button>
          )}
        </div>

        {/* Form */}
        {showExpenseForm && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {editingExpense ? "Edit Expense" : "New Fixed Expense"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label text-xs">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      category: e.target.value as FixedExpenseCategory,
                    })
                  }
                  className="input text-sm"
                >
                  <option value="rent">Rent</option>
                  <option value="salaries_wages">Salaries & Wages</option>
                  <option value="licenses_permits">Licenses & Permits</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="label text-xs">Description</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="e.g. Monthly shop rent — March 2026"
                  className="input text-sm w-full"
                />
              </div>

              <div>
                <label className="label text-xs">Amount (MK)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="input text-sm w-full"
                />
              </div>

              <div>
                <label className="label text-xs">Payment Method</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      paymentMethod: e.target.value as any,
                    })
                  }
                  className="input text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="mpamba">Mpamba</option>
                  <option value="bank">Bank</option>
                </select>
              </div>

              <div>
                <label className="label text-xs">Date</label>
                <input
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      expenseDate: e.target.value,
                    })
                  }
                  className="input text-sm w-full"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="label text-xs">Notes (optional)</label>
                <input
                  type="text"
                  value={expenseForm.notes}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, notes: e.target.value })
                  }
                  placeholder="Any additional notes..."
                  className="input text-sm w-full"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="secondary" size="sm" onClick={resetExpenseForm}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExpenseSubmit}
                disabled={
                  createExpenseMutation.isPending ||
                  updateExpenseMutation.isPending
                }
              >
                {createExpenseMutation.isPending ||
                updateExpenseMutation.isPending
                  ? "Saving..."
                  : editingExpense
                  ? "Update"
                  : "Add Expense"}
              </Button>
            </div>
          </Card>
        )}

        {/* Expenses table */}
        <Card title="Fixed Expenses Record">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ReceiptPercentIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                No fixed expenses recorded for this period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {format(new Date(expense.expenseDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                          {FIXED_EXPENSE_CATEGORY_LABELS[expense.category] ||
                            expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{expense.description}</div>
                        {expense.notes && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {expense.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize whitespace-nowrap">
                        {expense.paymentMethod.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {deleteConfirmExpenseId === expense.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-xs text-red-600">
                              Delete?
                            </span>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                deleteExpenseMutation.mutate(expense.id)
                              }
                              disabled={deleteExpenseMutation.isPending}
                            >
                              Yes
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setDeleteConfirmExpenseId(null)}
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleExpenseEdit(expense)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirmExpenseId(expense.id)
                              }
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-sm font-semibold text-gray-700 text-right"
                    >
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      {formatCurrency(total)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // Main return
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
                  group inline-flex flex-col items-start py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <div className="flex items-center">
                  <Icon
                    className={`-ml-0.5 mr-2 h-5 w-5 ${
                      activeTab === tab.id
                        ? "text-primary-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {tab.name}
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {tab.description}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "billing" && renderBillingTab()}
      {activeTab === "operations" && renderOperationsTab()}
      {activeTab === "position" && renderPositionTab()}
      {activeTab === "fixed-expenses" && renderFixedExpensesTab()}
    </div>
  );
};
