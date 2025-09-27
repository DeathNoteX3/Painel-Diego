import React from 'react';
import { Income, Expense, CalendarEvent, IncomeSource, CreditCard, ExpenseCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, CalendarDaysIcon, BanknotesIcon, ExclamationTriangleIcon } from './Icons';

interface DashboardProps {
  incomes: Income[];
  expenses: Expense[];
  events: CalendarEvent[];
  creditCards: CreditCard[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; gradient: string }> = ({ title, value, icon, gradient }) => (
  <div className={`p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-transform duration-300 hover:scale-105 ${gradient}`}>
    <div className="p-3 rounded-full bg-black/20">
      {icon}
    </div>
    <div>
      <p className="text-slate-200 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ incomes, expenses, events, creditCards }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyIncomes = incomes.filter(i => {
    const incomeDate = new Date(i.date);
    return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
  });

  const monthlyPaidExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.dueDate);
    return e.isPaid && expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });
  
  const totalIncomeMonth = monthlyIncomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpensesMonth = monthlyPaidExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalanceMonth = totalIncomeMonth - totalExpensesMonth;
  
  const incomeBySource = [
    { name: IncomeSource.JAY_XINGLAU, value: monthlyIncomes.filter(i => i.source === IncomeSource.JAY_XINGLAU).reduce((acc, i) => acc + i.amount, 0)},
    { name: IncomeSource.EVENTS, value: monthlyIncomes.filter(i => i.source === IncomeSource.EVENTS).reduce((acc, i) => acc + i.amount, 0)},
    { name: IncomeSource.HOSTINGER, value: monthlyIncomes.filter(i => i.source === IncomeSource.HOSTINGER).reduce((acc, i) => acc + i.amount, 0)}
  ].filter(d => d.value > 0);

  const upcomingExpenses = expenses
    .filter(e => !e.isPaid && new Date(e.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);
    
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  const SOURCE_COLORS = {
    [IncomeSource.JAY_XINGLAU]: '#4f46e5',
    [IncomeSource.EVENTS]: '#10b981',
    [IncomeSource.HOSTINGER]: '#f59e0b',
    [IncomeSource.OTHER]: '#ef4444',
  };

  return (
    <div>
      <div className="flex justify-between items-center pr-16">
        <h2 className="text-3xl font-bold mb-6 text-text-primary">Dashboard</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 pr-16">
        <SummaryCard title="Receita Total (mês)" value={formatCurrency(totalIncomeMonth)} icon={<ArrowUpCircleIcon className="w-8 h-8 text-white"/>} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
        <SummaryCard title="Despesas Pagas (mês)" value={formatCurrency(totalExpensesMonth)} icon={<ArrowDownCircleIcon className="w-8 h-8 text-white"/>} gradient="bg-gradient-to-br from-red-500 to-rose-600" />
        <SummaryCard title="Saldo Líquido" value={formatCurrency(netBalanceMonth)} icon={<BanknotesIcon className="w-8 h-8 text-white"/>} gradient="bg-gradient-to-br from-indigo-500 to-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pr-16">
        <div className="lg:col-span-3 bg-surface p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-text-primary">Receitas por Fonte (mês)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={incomeBySource} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                 <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => formatCurrency(Number(value))} />
                 <YAxis dataKey="name" type="category" stroke="#94a3b8" width={120} tick={{ fill: '#94a3b8' }} />
                <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem' }} labelStyle={{ color: '#f8fafc' }} formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" name="Valor" barSize={25}>
                  {incomeBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SOURCE_COLORS[entry.name as IncomeSource] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col space-y-8">
            <div className="bg-surface p-6 rounded-xl shadow-lg flex-1">
                <div className="flex items-center space-x-3 mb-4">
                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400"/>
                    <h3 className="text-xl font-semibold text-text-primary">Próximas Despesas</h3>
                </div>
                {upcomingExpenses.length > 0 ? (
                    <ul className="space-y-3">
                    {upcomingExpenses.map(expense => {
                        const card = expense.creditCardId ? creditCards.find(c => c.id === expense.creditCardId) : undefined;
                        const isCard = expense.category === ExpenseCategory.CREDIT_CARD;
                        return (
                        <li key={expense.id} className="flex justify-between items-center text-sm transition-colors duration-200 p-2 rounded-md hover:bg-slate-700/50">
                        <div className="flex items-center space-x-3">
                            {isCard && card?.logoUrl ? (
                                <img src={card.logoUrl} alt={card.name} className="w-8 h-8 object-contain bg-white/10 p-1 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                                   <BanknotesIcon className="w-5 h-5 text-text-secondary" />
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-text-primary">{expense.description}</p>
                                <p className="text-text-secondary text-xs">{new Date(expense.dueDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}</p>
                            </div>
                        </div>
                        <span className="font-bold text-lg text-red-500">{formatCurrency(expense.amount)}</span>
                        </li>
                        )
                    })}
                    </ul>
                ) : (
                    <p className="text-text-secondary text-center py-4">Nenhuma despesa futura.</p>
                )}
            </div>
            <div className="bg-surface p-6 rounded-xl shadow-lg flex-1">
                 <div className="flex items-center space-x-3 mb-4">
                    <CalendarDaysIcon className="w-6 h-6 text-indigo-400"/>
                    <h3 className="text-xl font-semibold text-text-primary">Próximos Eventos na Agenda</h3>
                </div>
                {upcomingEvents.length > 0 ? (
                <ul className="space-y-4">
                    {upcomingEvents.map(event => (
                    <li key={event.id} className="flex items-center space-x-4 text-sm transition-colors duration-200 p-2 rounded-md hover:bg-slate-700/50">
                        <div className="flex-shrink-0 bg-primary/20 text-primary font-bold p-3 rounded-lg flex flex-col items-center justify-center w-16">
                           <span className="text-xs uppercase">{new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}.</span>
                           <span className="text-2xl -mt-1">{new Date(event.date).getDate()}</span>
                        </div>
                        <div>
                            <p className="font-semibold text-text-primary">{event.title}</p>
                            <p className="text-text-secondary text-xs">{event.description || "Nenhuma descrição."}</p>
                        </div>
                    </li>
                    ))}
                </ul>
                 ) : (
                    <p className="text-text-secondary text-center py-4">Nenhum evento futuro.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;