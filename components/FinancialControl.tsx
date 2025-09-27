import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Expense, ExpenseCategory, CreditCard, Income, IncomeSource, RecurringExpense } from '../types';
import { PlusCircleIcon, Cog6ToothIcon, CreditCardIconDisplay, TrashIcon, PencilIcon, FunnelIcon, WalletIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, ArrowPathIcon, BanknotesIcon, HashtagIcon } from './Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ConfirmationModal from './ConfirmationModal';

type Transaction = (Income & { type: 'income', transactionDate: string }) | (Expense & { type: 'expense', transactionDate: string });

interface FinancialControlProps {
  incomes: Income[];
  expenses: Expense[];
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (income: Income) => void;
  deleteIncome: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  toggleExpensePaid: (id: string) => void;
  toggleIncomePaid: (id: string) => void;
  creditCards: CreditCard[];
  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  deleteCreditCard: (id: string) => void;
  updateCreditCard: (card: CreditCard) => void;
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => void;
  deleteRecurringExpense: (id: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const CreditCardInvoiceCard: React.FC<{ expense: Expense, card?: CreditCard, onClick: () => void }> = ({ expense, card, onClick }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(expense.dueDate);
  
  const valueColor = expense.isPaid ? 'text-accent-paid' : dueDate < today ? 'text-accent-overdue' : 'text-text-primary';

  return (
    <div onClick={onClick} className="bg-surface rounded-lg p-3 flex flex-col justify-between shadow-lg border border-slate-700/50 transition-transform duration-300 hover:scale-105 hover:border-primary cursor-pointer">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-text-secondary uppercase tracking-wider">{card?.name || expense.description}</h3>
          <div className="p-2 rounded-full bg-slate-900/50 border border-slate-700">
             {card?.logoUrl ? <img src={card.logoUrl} alt={card.name} className="w-20 h-20 object-contain" /> : <CreditCardIconDisplay className="w-20 h-20 text-accent-pending" />}
          </div>
        </div>
        <p className={`text-3xl font-bold my-1 ${valueColor}`}>{formatCurrency(expense.amount)}</p>
      </div>
      <div>
        <p className="text-sm text-text-secondary">Vencimento: {new Date(expense.dueDate).toLocaleDateString('pt-BR')}</p>
        <p className="text-sm text-text-secondary">1 transação este mês</p> 
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; gradient: string }> = ({ title, value, icon, gradient }) => (
  <div className={`p-6 rounded-xl shadow-lg flex items-center space-x-4 ${gradient}`}>
    <div className="p-3 rounded-full bg-black/20">
      {icon}
    </div>
    <div>
      <p className="text-slate-200 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);


const FinancialControl: React.FC<FinancialControlProps> = (props) => {
  const { incomes, expenses, addIncome, updateIncome, deleteIncome, addExpense, updateExpense, deleteExpense, toggleExpensePaid, toggleIncomePaid, creditCards, addCreditCard, deleteCreditCard, updateCreditCard, recurringExpenses, addRecurringExpense, deleteRecurringExpense } = props;

  const [isAddExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [isAddIncomeModalOpen, setAddIncomeModalOpen] = useState(false);
  const [isManageCardsModalOpen, setManageCardsModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'transaction' | 'card' | 'recurring' } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'invoices' | 'transactions'>('invoices');
  
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [filteredCardId, setFilteredCardId] = useState<string | null>(null);

  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id' | 'isPaid'>>({
    category: ExpenseCategory.CREDIT_CARD,
    description: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    creditCardId: creditCards[0]?.id || ''
  });
  
  const [newIncome, setNewIncome] = useState<Omit<Income, 'id' | 'isPaid'>>({
    source: IncomeSource.JAY_XINGLAU,
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const transactions = useMemo((): Transaction[] => {
    const allTransactions: Transaction[] = [
        ...incomes.map(i => ({ ...i, type: 'income' as const, transactionDate: i.date })),
        ...expenses.map(e => ({ ...e, type: 'expense' as const, transactionDate: e.dueDate }))
    ];
    return allTransactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [incomes, expenses]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
        months.add(new Date(t.transactionDate).toISOString().slice(0, 7)); // YYYY-MM
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let baseFiltered = transactions.filter(t => {
        const monthMatch = selectedMonth === 'all' || new Date(t.transactionDate).toISOString().slice(0, 7) === selectedMonth;
        const typeMatch = selectedType === 'all' || t.type === selectedType;
        
        let statusMatch = true;
        if (selectedStatus !== 'all') {
            statusMatch = selectedStatus === 'paid' ? t.isPaid : !t.isPaid;
        }
        
        return monthMatch && typeMatch && statusMatch;
    });

    if (filteredCardId) {
        return baseFiltered.filter(t => t.type === 'expense' && t.creditCardId === filteredCardId);
    }
    return baseFiltered;
  }, [transactions, selectedMonth, selectedStatus, selectedType, filteredCardId]);

  const { totalIncome, totalExpenses, expenseCount } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let count = 0;
    filteredTransactions.forEach(t => {
        if (t.type === 'income') {
            income += t.amount;
        } else {
            expense += t.amount;
            count++;
        }
    });
    return { totalIncome: income, totalExpenses: expense, expenseCount: count };
}, [filteredTransactions]);
const netBalance = totalIncome - totalExpenses;

  const creditCardInvoices = useMemo(() => transactions.filter(t => t.type === 'expense' && t.category === ExpenseCategory.CREDIT_CARD) as (Expense & { type: 'expense', transactionDate: string })[], [transactions]);
  
  const chartData = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense') as Expense[];
    const data = expenseTransactions.reduce((acc, expense) => {
        let categoryName: string = expense.category;
        // If it's a credit card expense, use the card's name for more detail
        if (expense.category === ExpenseCategory.CREDIT_CARD) {
            const card = creditCards.find(c => c.id === expense.creditCardId);
            // Use card name or fallback to the expense description
            categoryName = card?.name || expense.description; 
        }
        acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(data).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, creditCards]);

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const expenseToAdd = { ...newExpense, isPaid: false, dueDate: new Date(newExpense.dueDate).toISOString() };
    if(newExpense.category === ExpenseCategory.CREDIT_CARD) {
        expenseToAdd.description = creditCards.find(c => c.id === newExpense.creditCardId)?.name || 'Fatura Cartão';
    }
    addExpense(expenseToAdd);
    setAddExpenseModalOpen(false);
    setNewExpense({
        category: ExpenseCategory.CREDIT_CARD, description: '', amount: 0,
        dueDate: new Date().toISOString().split('T')[0], creditCardId: creditCards[0]?.id || ''
    });
  };

  const handleSubmitIncome = (e: React.FormEvent) => {
    e.preventDefault();
    addIncome({ ...newIncome, date: new Date(newIncome.date).toISOString(), isPaid: false });
    setAddIncomeModalOpen(false);
    setNewIncome({
      source: IncomeSource.JAY_XINGLAU, description: '', amount: 0,
      date: new Date().toISOString().split('T')[0],
    });
  };
  
  const [newRecurringExpense, setNewRecurringExpense] = useState<Omit<RecurringExpense, 'id'>>({
      category: ExpenseCategory.BILLS,
      description: '',
      amount: 0,
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0]
  });
  
  const handleAddRecurringExpense = (e: React.FormEvent) => {
      e.preventDefault();
      addRecurringExpense(newRecurringExpense);
      setNewRecurringExpense({
          category: ExpenseCategory.BILLS, description: '', amount: 0,
          frequency: 'monthly', startDate: new Date().toISOString().split('T')[0]
      });
  };

  const handleCardClick = (cardId: string | undefined) => {
    if (cardId) {
        setFilteredCardId(cardId);
        setActiveTab('transactions');
    }
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'transaction') {
        const transaction = transactions.find(t => t.id === itemToDelete.id);
        if (transaction?.type === 'income') {
            deleteIncome(itemToDelete.id);
        } else {
            deleteExpense(itemToDelete.id);
        }
    } else if (itemToDelete.type === 'card') {
        deleteCreditCard(itemToDelete.id);
    } else if (itemToDelete.type === 'recurring') {
        deleteRecurringExpense(itemToDelete.id);
    }
  };

  // Manage Cards Modal State
  const [newCard, setNewCard] = useState({ name: '', logoUrl: '' });
  const handleAddCard = () => {
    if (newCard.name.trim()) {
        addCreditCard(newCard);
        setNewCard({ name: '', logoUrl: '' });
    }
  }
  
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCard) {
        updateCreditCard(editingCard);
        setEditingCard(null);
    }
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];


  return (
    <div>
      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title={`Excluir ${itemToDelete?.type === 'transaction' ? 'Transação' : itemToDelete?.type === 'card' ? 'Cartão' : 'Despesa'}`}
        message={`Tem certeza de que deseja excluir "${itemToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
            <WalletIcon className="w-8 h-8 text-primary"/>
            <h2 className="text-3xl font-bold text-text-primary">Controle Financeiro</h2>
        </div>
        <div className="flex items-center space-x-2">
             <button onClick={() => setIsRecurringModalOpen(true)} className="flex items-center space-x-2 bg-surface hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors border border-slate-600">
                <ArrowPathIcon className="w-5 h-5"/> <span>Despesas Recorrentes</span>
            </button>
            <button onClick={() => setManageCardsModalOpen(true)} className="flex items-center space-x-2 bg-surface hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors border border-slate-600">
                <Cog6ToothIcon className="w-5 h-5"/> <span>Gerenciar Cartões</span>
            </button>
            <button onClick={() => setAddIncomeModalOpen(true)} className="flex items-center space-x-2 bg-secondary hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusCircleIcon className="w-5 h-5"/> <span>Adicionar Receita</span>
            </button>
            <button onClick={() => setAddExpenseModalOpen(true)} className="flex items-center space-x-2 bg-danger hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusCircleIcon className="w-5 h-5"/> <span>Adicionar Despesa</span>
            </button>
        </div>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard title="Receita no Período" value={formatCurrency(totalIncome)} icon={<ArrowUpCircleIcon className="w-8 h-8 text-white"/>} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
        <SummaryCard title="Despesas no Período" value={formatCurrency(totalExpenses)} icon={<ArrowDownCircleIcon className="w-8 h-8 text-white"/>} gradient="bg-gradient-to-br from-red-500 to-rose-600" />
        <SummaryCard title="Saldo do Período" value={formatCurrency(netBalance)} icon={<BanknotesIcon className="w-8 h-8 text-white"/>} gradient="bg-gradient-to-br from-indigo-500 to-purple-600" />
        <SummaryCard title="Nº de Contas" value={expenseCount} icon={<HashtagIcon className="w-8 h-8 text-white"/>} gradient="bg-gradient-to-br from-sky-500 to-blue-600" />
      </div>

      <div className="bg-surface p-6 rounded-xl shadow-lg mb-8">
          <h3 className="text-xl font-semibold mb-4 text-text-primary">Visão Geral de Despesas por Categoria</h3>
          <div style={{ width: '100%', height: 300 }}>
             {chartData.length > 0 ? (
                <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                        <YAxis stroke="#94a3b8" tickFormatter={(value) => formatCurrency(Number(value))} />
                        <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem' }} labelStyle={{ color: '#f8fafc' }} formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" name="Gasto" fill="#4f46e5" barSize={40}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-text-secondary"> <p>Nenhum dado de despesa disponível para o filtro selecionado.</p> </div>
             )}
          </div>
      </div>

       <div className="bg-surface p-4 rounded-xl shadow-lg mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <FunnelIcon className="w-5 h-5 text-text-secondary"/>
                    <label className="font-semibold text-text-primary">Filtros:</label>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-md py-1 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary">
                        <option value="all">Todos os Meses</option>
                        {availableMonths.map(month => (
                            <option key={month} value={month}>{new Date(month + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center bg-slate-700 rounded-lg p-1">
                    <button onClick={() => setSelectedType('all')} className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedType === 'all' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-slate-600'}`}>Todos</button>
                    <button onClick={() => setSelectedType('income')} className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedType === 'income' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-slate-600'}`}>Receitas</button>
                    <button onClick={() => setSelectedType('expense')} className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedType === 'expense' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-slate-600'}`}>Despesas</button>
                </div>
                <div className="flex items-center bg-slate-700 rounded-lg p-1">
                    <button onClick={() => setSelectedStatus('all')} className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedStatus === 'all' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-slate-600'}`}>Todos Status</button>
                    <button onClick={() => setSelectedStatus('unpaid')} className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedStatus === 'unpaid' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-slate-600'}`}>Pendentes</button>
                    <button onClick={() => setSelectedStatus('paid')} className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedStatus === 'paid' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-slate-600'}`}>Pagos/Recebidos</button>
                </div>
            </div>
            {filteredCardId && (
                <button onClick={() => setFilteredCardId(null)} className="py-1 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold">Limpar Filtro de Cartão</button>
            )}
       </div>


      <div className="mb-6 flex space-x-1 bg-surface p-1 rounded-lg">
        <button onClick={() => setActiveTab('invoices')} className={`w-full p-2 rounded-md font-semibold transition-colors ${activeTab === 'invoices' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-slate-700'}`}>Faturas de Cartão</button>
        <button onClick={() => setActiveTab('transactions')} className={`w-full p-2 rounded-md font-semibold transition-colors ${activeTab === 'transactions' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-slate-700'}`}>Todas as Transações</button>
      </div>
      
      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditCardInvoices.length > 0 ? creditCardInvoices.map(exp => {
                const card = creditCards.find(c => c.id === exp.creditCardId);
                return <CreditCardInvoiceCard key={exp.id} expense={exp} card={card} onClick={() => handleCardClick(exp.creditCardId)}/>
            }) : <p className="text-text-secondary col-span-full text-center py-8">Nenhuma fatura encontrada para o filtro selecionado.</p>}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
        {filteredTransactions.length > 0 ? (
            <table className="min-w-full">
                <thead className="bg-slate-900/50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-12"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Categoria/Fonte</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {filteredTransactions.map((t) => (
                    <tr key={t.id} className={`${t.isPaid ? 'bg-slate-800/80' : 'hover:bg-slate-700/50'} transition-colors duration-200`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                                {t.type === 'income' ? <ArrowUpCircleIcon className="w-6 h-6 text-green-400"/> : <ArrowDownCircleIcon className="w-6 h-6 text-red-400"/>}
                                {t.type === 'expense' && t.sourceRecurringId && <span title="Despesa Recorrente"><ArrowPathIcon className="w-4 h-4 text-slate-500" /></span>}
                            </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${t.isPaid ? 'text-slate-500' : 'text-text-primary'}`}>{new Date(t.transactionDate).toLocaleDateString('pt-BR')}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${t.isPaid ? 'text-slate-500 line-through' : 'text-text-primary'}`}>{t.description}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${t.isPaid ? 'text-slate-500' : 'text-text-primary'}`}>{t.type === 'income' ? t.source : t.category}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${t.type === 'income' ? (t.isPaid ? 'text-green-800' : 'text-green-400') : (t.isPaid ? 'text-red-800' : 'text-accent-overdue')}`}>{formatCurrency(t.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input type="checkbox" checked={t.isPaid} onChange={() => t.type === 'expense' ? toggleExpensePaid(t.id) : toggleIncomePaid(t.id)} className="form-checkbox h-5 w-5 text-primary bg-slate-700 border-slate-600 rounded focus:ring-primary cursor-pointer" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                           <button onClick={() => setEditingTransaction(t)} className="text-blue-400 hover:text-blue-300 p-2 rounded-full hover:bg-blue-500/10"><PencilIcon className="w-5 h-5"/></button>
                           <button onClick={() => setItemToDelete({ id: t.id, name: t.description, type: 'transaction' })} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10"><TrashIcon className="w-5 h-5"/></button>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
            ) : <p className="text-text-secondary text-center py-8">Nenhuma transação encontrada para o filtro selecionado.</p>}
      </div>
      )}
      
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-md shadow-2xl border border-slate-700 animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">Nova Despesa</h3>
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary">Categoria</label>
                <select value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary">
                  {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              {newExpense.category === ExpenseCategory.CREDIT_CARD ? (
                 <div>
                    <label className="block text-sm font-medium text-text-secondary">Cartão de Crédito</label>
                    <select value={newExpense.creditCardId} onChange={(e) => setNewExpense({...newExpense, creditCardId: e.target.value})} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary">
                      {creditCards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                    </select>
                </div>
              ) : (
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Descrição</label>
                    <input type="text" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" required />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-secondary">Valor (R$)</label>
                <input type="number" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Vencimento</label>
                <input type="date" value={newExpense.dueDate} onChange={(e) => setNewExpense({...newExpense, dueDate: e.target.value})} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" required />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setAddExpenseModalOpen(false)} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white rounded-lg">Cancelar</button>
                <button type="submit" className="py-2 px-4 bg-primary hover:bg-indigo-700 text-white rounded-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {isAddIncomeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">Nova Receita</h3>
            <form onSubmit={handleSubmitIncome} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary">Fonte</label>
                <select value={newIncome.source} onChange={(e) => setNewIncome({...newIncome, source: e.target.value as IncomeSource})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary">
                  {Object.values(IncomeSource).map(source => <option key={source} value={source}>{source}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Descrição</label>
                <input type="text" value={newIncome.description} onChange={(e) => setNewIncome({...newIncome, description: e.target.value})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Valor (R$)</label>
                <input type="number" step="0.01" value={newIncome.amount} onChange={e => setNewIncome({...newIncome, amount: parseFloat(e.target.value) || 0})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Data</label>
                <input type="date" value={newIncome.date} onChange={(e) => setNewIncome({...newIncome, date: e.target.value})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" required />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setAddIncomeModalOpen(false)} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">Cancelar</button>
                <button type="submit" className="py-2 px-4 bg-primary hover:bg-indigo-700 text-white rounded-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTransaction && <EditTransactionModal transaction={editingTransaction} creditCards={creditCards} onClose={() => setEditingTransaction(null)} onSave={(updated) => { updated.type === 'income' ? updateIncome(updated) : updateExpense(updated); setEditingTransaction(null); }} />}

      {isManageCardsModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-lg shadow-2xl border border-slate-700 animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">Gerenciar Cartões de Crédito</h3>
            <div className="space-y-4 mb-6">
                {creditCards.map(card => (
                    <div key={card.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg">
                       <div className="flex items-center space-x-4">
                        {card.logoUrl ? <img src={card.logoUrl} alt={card.name} className="w-8 h-8 object-contain" /> : <CreditCardIconDisplay className="w-8 h-8 text-text-secondary"/>}
                        <span className="font-semibold">{card.name}</span>
                       </div>
                       <div className="flex items-center space-x-2">
                          <button onClick={() => setEditingCard(card)} className="text-blue-400 hover:text-blue-300 p-2 rounded-full hover:bg-blue-500/10"><PencilIcon className="w-5 h-5"/></button>
                          <button onClick={() => setItemToDelete({ id: card.id, name: card.name, type: 'card' })} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10"><TrashIcon className="w-5 h-5"/></button>
                       </div>
                    </div>
                ))}
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg">
                <h4 className="font-bold mb-3 text-lg">Adicionar Novo Cartão</h4>
                <div className="flex items-center space-x-4">
                    <input type="text" placeholder="Nome do Cartão" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} className="flex-grow bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary"/>
                    <input type="text" placeholder="URL do Logo (Opcional)" value={newCard.logoUrl} onChange={e => setNewCard({...newCard, logoUrl: e.target.value})} className="flex-grow bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary"/>
                    <button onClick={handleAddCard} className="py-2 px-4 bg-primary hover:bg-indigo-700 text-white rounded-lg font-semibold">Adicionar</button>
                </div>
            </div>
            <div className="flex justify-end mt-6">
                 <button type="button" onClick={() => setManageCardsModalOpen(false)} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white rounded-lg">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {isRecurringModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-2xl shadow-2xl border border-slate-700 animate-scaleIn">
              <h3 className="text-2xl font-bold mb-6 text-text-primary">Gerenciar Despesas Recorrentes</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold mb-3 text-lg text-slate-300">Despesas Atuais</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {recurringExpenses.map(re => (
                          <div key={re.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg">
                              <div>
                                  <p className="font-semibold">{re.description}</p>
                                  <p className="text-sm text-slate-400">{formatCurrency(re.amount)} - {re.frequency === 'monthly' ? 'Mensal' : 'Anual'}</p>
                              </div>
                              <button onClick={() => setItemToDelete({ id: re.id, name: re.description, type: 'recurring' })} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10">
                                  <TrashIcon className="w-5 h-5"/>
                              </button>
                          </div>
                      ))}
                      {recurringExpenses.length === 0 && <p className="text-slate-500 text-center py-4">Nenhuma despesa recorrente cadastrada.</p>}
                  </div>
                </div>
                <div>
                   <h4 className="font-bold mb-3 text-lg text-slate-300">Adicionar Nova</h4>
                   <form onSubmit={handleAddRecurringExpense} className="space-y-4 bg-slate-900/50 p-4 rounded-lg">
                      <div>
                          <label className="block text-sm font-medium text-text-secondary">Descrição</label>
                          <input type="text" value={newRecurringExpense.description} onChange={e => setNewRecurringExpense(prev => ({...prev, description: e.target.value}))} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-text-secondary">Valor (R$)</label>
                          <input type="number" step="0.01" value={newRecurringExpense.amount} onChange={e => setNewRecurringExpense(prev => ({...prev, amount: parseFloat(e.target.value) || 0}))} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                      </div>
                      <div className="flex space-x-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-text-secondary">Frequência</label>
                          <select value={newRecurringExpense.frequency} onChange={e => setNewRecurringExpense(prev => ({...prev, frequency: e.target.value as 'monthly' | 'yearly'}))} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary">
                              <option value="monthly">Mensal</option>
                              <option value="yearly">Anual</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-text-secondary">Data de Início</label>
                          <input type="date" value={newRecurringExpense.startDate} onChange={e => setNewRecurringExpense(prev => ({...prev, startDate: e.target.value}))} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                        </div>
                      </div>
                      <div className="pt-2">
                        <button type="submit" className="w-full py-2 px-4 bg-primary hover:bg-indigo-700 text-white rounded-lg font-semibold">Adicionar Despesa Recorrente</button>
                      </div>
                   </form>
                </div>
              </div>
               <div className="flex justify-end mt-8">
                   <button type="button" onClick={() => setIsRecurringModalOpen(false)} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white rounded-lg">Fechar</button>
              </div>
          </div>
        </div>
      )}

      {editingCard && (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-lg shadow-2xl border border-slate-700 animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">Editar Cartão</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Nome do Cartão</label>
                    <input type="text" value={editingCard.name} onChange={e => setEditingCard({...editingCard, name: e.target.value})} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary">URL do Logo (Opcional)</label>
                    <input type="text" value={editingCard.logoUrl || ''} onChange={e => setEditingCard({...editingCard, logoUrl: e.target.value})} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={() => setEditingCard(null)} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white rounded-lg">Cancelar</button>
                    <button type="submit" className="py-2 px-4 bg-primary hover:bg-indigo-700 text-white rounded-lg">Salvar Alterações</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface EditTransactionModalProps {
    transaction: Transaction;
    creditCards: CreditCard[];
    onClose: () => void;
    onSave: (transaction: Transaction) => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, creditCards, onClose, onSave }) => {
    const [formData, setFormData] = useState(transaction);

    useEffect(() => {
        setFormData(transaction);
    }, [transaction]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value, transactionDate: new Date(value).toISOString() }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const isIncome = formData.type === 'income';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-surface rounded-lg p-8 w-full max-w-md shadow-2xl animate-scaleIn">
                <h3 className="text-2xl font-bold mb-6 text-text-primary">Editar {isIncome ? 'Receita' : 'Despesa'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isIncome ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Fonte</label>
                                <select name="source" value={formData.source} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary">
                                    {Object.values(IncomeSource).map(source => <option key={source} value={source}>{source}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Data</label>
                                <input type="date" name="date" value={new Date(formData.date).toISOString().split('T')[0]} onChange={handleDateChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Categoria</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary">
                                    {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                             {formData.category === ExpenseCategory.CREDIT_CARD && (
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary">Cartão</label>
                                    <select name="creditCardId" value={formData.creditCardId} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary">
                                        {creditCards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Vencimento</label>
                                <input type="date" name="dueDate" value={new Date(formData.dueDate).toISOString().split('T')[0]} onChange={handleDateChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Descrição</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Valor (R$)</label>
                        <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-primary hover:bg-indigo-700 rounded-lg">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FinancialControl;