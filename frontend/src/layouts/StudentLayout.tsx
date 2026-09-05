import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';

export const StudentLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#DFE5EC] dark:bg-[#07090E] cyber-grid-bg transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
