import React from 'react';
import { Sidebar } from '../components/Sidebar';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8 h-full flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-slate-300">{icon}</div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-600">{description}</p>
          </div>
        </div>
      </main>
    </div>
  );
};
