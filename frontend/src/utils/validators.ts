import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const customerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  address: z.string().optional(),
});

export const billSchema = z.object({
  customerId: z.string().uuid('Please select a customer'),
  amount: z.number().min(0, 'Amount must be positive'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  transactionDate: z.string().optional(),
});

export const paymentSchema = z.object({
  customerId: z.string().uuid('Please select a customer'),
  amount: z.number().min(0, 'Amount must be positive'),
  paymentMethod: z.enum(['cash', 'mobile_money', 'bank', 'card']),
  notes: z.string().optional(),
});