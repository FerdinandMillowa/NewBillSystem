import type { Customer } from "../../types/customer.types";
import { Button } from "../ui/Button";
import {
  formatDate,
  formatPhoneNumber,
  getStatusBadgeColor,
  formatCurrency,
} from "../../utils/formatters";
import { Link } from "react-router-dom";
import {
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onApprove?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  isApproving?: boolean;
  isDeleting?: boolean;
  isEditing?: boolean;
}

export const CustomerTable = ({
  customers,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onApprove,
  onDelete,
  onEdit,
  isApproving,
  isDeleting,
  isEditing,
}: CustomerTableProps) => {
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No customers found</p>
      </div>
    );
  }

  const showBalanceColumn = customers.some(
    (c) => typeof c.balance === "number"
  );

  return (
    <div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>

              {showBalanceColumn && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              )}

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {customer.firstName.charAt(0)}
                        {customer.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatPhoneNumber(customer.phone)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {customer.address || "No address"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={clsx(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      getStatusBadgeColor(customer.status)
                    )}
                  >
                    {customer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(customer.createdAt)}
                </td>

                {showBalanceColumn && (
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                    {customer.balance ? formatCurrency(customer.balance) : "-"}
                  </td>
                )}

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Link
                    to={`/customers/${customer.id}`}
                    className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>

                  {onEdit && (
                    <button
                      onClick={() => onEdit(customer)}
                      disabled={isEditing}
                      className="text-gray-600 hover:text-gray-900 inline-flex items-center disabled:opacity-50"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}

                  {onApprove && (
                    <button
                      onClick={() => onApprove(customer)}
                      disabled={isApproving}
                      className="text-green-600 hover:text-green-900 inline-flex items-center disabled:opacity-50"
                      title={
                        customer.status === "pending"
                          ? "Approve"
                          : "Set to Pending"
                      }
                    >
                      {customer.status === "pending" ? (
                        <CheckCircleIcon className="w-4 h-4" />
                      ) : (
                        <XCircleIcon className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(customer)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 inline-flex items-center disabled:opacity-50"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)}{" "}
            of {total} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  (p >= page - 1 && p <= page + 1)
              )
              .map((p, idx, arr) => (
                <div key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <Button
                    variant={p === page ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </Button>
                </div>
              ))}
            <Button
              variant="secondary"
              size="sm"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
