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
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workout, WorkoutType, RunRecord, UserProgress, UserProfile } from '../types';
import { TRAINING_PLAN } from '../data/plan';

// --- COMPONENTS ---

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 ${className}`}>
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
      <span className="absolute text-xs font-bold text-slate-700">{Math.round(percent)}%</span>
    </div>
  );
};

export const TrainingCard: React.FC<{ 
  workout: Workout; 
  onComplete: (id: string) => void;
  isCompleted: boolean;
}> = ({ workout, onComplete, isCompleted }) => {
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
    <Card className={`mb-4 transition-all ${isCompleted ? 'opacity-75 border-emerald-200 bg-emerald-50/30' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getTypeColor(workout.type)}`}>
          {workout.type}
        </span>
        <span className="text-xs font-medium text-slate-400">{workout.day}</span>
      </div>
      <h3 className="font-bold text-slate-800 mb-1">{workout.title}</h3>
      <p className="text-sm text-slate-600 mb-3">{workout.description}</p>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock size={14} className="text-blue-500" />
          <span>Ritmo: {workout.pace}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Zap size={14} className="text-amber-500" />
          <span>Descanso: {workout.rest}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-top border-slate-100">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 italic">
          <Info size={12} />
          <span>{workout.objective}</span>
        </div>
        {!isCompleted ? (
          <button 
            onClick={() => onComplete(workout.id)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-transform"
          >
            Concluir
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
            <CheckCircle2 size={16} />
            Concluído
          </div>
        )}
      </div>
    </Card>
  );
};

export const HistoryCard: React.FC<{ run: RunRecord }> = ({ run }) => (
  <Card className="mb-3">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-slate-400 font-medium">{new Date(run.date).toLocaleDateString('pt-BR')}</p>
        <h4 className="font-bold text-slate-800">{run.distance.toFixed(2)} km</h4>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-400 font-medium">Pace Médio</p>
        <p className="font-bold text-blue-600">{run.averagePace}</p>
      </div>
    </div>
    <div className="mt-2 pt-2 border-t border-slate-50 flex gap-4">
      <div className="flex items-center gap-1 text-[10px] text-slate-500">
        <Clock size={12} />
        <span>{Math.floor(run.duration / 60)}m {run.duration % 60}s</span>
      </div>
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 pt-2 pb-safe-bottom z-50 flex justify-between items-center">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center justify-center min-w-[64px] py-1 transition-colors ${
            tab.primary 
              ? 'bg-blue-600 text-white rounded-full w-12 h-12 -mt-8 shadow-lg shadow-blue-200 active:scale-90' 
              : activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'
          }`}
        >
          <tab.icon size={tab.primary ? 24 : 20} />
          {!tab.primary && <span className="text-[10px] mt-1 font-medium">{tab.label}</span>}
        </button>
      ))}
    </nav>
  );
};
