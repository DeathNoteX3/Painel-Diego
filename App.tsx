

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Income, Expense, CalendarEvent, Note, View, IncomeSource, ExpenseCategory, CreditCard, Notification, RecurringExpense } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FinancialControl from './components/FinancialControl';
import Calendar from './components/Calendar';
import NotesManager from './components/NotesManager';
import HostingerManager from './components/HostingerManager';
import JayManager from './components/JayManager';
import HamiltonManager from './components/HamiltonManager';
import NotificationsPopover from './components/NotificationsPopover';
import { BellIcon } from './components/Icons';

export interface PageConfig {
  name: string;
  logo: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [pageConfigs, setPageConfigs] = useState<Record<string, PageConfig>>({
    jay: { name: 'Jay (Xinglau)', logo: '' },
    hamilton: { name: 'Eventos (Hamilton)', logo: '' },
    hostinger: { name: 'Hostinger', logo: 'https://cdn.worldvectorlogo.com/logos/hostinger.svg' }
  });

  const updatePageConfig = useCallback((view: 'jay' | 'hamilton' | 'hostinger', newConfig: Partial<PageConfig>) => {
    setPageConfigs(prev => ({
        ...prev,
        [view]: { ...prev[view], ...newConfig }
    }));
  }, []);
  

  // --- MOCK DATA & API State ---
  const [creditCards, setCreditCards] = useState<CreditCard[]>([
    { id: 'cc1', name: 'CARTÃO NUBANK', logoUrl: 'https://logospng.org/download/nubank/logo-nubank-icon-1024.png' },
    { id: 'cc2', name: 'CARTÃO CASAS BAHIA' },
    { id: 'cc3', name: 'CARTÃO CVC PRETO' },
    { id: 'cc4', name: 'CARTÃO EXTRA' },
    { id: 'cc5', name: 'CARTÃO PERNAMBUCANAS' },
    { id: 'cc6', name: 'CARTÃO SANTANDER' },
    { id: 'cc7', name: 'CARTÃO SICREDI' },
  ]);

  const [incomes, setIncomes] = useState<Income[]>([
    { id: '1', source: IncomeSource.JAY_XINGLAU, description: 'Edição vídeo 1 (Jan)', amount: 45, date: new Date(2024, 0, 15).toISOString(), isPaid: true },
    { id: '2', source: IncomeSource.JAY_XINGLAU, description: 'Edição vídeo 2 (Jan)', amount: 45, date: new Date(2024, 0, 28).toISOString(), isPaid: true },
    { id: '3', source: IncomeSource.JAY_XINGLAU, description: 'Edição vídeo 1 (Fev)', amount: 45, date: new Date(2024, 1, 18).toISOString(), isPaid: true },
    { id: '4', source: IncomeSource.JAY_XINGLAU, description: 'Edição vídeo 1 (Mar)', amount: 45, date: new Date().toISOString(), isPaid: false },
    { id: '5', source: IncomeSource.EVENTS, description: 'Casamento S&J', amount: 1200, date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), isPaid: true },
    { id: '6', source: IncomeSource.EVENTS, description: 'Aniversário 15 anos', amount: 850, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), isPaid: false },
    { id: '7', source: IncomeSource.EVENTS, description: 'Festa Corporativa', amount: 1500, date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), isPaid: true },
  ]);

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([
    { id: 're1', category: ExpenseCategory.BILLS, description: 'Internet Fibra', amount: 99.90, frequency: 'monthly', startDate: '2024-01-10' },
    { id: 're2', category: ExpenseCategory.SUPPLIES, description: 'Adobe Creative Cloud', amount: 275, frequency: 'monthly', startDate: '2024-01-15' },
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    // { id: 'e1', category: ExpenseCategory.BILLS, description: 'Internet Fibra', amount: 99.90, dueDate: new Date().toISOString(), isPaid: false },
    { id: 'e2', category: ExpenseCategory.CREDIT_CARD, description: 'Fatura Nubank', creditCardId: 'cc1', amount: 5.00, dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), isPaid: false },
    // { id: 'e3', category: ExpenseCategory.SUPPLIES, description: 'Adobe Creative Cloud', amount: 275, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), isPaid: true },
    { id: 'e4', category: ExpenseCategory.CREDIT_CARD, description: 'Fatura Casas Bahia', creditCardId: 'cc2', amount: 104.12, dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), isPaid: false }, // Overdue
    { id: 'e5', category: ExpenseCategory.CREDIT_CARD, description: 'Fatura CVC', creditCardId: 'cc3', amount: 252.00, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), isPaid: true }, // Paid
    { id: 'e6', category: ExpenseCategory.CREDIT_CARD, description: 'Fatura Extra', creditCardId: 'cc4', amount: 80.73, dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), isPaid: false },
    { id: 'e7', category: ExpenseCategory.CREDIT_CARD, description: 'Fatura Pernambucanas', creditCardId: 'cc5', amount: 543.47, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), isPaid: false },
    { id: 'e8', category: ExpenseCategory.CREDIT_CARD, description: 'Fatura Santander', creditCardId: 'cc6', amount: 292.79, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), isPaid: false }, // Overdue
    { id: 'e9', category: ExpenseCategory.CREDIT_CARD, description: 'Fatura Sicredi', creditCardId: 'cc7', amount: 320.00, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), isPaid: false },
  ]);

  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: 'Entrega vídeo - Jay', date: new Date().toISOString(), description: 'Finalizar e enviar o vídeo para o canal Xinglau' },
    { id: '2', title: 'Reunião Casamento M&L', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), description: 'Alinhar detalhes da gravação' },
  ]);

  const [notes, setNotes] = useState<Note[]>([
    { id: '1', title: 'Ideias para canal', content: '1. Fazer um vídeo sobre color grading.\n2. Tutorial de transições.', createdAt: new Date().toISOString() },
  ]);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const [jayFixedRate, setJayFixedRate] = useState(45);
  
  const updateJayFixedRate = useCallback((newRate: number) => {
    setJayFixedRate(newRate);
  }, []);

  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const allNotifications: Notification[] = [];

    expenses.filter(e => !e.isPaid && new Date(e.dueDate) < today).forEach(e => {
        allNotifications.push({
            id: `exp-overdue-${e.id}`,
            type: 'overdue',
            message: `${e.description} está atrasada!`,
            date: e.dueDate,
            creditCardId: e.category === ExpenseCategory.CREDIT_CARD ? e.creditCardId : undefined,
        });
    });

    events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= today && eventDate <= sevenDaysFromNow;
    }).forEach(e => {
        allNotifications.push({
            id: `evt-upcoming-${e.id}`, type: 'event', message: `Evento: ${e.title}`, date: e.date,
        });
    });
    
    expenses.filter(e => {
        const dueDate = new Date(e.dueDate);
        return !e.isPaid && dueDate >= today && dueDate <= sevenDaysFromNow;
    }).forEach(e => {
        allNotifications.push({
            id: `exp-upcoming-${e.id}`,
            type: 'upcoming_bill',
            message: `Vencimento: ${e.description}`,
            date: e.dueDate,
            creditCardId: e.category === ExpenseCategory.CREDIT_CARD ? e.creditCardId : undefined,
        });
    });

    return allNotifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [expenses, events]);

  const syncHostingerData = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    const apiKey = "3D2UVsqX8zzB83HNy4vswEyOHA8dBQBicpdmnHl5c66e048f";
    if (!apiKey) {
        setSyncError('A chave da API Hostinger não está configurada.');
        setIsSyncing(false);
        return;
    }
    try {
      const response = await fetch('https://api.hostinger.com/affiliates/v1/commissions', { headers: { 'Authorization': `Bearer ${apiKey}` } });
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      } 
      const data = await response.json();
      const newCommissions: Income[] = data.commissions.map((c: any) => ({
        id: `hostinger-${c.id}`, source: IncomeSource.HOSTINGER, description: c.description || `Comissão #${c.id}`,
        amount: parseFloat(c.amount), date: new Date(c.created_at).toISOString(), isPaid: true
      }));
      setIncomes(prev => [...prev.filter(i => i.source !== IncomeSource.HOSTINGER), ...newCommissions]);
    } catch (error) {
      console.warn("A sincronização com a API Hostinger falhou. Usando dados de simulação.", error);
      const mockData = {
          commissions: [
              { id: 'h1', description: 'Comissão de indicação #1', amount: 150, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'h2', description: 'Comissão de indicação #2', amount: 125, created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'h3', description: 'Comissão de indicação #3', amount: 180, created_at: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString() },
          ]
      };
      const newCommissions: Income[] = mockData.commissions.map((c: any) => ({
        id: `hostinger-${c.id}`, source: IncomeSource.HOSTINGER, description: c.description || `Comissão #${c.id}`,
        amount: parseFloat(c.amount), date: new Date(c.created_at).toISOString(), isPaid: true,
      }));
      setIncomes(prev => [...prev.filter(i => i.source !== IncomeSource.HOSTINGER), ...newCommissions]);
      setSyncError('Falha na sincronização. Exibindo dados de exemplo.');
    } finally { 
        setIsSyncing(false); 
    }
  }, []);

  const addIncome = useCallback((income: Omit<Income, 'id'>) => {
    setIncomes(prev => [...prev, { ...income, id: Date.now().toString() }]);
  }, []);
  
  const updateIncome = useCallback((updatedIncome: Income) => {
    setIncomes(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  }, []);

  const toggleIncomePaid = useCallback((id: string) => {
    setIncomes(prev => prev.map(i => (i.id === id ? { ...i, isPaid: !i.isPaid } : i)));
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: Date.now().toString() }]);
  }, []);
  
  const updateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);
  
  const addRecurringExpense = useCallback((expense: Omit<RecurringExpense, 'id'>) => {
    setRecurringExpenses(prev => [...prev, { ...expense, id: Date.now().toString() }]);
  }, []);

  const deleteRecurringExpense = useCallback((id: string) => {
    setRecurringExpenses(prev => prev.filter(re => re.id !== id));
  }, []);

  const addCreditCard = useCallback((card: Omit<CreditCard, 'id'>) => {
    setCreditCards(prev => [...prev, { ...card, id: Date.now().toString() }]);
  }, []);
  
  const updateCreditCard = useCallback((updatedCard: CreditCard) => {
    setCreditCards(prev => prev.map(card => card.id === updatedCard.id ? updatedCard : card));
  }, []);

  const deleteCreditCard = useCallback((id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleExpensePaid = useCallback((id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, isPaid: !e.isPaid } : e));
  }, []);

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...event, id: Date.now().toString() }]);
  }, []);

  const addNote = useCallback((note: Omit<Note, 'id'>) => {
    setNotes(prev => [...prev, { ...note, id: Date.now().toString(), createdAt: new Date().toISOString() }]);
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  }, []);

  const generateExpensesFromRecurring = useCallback(() => {
    const today = new Date();
    const newGeneratedExpenses: Omit<Expense, 'id'>[] = [];

    recurringExpenses.forEach(re => {
      let nextDueDate = new Date(re.startDate);
      
      while(nextDueDate <= today) {
        const dueDateMonth = nextDueDate.getMonth();
        const dueDateYear = nextDueDate.getFullYear();

        const alreadyExists = expenses.some(e => 
          e.sourceRecurringId === re.id && 
          new Date(e.dueDate).getMonth() === dueDateMonth &&
          new Date(e.dueDate).getFullYear() === dueDateYear
        );
        
        if(!alreadyExists) {
            newGeneratedExpenses.push({
              category: re.category,
              description: re.description,
              amount: re.amount,
              dueDate: nextDueDate.toISOString(),
              isPaid: false,
              creditCardId: re.creditCardId,
              sourceRecurringId: re.id,
            });
        }
        
        if (re.frequency === 'monthly') {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        } else if (re.frequency === 'yearly') {
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        } else {
            break; // Should not happen
        }
      }
    });

    if (newGeneratedExpenses.length > 0) {
      setExpenses(prev => [...prev, ...newGeneratedExpenses.map(e => ({...e, id: `gen-${Math.random()}`}))]);
    }
  }, [recurringExpenses, expenses]);

  useEffect(() => {
    generateExpensesFromRecurring();
  }, [recurringExpenses]);


  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard incomes={incomes} expenses={expenses} events={events} creditCards={creditCards} />;
      case 'jay':
        return <JayManager 
                  incomes={incomes.filter(i => i.source === IncomeSource.JAY_XINGLAU)}
                  addIncome={addIncome}
                  updateIncome={updateIncome}
                  deleteIncome={deleteIncome}
                  toggleIncomePaid={toggleIncomePaid}
                  fixedRate={jayFixedRate}
                  updateFixedRate={updateJayFixedRate}
                  pageConfig={pageConfigs.jay}
                  updatePageConfig={(config) => updatePageConfig('jay', config)}
               />;
      case 'hamilton':
        return <HamiltonManager 
                  incomes={incomes.filter(i => i.source === IncomeSource.EVENTS)}
                  addIncome={addIncome}
                  updateIncome={updateIncome}
                  deleteIncome={deleteIncome}
                  toggleIncomePaid={toggleIncomePaid}
                  pageConfig={pageConfigs.hamilton}
                  updatePageConfig={(config) => updatePageConfig('hamilton', config)}
                />;
      case 'hostinger':
        return <HostingerManager 
                  incomes={incomes} 
                  addIncome={addIncome}
                  syncHostingerData={syncHostingerData} 
                  isSyncing={isSyncing} 
                  syncError={syncError}
                  pageConfig={pageConfigs.hostinger}
                  updatePageConfig={(config) => updatePageConfig('hostinger', config)}
                />;
      case 'financialControl':
        return <FinancialControl 
                  incomes={incomes}
                  expenses={expenses} 
                  addIncome={addIncome}
                  updateIncome={updateIncome}
                  deleteIncome={deleteIncome}
                  addExpense={addExpense} 
                  updateExpense={updateExpense}
                  deleteExpense={deleteExpense}
                  toggleExpensePaid={toggleExpensePaid}
                  toggleIncomePaid={toggleIncomePaid} 
                  creditCards={creditCards} 
                  addCreditCard={addCreditCard} 
                  deleteCreditCard={deleteCreditCard} 
                  updateCreditCard={updateCreditCard}
                  recurringExpenses={recurringExpenses}
                  addRecurringExpense={addRecurringExpense}
                  deleteRecurringExpense={deleteRecurringExpense}
              />;
      case 'calendar':
        return <Calendar events={events} addEvent={addEvent} />;
      case 'notes':
        return <NotesManager notes={notes} addNote={addNote} deleteNote={deleteNote} />;
      default:
        return <Dashboard incomes={incomes} expenses={expenses} events={events} creditCards={creditCards} />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-primary">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        pageConfigs={pageConfigs}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
         <div className="absolute top-6 right-10 z-30">
            <button
              onClick={() => setIsNotificationsOpen(prev => !prev)}
              className="relative p-2 rounded-full text-text-secondary bg-surface hover:bg-slate-700 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary transition-all"
            >
              <BellIcon className="w-6 h-6" />
              {notifications.length > 0 && (
                 <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {notifications.length}
                </span>
              )}
            </button>
            {isNotificationsOpen && (
              <NotificationsPopover 
                notifications={notifications}
                creditCards={creditCards}
                onClose={() => setIsNotificationsOpen(false)} 
              />
            )}
        </div>
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div key={currentView} className="animate-fadeIn">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;