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

export const paymentSchema = z
  .object({
    customerId: z.string().uuid('Please select a customer'),
    amount: z.number().min(0, 'Amount must be positive'),
    paymentMethod: z.enum(['cash', 'mobile_money', 'bank', 'card', 'mpamba', 'airtel_money']),
    notes: z.string().optional(),
    paymentDate: z.string().optional(),
    referenceNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.paymentMethod !== 'cash' &&
      (!data.referenceNumber || data.referenceNumber.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reference number is required for non-cash payments',
        path: ['referenceNumber'],
      });
    }
  });