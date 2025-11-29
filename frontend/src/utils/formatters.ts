
import { format, formatDistanceToNow } from 'date-fns';
import type { Product } from '../types/product.types';
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatPhoneNumber = (phone: string): string => {
  // Format Malawian phone numbers
  // Example: +265991234567 -> +265 99 123 4567
  if (phone.startsWith('+265')) {
    const numbers = phone.substring(4);
    return `+265 ${numbers.substring(0, 2)} ${numbers.substring(2, 5)} ${numbers.substring(5)}`;
  }
  return phone;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const formatCustomerName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`;
};

export const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    cash: 'Cash',
    mobile_money: 'Mobile Money',
    bank: 'Bank Transfer',
    card: 'Card',
  };
  return labels[method] || method;
};

export const getStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const formatProductName = (product: Product): string => {
  if (product.size) {
    return `${product.name} (${product.size})`;
  }
  return product.name;
};

export const formatUnit = (unit: string | null): string => {
  if (!unit) return '';
  const units: Record<string, string> = {
    bottle: 'Bottle',
    can: 'Can',
    shot: 'Shot',
    piece: 'Piece',
    pack: 'Pack',
  };
  return units[unit] || unit;
};

export const getStockStatus = (stock: number): {
  label: string;
  color: string;
} => {
  if (stock === 0) {
    return { label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
  } else if (stock < 10) {
    return { label: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
  } else if (stock < 50) {
    return { label: 'In Stock', color: 'text-blue-600 bg-blue-100' };
  } else {
    return { label: 'Well Stocked', color: 'text-green-600 bg-green-100' };
  }
};