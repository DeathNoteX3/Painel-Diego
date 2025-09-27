import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './Icons';

interface CalendarProps {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, addEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState({ title: '', description: '' });

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleOpenModal = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({ ...newEvent, date: selectedDate.toISOString() });
    setIsModalOpen(false);
    setNewEvent({ title: '', description: '' });
  };

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getDate() === d2.getDate();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-8 h-8 text-indigo-400" />
          <h2 className="text-3xl font-bold text-text-primary">Agenda</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-surface"><ChevronLeftIcon className="w-6 h-6" /></button>
          <h3 className="text-xl font-semibold w-40 text-center">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-surface"><ChevronRightIcon className="w-6 h-6" /></button>
        </div>
      </div>
      
      <div className="bg-surface rounded-lg shadow-lg p-4">
        <div className="grid grid-cols-7 gap-px text-center font-semibold text-text-secondary mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {days.map((d, i) => {
            const eventsForDay = events.filter(e => isSameDay(new Date(e.date), d));
            return (
              <div 
                key={i} 
                onClick={() => handleOpenModal(d)}
                className={`h-32 p-2 border border-gray-700/50 flex flex-col overflow-hidden cursor-pointer transition-colors duration-200 ${
                  d.getMonth() !== currentDate.getMonth() ? 'bg-gray-800/50 text-gray-500' : 'bg-surface hover:bg-slate-700'
                } ${isSameDay(new Date(), d) ? 'border-primary' : ''}`}
              >
                <span className={`font-bold ${isSameDay(new Date(), d) ? 'text-primary' : ''}`}>{d.getDate()}</span>
                <div className="mt-1 space-y-1 overflow-y-auto text-xs">
                    {eventsForDay.map(e => <div key={e.id} className="bg-primary text-white p-1 rounded truncate">{e.title}</div>)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-surface rounded-lg p-8 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">Adicionar Evento</h3>
            <p className="mb-4 text-text-secondary">Data: {selectedDate.toLocaleDateString('pt-BR')}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary">Título</label>
                <input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" required />
              </div>
               <div>
                <label className="block text-sm font-medium text-text-secondary">Descrição (Opcional)</label>
                <textarea value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">Cancelar</button>
                <button type="submit" className="py-2 px-4 bg-primary hover:bg-indigo-700 text-white rounded-lg">Salvar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;