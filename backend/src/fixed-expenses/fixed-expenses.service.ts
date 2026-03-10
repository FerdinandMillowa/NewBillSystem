import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FixedExpense } from '../database/entities/fixed-expense.entity';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class FixedExpensesService {
  constructor(
    @InjectRepository(FixedExpense)
    private fixedExpenseRepository: Repository<FixedExpense>,
  ) {}

  async findAll(startDate?: string, endDate?: string): Promise<any> {
    let expenses: FixedExpense[];

    if (startDate && endDate) {
      expenses = await this.fixedExpenseRepository.find({
        where: {
          expenseDate: Between(
            startOfDay(parseISO(startDate)),
            endOfDay(parseISO(endDate)),
          ),
        },
        order: { expenseDate: 'DESC' },
      });
    } else {
      expenses = await this.fixedExpenseRepository.find({
        order: { expenseDate: 'DESC' },
      });
    }

    const total = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount?.toString() || '0'),
      0,
    );

    // Breakdown by category
    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += parseFloat(e.amount?.toString() || '0');
    });

    // Breakdown by payment method
    const byPaymentMethod: Record<string, number> = {};
    expenses.forEach((e) => {
      const method = e.paymentMethod || 'cash';
      if (!byPaymentMethod[method]) byPaymentMethod[method] = 0;
      byPaymentMethod[method] += parseFloat(e.amount?.toString() || '0');
    });

    return {
      expenses,
      total,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({
        category,
        amount,
      })),
      byPaymentMethod: Object.entries(byPaymentMethod).map(
        ([method, amount]) => ({ method, amount }),
      ),
    };
  }

  async findOne(id: string): Promise<FixedExpense> {
    const expense = await this.fixedExpenseRepository.findOne({
      where: { id },
    });
    if (!expense) throw new NotFoundException(`Fixed expense ${id} not found`);
    return expense;
  }

  async create(dto: CreateFixedExpenseDto): Promise<FixedExpense> {
    const expense = this.fixedExpenseRepository.create({
      ...dto,
      expenseDate: new Date(dto.expenseDate),
    });
    return this.fixedExpenseRepository.save(expense);
  }

  async update(id: string, dto: UpdateFixedExpenseDto): Promise<FixedExpense> {
    const expense = await this.findOne(id);
    Object.assign(expense, {
      ...dto,
      expenseDate: dto.expenseDate
        ? new Date(dto.expenseDate)
        : expense.expenseDate,
    });
    return this.fixedExpenseRepository.save(expense);
  }

  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);
    await this.fixedExpenseRepository.remove(expense);
  }
}
