

import React, { useEffect, useRef } from 'react';
import { Notification, CreditCard } from '../types';
import { ExclamationTriangleIcon, CalendarIcon, CreditCardIcon } from './Icons';

interface NotificationsPopoverProps {
    notifications: Notification[];
    creditCards: CreditCard[];
    onClose: () => void;
}

const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const notificationDate = new Date(dateString);
    notificationDate.setHours(0, 0, 0, 0);

    const diffTime = notificationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return `Atrasado há ${Math.abs(diffDays)} dia(s)`;
    }
    if (diffDays === 0) {
        return 'Hoje';
    }
    if (diffDays === 1) {
        return 'Amanhã';
    }
    return `Em ${diffDays} dias`;
};


const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'overdue':
            return <ExclamationTriangleIcon className="w-5 h-5 text-accent-overdue" />;
        case 'event':
            return <CalendarIcon className="w-5 h-5 text-indigo-400" />;
        case 'upcoming_bill':
            return <CreditCardIcon className="w-5 h-5 text-accent-pending" />;
        default:
            return null;
    }
}

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ notifications, creditCards, onClose }) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    
    return (
        <div 
            ref={popoverRef}
            className="absolute top-12 right-0 w-80 max-w-sm bg-surface rounded-lg shadow-2xl border border-slate-700 z-50 animate-scaleIn origin-top-right"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notifications-heading"
        >
            <div className="p-4 border-b border-slate-700">
                <h2 id="notifications-heading" className="font-semibold text-text-primary">Notificações</h2>
            </div>
            <div className="py-2 max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    <ul>
                        {notifications.map(notification => {
                            const isBill = notification.type === 'overdue' || notification.type === 'upcoming_bill';
                            const card = isBill && notification.creditCardId ? creditCards.find(c => c.id === notification.creditCardId) : undefined;
                            
                            return (
                                <li key={notification.id} className="flex items-start space-x-4 p-4 hover:bg-slate-700/50 transition-colors">
                                    <div className="flex-shrink-0 mt-1">
                                        {card?.logoUrl ? (
                                            <img src={card.logoUrl} alt={card.name} className="w-6 h-6 object-contain" />
                                        ) : (
                                            <NotificationIcon type={notification.type} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-text-primary">{notification.message}</p>
                                        <p className="text-xs text-text-secondary">{formatRelativeDate(notification.date)}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-center text-sm text-text-secondary p-8">Nenhuma notificação nova.</p>
                )}
            </div>
        </div>
    );
};

export default NotificationsPopover;