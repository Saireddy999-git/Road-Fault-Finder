
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  Users, 
  ShieldCheck, 
  Menu,
  X,
  User as UserIcon,
  Sun,
  Moon,
  Monitor,
  FileSpreadsheet,
  LogOut
} from 'lucide-react';
import { User, UserRole } from './types';
import { APP_NAME } from './constants';
import Dashboard from './components/Dashboard';
import UploadSection from './components/UploadSection';
import ViolationHistory from './components/ViolationHistory';
import UserManagement from './components/UserManagement';
import ReportsLog from './components/ReportsLog';
import Auth from './components/Auth';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';

type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'admin',
    name: 'System Administrator',
    email: 'admin@roadfaultfinder.ai',
    role: UserRole.ADMIN,
    password: 'password123'
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'history' | 'reports' | 'admin'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('violator_vision_theme') as Theme) || 'system');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (data) {
      setCurrentUser({
        id: data.id,
        name: data.full_name || 'User',
        email: email,
        role: UserRole.ADMIN, // Assuming admin for now or fetch from db
        password: ''
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Handle Theme Application
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (t: Theme) => {
      root.classList.remove('light', 'dark');
      if (t === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(systemDark ? 'dark' : 'light');
      } else {
        root.classList.add(t);
      }
      localStorage.setItem('violator_vision_theme', t);
    };

    applyTheme(theme);

    // Listen for system changes if in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col fixed inset-y-0 z-50 shadow-sm
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{APP_NAME}</span>}
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          <NavItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Upload className="w-5 h-5" />} 
            label="Media Lab" 
            active={activeTab === 'upload'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('upload')} 
          />
          <NavItem 
            icon={<History className="w-5 h-5" />} 
            label="Violation Hub" 
            active={activeTab === 'history'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('history')} 
          />
          <NavItem 
            icon={<FileSpreadsheet className="w-5 h-5" />} 
            label="Data Logs" 
            active={activeTab === 'reports'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('reports')} 
          />
          {currentUser.role === UserRole.ADMIN && (
            <NavItem 
              icon={<Users className="w-5 h-5" />} 
              label="Staff Directory" 
              active={activeTab === 'admin'} 
              collapsed={!isSidebarOpen}
              onClick={() => setActiveTab('admin')} 
            />
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {/* Theme Switcher */}
          <div className={`flex ${isSidebarOpen ? 'justify-between' : 'justify-center'} bg-slate-100 dark:bg-slate-800 p-1 rounded-xl`}>
            <button 
              onClick={() => setTheme('light')}
              className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
              title="Light Mode"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setTheme('system')}
              className={`p-2 rounded-lg transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
              title="System Default"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
              title="Dark Mode"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
              {currentUser.name[0]}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">{currentUser.name}</p>
                <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">{currentUser.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-2 flex items-center gap-3 px-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${isSidebarOpen ? 'ml-64' : 'ml-20'} flex-1 min-h-screen transition-all duration-300 p-8`}>
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
             <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize tracking-tight">{activeTab === 'reports' ? 'Data Logs' : activeTab.replace('admin', 'Staff Management')}</h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest mt-0.5">Automated Traffic Vigilance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{currentUser.name}</span>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard onLogout={handleLogout} onNavigate={setActiveTab} />}
          {activeTab === 'upload' && <UploadSection user={currentUser} />}
          {activeTab === 'history' && <ViolationHistory isAdmin={currentUser.role === UserRole.ADMIN} />}
          {activeTab === 'reports' && <ReportsLog />}
          {activeTab === 'admin' && currentUser.role === UserRole.ADMIN && <UserManagement isAdmin={currentUser.role === UserRole.ADMIN} />}
        </div>
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, collapsed, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200
      ${active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none ring-2 ring-blue-600 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      }
    `}
  >
    <span className="shrink-0">{icon}</span>
    {!collapsed && <span className="font-bold text-sm">{label}</span>}
  </button>
);

export default App;
