import React from 'react';
import { 
  Home, 
  Calendar, 
  Play, 
  History, 
  MoreHorizontal,
  ChevronRight,
  CheckCircle2,
  Clock,
  MapPin,
  Zap,
  TrendingUp,
  Info,
  Dumbbell,
  Flame,
  AlertTriangle,
  Map as MapIcon,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workout, WorkoutType, RunRecord, UserProgress, UserProfile } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENTS ---

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white rounded-3xl p-5 shadow-sm border border-slate-100 transition-all active:scale-[0.99]",
      onClick && "cursor-pointer hover:border-blue-200",
      className
    )}
  >
    {children}
  </div>
);

export const ProgressCircle: React.FC<{ percent: number; size?: number; strokeWidth?: number; color?: string }> = ({ 
  percent, 
  size = 60, 
  strokeWidth = 6,
  color = "#3b82f6"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-black text-slate-700">{Math.round(percent)}%</span>
    </div>
  );
};

export const TrainingCard: React.FC<{ 
  workout: Workout; 
  onComplete: (id: string) => void;
  isCompleted: boolean;
  onClick?: () => void;
}> = ({ workout, onComplete, isCompleted, onClick }) => {
  const getTypeColor = (type: WorkoutType) => {
    switch (type) {
      case WorkoutType.LEVE: return "bg-blue-100 text-blue-700";
      case WorkoutType.MODERADO: return "bg-indigo-100 text-indigo-700";
      case WorkoutType.INTERVALADO: return "bg-purple-100 text-purple-700";
      case WorkoutType.PROVA: return "bg-emerald-100 text-emerald-700";
      case WorkoutType.LONGO: return "bg-orange-100 text-orange-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "mb-4",
        isCompleted && "opacity-75 border-emerald-200 bg-emerald-50/30"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
          getTypeColor(workout.type)
        )}>
          {workout.type}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{workout.day}</span>
      </div>
      <h3 className="font-black text-slate-800 text-lg mb-1">{workout.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-4">{workout.description}</p>
      
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-xl">
          <Clock size={16} className="text-blue-500" />
          <span>{workout.pace}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-xl">
          <Zap size={16} className="text-amber-500" />
          <span>{workout.rest}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <Info size={14} />
          <span>{workout.objective}</span>
        </div>
        {!isCompleted ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onComplete(workout.id);
            }}
            className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-black shadow-lg shadow-blue-100 active:scale-95 transition-transform"
          >
            Concluir
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs">
            <CheckCircle2 size={18} />
            Concluído
          </div>
        )}
      </div>
    </Card>
  );
};

export const HistoryCard: React.FC<{ run: RunRecord; onClick?: () => void }> = ({ run, onClick }) => (
  <Card className="mb-3" onClick={onClick}>
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center",
          run.isInterval ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
        )}>
          {run.isInterval ? <Zap size={24} /> : <Activity size={24} />}
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            {new Date(run.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </p>
          <h4 className="font-black text-slate-800 text-lg">{run.distance.toFixed(2)} km</h4>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Pace Médio</p>
        <p className="font-black text-blue-600 text-lg">{run.averagePace}</p>
      </div>
    </div>
    <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <Clock size={14} />
          <span>{Math.floor(run.duration / 60)}m {run.duration % 60}s</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <Flame size={14} className="text-orange-500" />
          <span>{Math.round(run.calories)} kcal</span>
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-300" />
    </div>
  </Card>
);

export const BottomNav: React.FC<{ activeTab: string; onTabChange: (tab: string) => void }> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'plan', icon: Calendar, label: 'Treinos' },
    { id: 'run', icon: Play, label: 'Corrida', primary: true },
    { id: 'history', icon: History, label: 'Histórico' },
    { id: 'more', icon: MoreHorizontal, label: 'Mais' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 pt-3 pb-safe-bottom z-50 flex justify-between items-center">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] py-1 transition-all",
            tab.primary 
              ? 'bg-blue-600 text-white rounded-full w-14 h-14 -mt-10 shadow-xl shadow-blue-200 active:scale-90 border-4 border-white' 
              : activeTab === tab.id ? 'text-blue-600 scale-110' : 'text-slate-400'
          )}
        >
          <tab.icon size={tab.primary ? 28 : 22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          {!tab.primary && <span className="text-[10px] mt-1.5 font-black uppercase tracking-widest">{tab.label}</span>}
        </button>
      ))}
    </nav>
  );
};

export const SectionHeader: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode }> = ({ title, subtitle, icon }) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-1">
      {icon && <div className="text-blue-600">{icon}</div>}
      <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-400 font-medium">{subtitle}</p>}
  </div>
);
