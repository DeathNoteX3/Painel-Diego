import React, { useState, useMemo, useEffect } from 'react';
import { Income, IncomeSource } from '../types';
import { PageConfig } from '../App';
import { PlusCircleIcon, PencilIcon, BanknotesIcon, VideoCameraIcon, HashtagIcon, TrashIcon, Cog6ToothIcon } from './Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ConfirmationModal from './ConfirmationModal';

interface JayManagerProps {
  incomes: Income[];
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (income: Income) => void;
  deleteIncome: (id: string) => void;
  toggleIncomePaid: (id: string) => void;
  fixedRate: number;
  updateFixedRate: (newRate: number) => void;
  pageConfig: PageConfig;
  updatePageConfig: (newConfig: Partial<PageConfig>) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
  <div className="bg-surface p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-transform duration-300 hover:scale-105">
    <div className="p-3 rounded-full bg-primary/20">{icon}</div>
    <div>
      <p className="text-text-secondary text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  </div>
);

const JayManager: React.FC<JayManagerProps> = ({ incomes, addIncome, updateIncome, deleteIncome, toggleIncomePaid, fixedRate, updateFixedRate, pageConfig, updatePageConfig }) => {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditRateModalOpen, setEditRateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  
  const [newVideo, setNewVideo] = useState({ description: '', date: new Date().toISOString().split('T')[0] });
  const [newRate, setNewRate] = useState(fixedRate);
  const [currentConfig, setCurrentConfig] = useState(pageConfig);
  
  useEffect(() => {
    setCurrentConfig(pageConfig);
  }, [pageConfig]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePageConfig(currentConfig);
    setIsSettingsModalOpen(false);
  };

  const { total, toReceive, videosThisMonth } = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return incomes.reduce((acc, income) => {
      const incomeDate = new Date(income.date);
      acc.total += income.amount;
      if (!income.isPaid) {
        acc.toReceive += income.amount;
      }
      if (incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear) {
        acc.videosThisMonth += 1;
      }
      return acc;
    }, { total: 0, toReceive: 0, videosThisMonth: 0 });
  }, [incomes]);

  const monthlyData = useMemo(() => {
    const dataByMonth = incomes.reduce((acc, income) => {
        const month = new Date(income.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const sortedMonths = Object.keys(dataByMonth).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
    return sortedMonths.map(month => ({ name: month, Vídeos: dataByMonth[month] }));
}, [incomes]);


  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIncome({
      ...newVideo,
      source: IncomeSource.JAY_XINGLAU,
      amount: fixedRate,
      date: new Date(newVideo.date).toISOString(),
      isPaid: false
    });
    setAddModalOpen(false);
    setNewVideo({ description: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIncome) {
      updateIncome({
          ...editingIncome,
          date: new Date(editingIncome.date).toISOString()
      });
      setEditingIncome(null);
    }
  };
  
  const confirmDelete = () => {
    if (incomeToDelete) {
      deleteIncome(incomeToDelete.id);
    }
  };
  
  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFixedRate(newRate);
    setEditRateModalOpen(false);
  };
  
  useEffect(() => {
    if(!isAddModalOpen){
        setNewVideo({ description: '', date: new Date().toISOString().split('T')[0] });
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    if(!editingIncome){
        setEditingIncome(null);
    }
  }, [editingIncome]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <div>
      <ConfirmationModal
        isOpen={!!incomeToDelete}
        onClose={() => setIncomeToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir Registro"
        message={`Tem certeza que deseja excluir o registro "${incomeToDelete?.description}"? Esta ação não pode ser desfeita.`}
      />
      <div className="flex justify-between items-center mb-6 pr-16">
        <div className="flex items-center space-x-3">
          {pageConfig.logo ? (
             <img src={pageConfig.logo} alt={`${pageConfig.name} Logo`} className="w-8 h-8 object-contain" />
          ) : (
            <VideoCameraIcon className="w-8 h-8 text-indigo-400"/>
          )}
          <h2 className="text-3xl font-bold text-text-primary">Ganhos: {pageConfig.name}</h2>
        </div>
        <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-full text-text-secondary hover:bg-slate-700 hover:text-text-primary transition-colors"
              aria-label="Configurações"
            >
              <Cog6ToothIcon className="w-6 h-6" />
            </button>
            <button onClick={() => setEditRateModalOpen(true)} className="flex items-center space-x-2 bg-surface hover:bg-slate-700/70 text-text-primary font-medium py-2 px-4 rounded-lg transition-colors border border-slate-600">
                <PencilIcon className="w-5 h-5"/> <span>Editar Taxa ({formatCurrency(fixedRate)})</span>
            </button>
            <button onClick={() => setAddModalOpen(true)} className="flex items-center space-x-2 bg-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusCircleIcon className="w-5 h-5"/> <span>Adicionar Vídeo</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pr-16">
        <SummaryCard title="Ganhos Totais" value={formatCurrency(total)} icon={<BanknotesIcon className="w-6 h-6 text-primary"/>} />
        <SummaryCard title="A Receber" value={formatCurrency(toReceive)} icon={<BanknotesIcon className="w-6 h-6 text-yellow-400"/>} />
        <SummaryCard title="Vídeos este Mês" value={videosThisMonth} icon={<HashtagIcon className="w-6 h-6 text-primary"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pr-16">
        <div className="lg:col-span-3 bg-surface p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-text-primary">Produtividade Mensal</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem' }} labelStyle={{ color: '#f8fafc' }} formatter={(value) => [`${value} vídeos`, "Total"]} />
                <Bar dataKey="Vídeos" fill="#4f46e5" barSize={30}>
                    {monthlyData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl shadow-lg">
           <h3 className="text-xl font-semibold mb-4 text-text-primary">Histórico de Trabalhos</h3>
            <div className="overflow-y-auto max-h-[350px]">
                {incomes.length > 0 ? (
                    <table className="min-w-full">
                         <thead className="bg-slate-900/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Descrição</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                        {incomes.map(income => (
                            <tr key={income.id} className={`${income.isPaid ? 'bg-slate-800/50' : 'hover:bg-slate-700/50'}`}>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm ${income.isPaid ? 'text-slate-500 line-through' : 'text-text-primary'}`}>
                                    <p className="font-medium">{income.description}</p>
                                    <p className={`text-xs ${income.isPaid ? 'text-slate-600' : 'text-text-secondary'}`}>{new Date(income.date).toLocaleDateString('pt-BR')}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <span onClick={() => toggleIncomePaid(income.id)} className={`text-xs font-bold py-1 px-3 rounded-full transition-colors cursor-pointer ${income.isPaid ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-900 text-amber-300 hover:bg-amber-800'}`}>
                                        {income.isPaid ? 'Pago' : 'Pendente'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setEditingIncome(income)} className="text-blue-400 hover:text-blue-300 p-2 rounded-full hover:bg-blue-500/10"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setIncomeToDelete(income)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-text-secondary text-center py-4">Nenhum vídeo registrado.</p>
                )}
            </div>
        </div>
      </div>
      
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

      {isAddModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">Adicionar Novo Vídeo</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Descrição</label>
                    <input type="text" value={newVideo.description} onChange={e => setNewVideo({...newVideo, description: e.target.value})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Data</label>
                    <input type="date" value={newVideo.date} onChange={e => setNewVideo({...newVideo, date: e.target.value})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                </div>
                <div className="text-text-secondary pt-2">Valor Fixo: <span className="font-bold text-green-400">{formatCurrency(fixedRate)}</span></div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={() => setAddModalOpen(false)} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancelar</button>
                    <button type="submit" className="py-2 px-4 bg-primary hover:bg-indigo-700 rounded-lg">Salvar</button>
                </div>
            </form>
          </div>
        </div>
      )}
      {editingIncome && (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">Editar Registro</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Descrição</label>
                    <input type="text" value={editingIncome.description} onChange={e => setEditingIncome({...editingIncome, description: e.target.value})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Data</label>
                    <input type="date" value={editingIncome.date.split('T')[0]} onChange={e => setEditingIncome({...editingIncome, date: e.target.value})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                </div>
                <div className="text-text-secondary pt-2">Valor Fixo: <span className="font-bold text-green-400">{formatCurrency(editingIncome.amount)}</span></div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={() => setEditingIncome(null)} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancelar</button>
                    <button type="submit" className="py-2 px-4 bg-primary hover:bg-indigo-700 rounded-lg">Salvar Alterações</button>
                </div>
            </form>
          </div>
        </div>
      )}
      {isEditRateModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">Editar Taxa Fixa por Vídeo</h3>
            <form onSubmit={handleRateSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Nova Taxa (R$)</label>
                    <input type="number" step="0.01" value={newRate} onChange={e => setNewRate(parseFloat(e.target.value) || 0)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary" required />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={() => setEditRateModalOpen(false)} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancelar</button>
                    <button type="submit" className="py-2 px-4 bg-primary hover:bg-indigo-700 rounded-lg">Atualizar</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JayManager;