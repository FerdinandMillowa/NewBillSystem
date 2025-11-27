import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch customer with balance
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersService.getById(id!),
    enabled: !!id,
  });

  // Fetch customer bills
  const { data: billsData, isLoading: isLoadingBills } = useQuery({
    queryKey: ["customer-bills", id],
    queryFn: () => billsService.getByCustomer(id!),
    enabled: !!id,
  });

  // Fetch customer payments
  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["customer-payments", id],
    queryFn: () => paymentsService.getByCustomer(id!),
    enabled: !!id,
  });

  if (isLoadingCustomer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Customer Not Found
        </h3>
        <p className="text-gray-600 mb-4">
          The customer you're looking for doesn't exist.
        </p>
        <Button variant="primary" onClick={() => navigate("/customers")}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const bills = billsData || [];
  const payments = paymentsData || [];

  const totalBills = bills.reduce(
    (sum: number, bill: any) => sum + parseFloat(bill.amount),
    0
  );
  const totalPayments = payments.reduce(
    (sum: number, payment: any) => sum + parseFloat(payment.amount),
    0
  );
  const balance = customer.balance || 0;

  const stats = [
    {
      name: "Total Billed",
      value: formatCurrency(totalBills),
      icon: DocumentTextIcon,
      color: "bg-blue-500",
      subtext: `${bills.length} bill${bills.length !== 1 ? "s" : ""}`,
    },
    {
      name: "Total Paid",
      value: formatCurrency(totalPayments),
      icon: CreditCardIcon,
      color: "bg-green-500",
      subtext: `${payments.length} payment${payments.length !== 1 ? "s" : ""}`,
    },
    {
      name: "Outstanding Balance",
      value: formatCurrency(balance),
      icon: CurrencyDollarIcon,
      color: balance > 0 ? "bg-red-500" : "bg-gray-500",
      subtext: balance > 0 ? "Amount owed" : "Fully paid",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={() => navigate("/customers")}
            className="flex items-center"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {formatCustomerName(customer.firstName, customer.lastName)}
            </h1>
            <p className="text-gray-600 mt-1">Customer Details & History</p>
          </div>
        </div>
        <div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              customer.status === "approved"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {customer.status === "approved" ? (
              <CheckCircleIcon className="w-4 h-4 mr-1" />
            ) : (
              <ClockIcon className="w-4 h-4 mr-1" />
            )}
            {customer.status}
          </span>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start space-x-3">
            <UserIcon className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="text-base font-medium text-gray-900">
                {formatCustomerName(customer.firstName, customer.lastName)}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-base font-medium text-gray-900">
                {customer.email}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <PhoneIcon className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-base font-medium text-gray-900">
                {customer.phone}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPinIcon className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="text-base font-medium text-gray-900">
                {customer.address || "N/A"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Customer Since:</span>
            <span className="font-medium text-gray-900">
              {formatDate(customer.createdAt)}
            </span>
          </div>
        </div>
      </Card>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center justify-between">
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

      {/* Bills & Payments Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bills */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Bills History</h3>
            <span className="text-sm text-gray-500">{bills.length} total</span>
          </div>
          {isLoadingBills ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : bills.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {bills.map((bill: any) => (
                <div
                  key={bill.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {bill.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(bill.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(bill.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No bills recorded</p>
            </div>
          )}
        </Card>

        {/* Payments */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Payments History</h3>
            <span className="text-sm text-gray-500">
              {payments.length} total
            </span>
          </div>
          {isLoadingPayments ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </p>
                      {payment.notes && (
                        <p className="text-xs text-gray-600 mt-1">
                          {payment.notes}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCardIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No payments recorded</p>
            </div>
          )}
        </Card>
      </div>

      {/* Balance Alert */}
      {balance > 0 && (
        <Card className="bg-red-50 border border-red-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Outstanding Balance
              </h3>
              <p className="text-sm text-red-700 mt-1">
                This customer has an outstanding balance of{" "}
                <strong>{formatCurrency(balance)}</strong>. Consider recording a
                payment or issuing a reminder.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
