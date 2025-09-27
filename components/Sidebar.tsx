

import React from 'react';
import { View } from '../types';
import { PageConfig } from '../App';
import { ChartPieIcon, WalletIcon, GlobeAltIcon, CalendarIcon, PencilSquareIcon, VideoCameraIcon, UserGroupIcon } from './Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  pageConfigs: Record<string, PageConfig>;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, pageConfigs }) => {
  
  const navItems = [
    { view: 'dashboard' as View, label: 'Dashboard', icon: <ChartPieIcon className="w-6 h-6" /> },
    { 
      view: 'jay' as View, 
      label: pageConfigs.jay.name, 
      icon: pageConfigs.jay.logo ? 
            <img src={pageConfigs.jay.logo} alt={pageConfigs.jay.name} className="w-6 h-6 object-contain" /> : 
            <VideoCameraIcon className="w-6 h-6" /> 
    },
    { 
      view: 'hamilton' as View, 
      label: pageConfigs.hamilton.name, 
      icon: pageConfigs.hamilton.logo ? 
            <img src={pageConfigs.hamilton.logo} alt={pageConfigs.hamilton.name} className="w-6 h-6 object-contain" /> : 
            <UserGroupIcon className="w-6 h-6" /> 
    },
    { 
      view: 'hostinger' as View, 
      label: pageConfigs.hostinger.name, 
      icon: pageConfigs.hostinger.logo ? 
            <img src={pageConfigs.hostinger.logo} alt={pageConfigs.hostinger.name} className="w-6 h-6 object-contain" /> : 
            <GlobeAltIcon className="w-6 h-6" /> 
    },
    { view: 'financialControl' as View, label: 'Controle Financeiro', icon: <WalletIcon className="w-6 h-6" /> },
    { view: 'calendar' as View, label: 'Agenda', icon: <CalendarIcon className="w-6 h-6" /> },
    { view: 'notes' as View, label: 'Anotações', icon: <PencilSquareIcon className="w-6 h-6" /> },
  ];

  return (
    <aside className="w-64 bg-surface p-6 flex flex-col justify-between relative">
      <div>
        <div className="mb-10">
            <h1 className="text-xl font-bold text-white leading-tight">Painel de controle Diego</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors duration-200 ${
                currentView === item.view
                  ? 'bg-primary text-white shadow-lg'
                  // eslint-disable-next-line @typescript-eslint/no-base-to-string
                  : `text-text-secondary hover:bg-slate-700 hover:text-white`
              }`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                {item.icon}
                <span className="font-medium truncate">{item.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>
      <div className="text-center text-xs text-text-secondary">
        <p>&copy; {new Date().getFullYear()} Painel de controle Diego</p>
      </div>
    </aside>
  );
};

export default Sidebar;