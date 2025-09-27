import React, { useState } from 'react';
import { Note } from '../types';
import { PlusIcon, TrashIcon, PencilSquareIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';

interface NotesManagerProps {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  deleteNote: (id: string) => void;
}

const NotesManager: React.FC<NotesManagerProps> = ({ notes, addNote, deleteNote }) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0] || null);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const handleAddNote = () => {
    if (newNote.title.trim() !== '') {
      addNote(newNote);
      setNewNote({ title: '', content: '' });
      setIsAdding(false);
    }
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id);
      setSelectedNote(null);
    }
  };

  return (
    <div>
      <ConfirmationModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir Anotação"
        message={`Tem certeza que deseja excluir a anotação "${noteToDelete?.title}"? Esta ação não pode ser desfeita.`}
      />
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <PencilSquareIcon className="w-8 h-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-text-primary">Anotações</h2>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setSelectedNote(null);
          }}
          className="flex items-center space-x-2 bg-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5"/>
          <span>Nova Anotação</span>
        </button>
      </div>
      
      <div className="flex h-[75vh] bg-surface rounded-lg shadow-lg">
        <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
          {notes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
            <div 
              key={note.id} 
              onClick={() => {
                setSelectedNote(note);
                setIsAdding(false);
              }}
              className={`p-4 cursor-pointer border-l-4 transition-colors duration-200 ${
                selectedNote?.id === note.id ? 'bg-slate-700 border-primary' : 'border-transparent hover:bg-slate-700/50'
              }`}
            >
              <h4 className="font-bold truncate text-text-primary">{note.title}</h4>
              <p className="text-xs text-text-secondary">{new Date(note.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          ))}
        </div>
        
        <div className="w-2/3 p-6 flex flex-col">
          <div key={selectedNote?.id || 'new'} className="flex flex-col h-full animate-fadeIn">
            {isAdding ? (
              <div className="flex flex-col h-full">
                <input 
                  type="text" 
                  placeholder="Título da Anotação" 
                  value={newNote.title}
                  onChange={e => setNewNote({...newNote, title: e.target.value})}
                  className="w-full bg-transparent text-2xl font-bold p-2 mb-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
                />
                <textarea 
                  placeholder="Comece a escrever..."
                  value={newNote.content}
                  onChange={e => setNewNote({...newNote, content: e.target.value})}
                  className="w-full flex-grow bg-transparent p-2 text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary rounded-md resize-none"
                />
                <div className="flex justify-end mt-4">
                  <button onClick={handleAddNote} className="py-2 px-4 bg-primary hover:bg-indigo-700 text-white rounded-lg">Salvar</button>
                </div>
              </div>
            ) : selectedNote ? (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-text-primary">{selectedNote.title}</h3>
                  <button onClick={() => setNoteToDelete(selectedNote)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10">
                      <TrashIcon className="w-5 h-5"/>
                  </button>
                </div>
                <div className="prose prose-invert max-w-none flex-grow overflow-y-auto text-text-secondary whitespace-pre-wrap">
                  {selectedNote.content}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary">
                <p>Selecione uma anotação ou crie uma nova.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesManager;