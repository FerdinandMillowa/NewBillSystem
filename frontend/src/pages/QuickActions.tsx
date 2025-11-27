import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { customersService } from "../services/customers.service";
import { billsService } from "../services/bills.service";
import { paymentsService } from "../services/payments.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CreateCustomerModal } from "../components/customers/CreateCustomerModal";
import { CreateBillModal } from "../components/bills/CreateBillModal";
import { CreatePaymentModal } from "../components/payments/CreatePaymentModal";
import {
  UserPlusIcon,
  DocumentPlusIcon,
  CreditCardIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowRightIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/formatters";

export const QuickActions = () => {
  const navigate = useNavigate();
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);

  // Fetch quick stats
  const { data: customerStats } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: () => customersService.getStats(),
  });

  const { data: billStats } = useQuery({
    queryKey: ["bill-stats"],
    queryFn: () => billsService.getStats(),
  });

  const { data: paymentStats } = useQuery({
    queryKey: ["payment-stats"],
    queryFn: () => paymentsService.getStats(),
  });

  // Recent activity
  const { data: recentBills } = useQuery({
    queryKey: ["recent-bills"],
    queryFn: () => billsService.getRecent(3),
  });

  const { data: recentPayments } = useQuery({
    queryKey: ["recent-payments"],
    queryFn: () => paymentsService.getRecent(3),
  });

  const quickActions = [
    {
      id: "add-customer",
      title: "Add New Customer",
      description: "Register a new customer to the system",
      icon: UserPlusIcon,
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
      action: () => setIsCreateCustomerOpen(true),
    },
    {
      id: "create-bill",
      title: "Create Bill",
      description: "Issue a new bill for a customer",
      icon: DocumentPlusIcon,
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-600 dark:text-purple-400",
      action: () => setIsCreateBillOpen(true),
    },
    {
      id: "record-payment",
      title: "Record Payment",
      description: "Log a customer payment transaction",
      icon: CreditCardIcon,
      color: "from-green-500 to-green-600",
      iconBg: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
      action: () => setIsCreatePaymentOpen(true),
    },
  ];

  const navigationLinks = [
    {
      title: "Full Dashboard",
      description: "View comprehensive analytics and reports",
      icon: ChartBarIcon,
      path: "/dashboard",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Manage Customers",
      description: "View and manage all customer accounts",
      icon: UsersIcon,
      path: "/customers",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      title: "View Bills",
      description: "Browse and search all bills",
      icon: DocumentTextIcon,
      path: "/bills",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "View Payments",
      description: "Track all payment transactions",
      icon: BanknotesIcon,
      path: "/payments",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  const todayStats = [
    {
      label: "Total Customers",
      value: customerStats?.total || 0,
      subtext: `${customerStats?.approved || 0} approved`,
      icon: UsersIcon,
      color: "text-blue-600",
    },
    {
      label: "Total Bills",
      value: formatCurrency(billStats?.totalAmount || 0),
      subtext: `${billStats?.totalBills || 0} bills`,
      icon: DocumentTextIcon,
      color: "text-purple-600",
    },
    {
      label: "Total Collected",
      value: formatCurrency(paymentStats?.totalAmount || 0),
      subtext: `${paymentStats?.totalPayments || 0} payments`,
      icon: CreditCardIcon,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-4">
          <SparklesIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Quick Actions Center
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Welcome! Complete your daily tasks quickly with one-click actions
          below
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {todayStats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stat.subtext}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/5 to-transparent rounded-full -mr-16 -mt-16" />
          </Card>
        ))}
      </div>

      {/* Main Quick Actions */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-700" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.id}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                onClick={action.action}
              >
                {/* Background gradient on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                <div className="relative">
                  <div
                    className={`inline-flex p-4 rounded-2xl ${action.iconBg} mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-8 h-8 ${action.iconColor}`} />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {action.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {action.description}
                  </p>

                  <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium text-sm group-hover:translate-x-2 transition-transform">
                    Get Started
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Bills
              </h3>
            </div>
            <button
              onClick={() => navigate("/bills")}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {recentBills && recentBills.length > 0 ? (
              recentBills.map((bill: any) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {bill.customer?.firstName} {bill.customer?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {bill.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(bill.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent bills</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Payments */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Payments
              </h3>
            </div>
            <button
              onClick={() => navigate("/payments")}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {recentPayments && recentPayments.length > 0 ? (
              recentPayments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {payment.customer?.firstName} {payment.customer?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {payment.paymentMethod === "mpamba"
                        ? "Mpamba"
                        : payment.paymentMethod === "airtel_money"
                        ? "Airtel Money"
                        : payment.paymentMethod === "cash"
                        ? "Cash"
                        : payment.paymentMethod === "bank"
                        ? "Bank Transfer"
                        : payment.paymentMethod === "card"
                        ? "Card"
                        : payment.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CreditCardIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent payments</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Navigation Links */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Explore More
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-700" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`group p-6 rounded-xl ${link.bgColor} hover:shadow-lg transition-all duration-300 text-left hover:-translate-y-1`}
              >
                <Icon
                  className={`w-8 h-8 ${link.color} mb-3 group-hover:scale-110 transition-transform`}
                />
                <h3 className={`font-semibold ${link.color} mb-1`}>
                  {link.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {link.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <CreateCustomerModal
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
      />
      <CreateBillModal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
      />
      <CreatePaymentModal
        isOpen={isCreatePaymentOpen}
        onClose={() => setIsCreatePaymentOpen(false)}
      />
    </div>
  );
};
