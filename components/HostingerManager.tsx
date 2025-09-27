
import React, { useMemo, useState, useEffect } from 'react';
import { Income, IncomeSource } from '../types';
import { PageConfig } from '../App';
import { HostingerLogoIcon, BanknotesIcon, HashtagIcon, ArrowPathIcon, Cog6ToothIcon, PlusCircleIcon } from './Icons';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HostingerManagerProps {
  incomes: Income[];
  addIncome: (income: Omit<Income, 'id'>) => void;
  syncHostingerData: () => Promise<void>;
  isSyncing: boolean;
  syncError: string | null;
  pageConfig: PageConfig;
  updatePageConfig: (newConfig: Partial<PageConfig>) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
  <div className="bg-surface p-6 rounded-xl shadow-lg flex items-center space-x-4">
    <div className="p-3 rounded-full bg-primary/20">
      {icon}
    </div>
    <div>
      <p className="text-text-secondary text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  </div>
);

const HostingerManager: React.FC<HostingerManagerProps> = ({ incomes, addIncome, syncHostingerData, isSyncing, syncError, pageConfig, updatePageConfig }) => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddManualModalOpen, setAddManualModalOpen] = useState(false);
  
  const [currentConfig, setCurrentConfig] = useState(pageConfig);
  const [newIncome, setNewIncome] = useState({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setCurrentConfig(pageConfig);
  }, [pageConfig]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePageConfig(currentConfig);
    setIsSettingsModalOpen(false);
  };
    
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIncome({
      ...newIncome,
      source: IncomeSource.HOSTINGER,
      date: new Date(newIncome.date).toISOString(),
      isPaid: true
    });
    setAddManualModalOpen(false);
    setNewIncome({ description: '', amount: 0, date: new Date().toISOString().split('T')[0] });
  };
    
  const hostingerIncomes = useMemo(() => 
    incomes
      .filter(i => i.source === IncomeSource.HOSTINGER)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [incomes]
  );
  
  const totalIncome = useMemo(() => 
    hostingerIncomes.reduce((acc, i) => acc + i.amount, 0),
    [hostingerIncomes]
  );

  const monthlyData = useMemo(() => {
    const dataByMonth: { [key: string]: number } = {};
    hostingerIncomes.forEach(income => {
        const month = new Date(income.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        dataByMonth[month] = (dataByMonth[month] || 0) + income.amount;
    });
    // We need to ensure the data is sorted chronologically for the line chart
    const sortedMonths = Object.keys(dataByMonth).sort((a, b) => {
        const [m1, y1] = a.split('/');
        const [m2, y2] = b.split('/');
        const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
        return (parseInt(y2) - parseInt(y1)) || (months.indexOf(m2) - months.indexOf(m1));
    }).reverse();

    return sortedMonths.map(month => ({ name: month, Ganhos: dataByMonth[month] }));
}, [hostingerIncomes]);


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
            {pageConfig.logo ? (
                <img src={pageConfig.logo} alt={`${pageConfig.name} Logo`} className="w-8 h-8 object-contain" />
            ) : (
                <HostingerLogoIcon className="w-8 h-8 text-secondary"/>
            )}
            <h2 className="text-3xl font-bold text-text-primary">{pageConfig.name}</h2>
        </div>
        <div className="flex items-center space-x-4">
             <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-full text-text-secondary hover:bg-slate-700 hover:text-text-primary transition-colors"
              aria-label="Configurações"
            >
              <Cog6ToothIcon className="w-6 h-6" />
            </button>
             <button
              onClick={() => setAddManualModalOpen(true)}
              className="flex items-center space-x-2 bg-secondary hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <PlusCircleIcon className="w-5 h-5"/>
                <span>Adicionar Manualmente</span>
            </button>
            <button
              onClick={syncHostingerData}
              disabled={isSyncing}
              className="flex items-center space-x-2 bg-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin"/>
              ) : (
                <ArrowPathIcon className="w-5 h-5"/>
              )}
              <span>{isSyncing ? 'Sincronizando...' : `Sincronizar`}</span>
            </button>
        </div>
      </div>

      {syncError && (
          <div className="bg-rose-900/50 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-lg relative mb-6 shadow-lg shadow-rose-900/50" role="alert">
            <strong className="font-bold text-rose-100">Erro: </strong>
            <span className="block sm:inline">{syncError}</span>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="Ganhos Totais" value={formatCurrency(totalIncome)} icon={<BanknotesIcon className="w-6 h-6 text-primary"/>} />
        <SummaryCard title="Nº de Comissões" value={hostingerIncomes.length} icon={<HashtagIcon className="w-6 h-6 text-primary"/>} />
        <SummaryCard title="Média por Comissão" value={hostingerIncomes.length > 0 ? formatCurrency(totalIncome / hostingerIncomes.length) : formatCurrency(0)} icon={<BanknotesIcon className="w-6 h-6 text-primary"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-surface p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-text-primary">Ganhos Mensais</h3>
          <div style={{ width: '100%', height: 300 }}>
             {monthlyData.length > 0 ? (
                <ResponsiveContainer>
                    <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                        <YAxis stroke="#94a3b8" tickFormatter={(value) => formatCurrency(Number(value))} />
                        <Tooltip 
                            cursor={{stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '3 3'}} 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem' }} 
                            labelStyle={{ color: '#f8fafc' }} 
                            formatter={(value: number) => [formatCurrency(value), "Ganhos"]}
                        />
                        <Legend wrapperStyle={{ color: '#94a3b8' }}/>
                        <Line type="monotone" dataKey="Ganhos" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} dot={{r: 4}}/>
                    </LineChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                    <p>Nenhum dado de receita da {pageConfig.name} para exibir. Tente sincronizar.</p>
                </div>
             )}
          </div>
        </div>
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl shadow-lg">
           <h3 className="text-xl font-semibold mb-4 text-text-primary">Últimas Comissões</h3>
            <div className="overflow-y-auto max-h-[300px]">
                {hostingerIncomes.length > 0 ? (
                    <ul className="space-y-2">
                    {hostingerIncomes.map(income => (
                        <li key={income.id} className="flex justify-between items-center text-sm transition-colors duration-200 p-3 rounded-md hover:bg-slate-700/50">
                        <div>
                            <p className="font-medium text-text-primary">{income.description}</p>
                            <p className="text-text-secondary">{new Date(income.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <span className="font-bold text-lg text-green-400">{formatCurrency(income.amount)}</span>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-text-secondary text-center py-4">Nenhuma comissão da {pageConfig.name} registrada.</p>
                )}
            </div>
        </div>
      </div>

      {isAddManualModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">Adicionar Comissão Manual</h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Descrição</label>
                    <input type="text" value={newIncome.description} onChange={e => setNewIncome({...newIncome, description: e.target.value})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Valor (R$)</label>
                    <input type="number" step="0.01" value={newIncome.amount} onChange={e => setNewIncome({...newIncome, amount: parseFloat(e.target.value) || 0})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Data</label>
                    <input type="date" value={newIncome.date} onChange={e => setNewIncome({...newIncome, date: e.target.value})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={() => setAddManualModalOpen(false)} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancelar</button>
                    <button type="submit" className="py-2 px-4 bg-primary hover:bg-indigo-700 rounded-lg">Salvar</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {isSettingsModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-lg shadow-2xl border border-slate-700 animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">Configurações da Página</h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Nome da Página</label>
                    <input 
                      type="text" 
                      value={currentConfig.name} 
                      onChange={e => setCurrentConfig(prev => ({...prev, name: e.target.value}))} 
                      className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">URL do Logo</label>
                    <input 
                      type="text" 
                      value={currentConfig.logo} 
                      onChange={e => setCurrentConfig(prev => ({...prev, logo: e.target.value}))} 
                      className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" 
                      placeholder="https://exemplo.com/logo.png"
                    />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={() => setIsSettingsModalOpen(false)} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white rounded-lg">Cancelar</button>
                    <button type="submit" className="py-2 px-4 bg-primary hover:bg-indigo-700 text-white rounded-lg">Salvar</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostingerManager;
