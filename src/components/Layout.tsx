import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { cn } from '../utils/cn';

export const Layout: React.FC = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors">
                        <BarChart3 className="w-6 h-6" />
                        <span className="font-bold text-xl tracking-tight">PERT Estimator</span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link
                            to="/"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-indigo-600",
                                location.pathname === "/" ? "text-indigo-600" : "text-slate-500"
                            )}
                        >
                            Dashboard
                        </Link>
                    </nav>
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};
