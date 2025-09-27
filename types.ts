export enum IncomeSource {
  HOSTINGER = 'Hostinger',
  JAY_XINGLAU = 'Jay (Xinglau)',
  EVENTS = 'Eventos (Hamilton)',
  OTHER = 'Outro',
}

export interface Income {
  id: string;
  source: IncomeSource;
  description: string;
  amount: number;
  date: string; // ISO string format
  isPaid: boolean;
}

export enum ExpenseCategory {
  BILLS = 'Contas Fixas',
  CREDIT_CARD = 'Fatura Cartão',
  SUPPLIES = 'Material/Software',
  PERSONAL = 'Pessoal',
  OTHER = 'Outro',
}

export interface CreditCard {
  id: string;
  name: string;
  logoUrl?: string;
}


export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  creditCardId?: string;
  sourceRecurringId?: string;
}

export interface RecurringExpense {
    id: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    frequency: 'monthly' | 'yearly';
    startDate: string; // ISO string date YYYY-MM-DD
    creditCardId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string format
  description?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string format
}

export interface Notification {
  id: string;
  type: 'overdue' | 'event' | 'upcoming_bill';
  message: string;
  date: string; // ISO string
  creditCardId?: string;
}


export type View = 'dashboard' | 'jay' | 'hamilton' | 'hostinger' | 'financialControl' | 'calendar' | 'notes';