import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  ChevronLeft, 
  Zap, 
  Clock, 
  MapPin, 
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IntervalStage } from '../types';
import { AudioService } from '../services/audioService';

interface IntervalTrackerProps {
  stages: IntervalStage[];
  onFinish: (data: any) => void;
  onCancel: () => void;
  isSoundEnabled: boolean;
  isVoiceEnabled: boolean;
}

export const IntervalTracker: React.FC<IntervalTrackerProps> = ({ 
  stages, 
  onFinish, 
  onCancel,
  isSoundEnabled,
  isVoiceEnabled
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(stages[0].duration || 0);
  const [isPaused, setIsPaused] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  
  const currentStage = stages[currentStageIndex];
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleNextStage();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, timeLeft]);

  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      const nextIndex = currentStageIndex + 1;
      setCurrentStageIndex(nextIndex);
      setTimeLeft(stages[nextIndex].duration || 0);
      
      if (isSoundEnabled) AudioService.playSound('interval');
      if (isVoiceEnabled) {
        const nextStage = stages[nextIndex];
        AudioService.speak(`Iniciando fase de ${nextStage.type.toLowerCase()}`);
      }
    } else {
      onFinish({ totalTime, totalDistance });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStageColor = (type: string) => {
    switch (type) {
      case 'AQUECIMENTO': return 'bg-blue-500';
      case 'FORTE': return 'bg-red-500';
      case 'RECUPERAÇÃO': return 'bg-emerald-500';
      case 'VOLTA À CALMA': return 'bg-indigo-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 text-white flex flex-col p-6">
      <div className="flex justify-between items-center mb-12">
        <button onClick={onCancel} className="p-2 rounded-full bg-slate-800 text-slate-400">
          <ChevronLeft size={24} />
        </button>
        <div className="text-right">
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Tempo Total</p>
          <p className="text-2xl font-black font-mono">{formatTime(totalTime)}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <motion.div 
          key={currentStageIndex}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-48 h-48 rounded-full ${getStageColor(currentStage.type)} flex flex-col items-center justify-center shadow-2xl mb-8 border-8 border-white/20`}
        >
          <p className="text-xs font-black uppercase tracking-widest opacity-80">{currentStage.type}</p>
          <h2 className="text-6xl font-black font-mono mt-1">{formatTime(timeLeft)}</h2>
        </motion.div>

        <div className="mb-12">
          <p className="text-sm font-bold opacity-50 mb-2">Próxima etapa:</p>
          {currentStageIndex < stages.length - 1 ? (
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full">
              <div className={`w-2 h-2 rounded-full ${getStageColor(stages[currentStageIndex + 1].type)}`} />
              <span className="text-sm font-bold">{stages[currentStageIndex + 1].type}</span>
              <span className="text-xs opacity-50">({formatTime(stages[currentStageIndex + 1].duration || 0)})</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-emerald-400">Finalização</span>
          )}
        </div>

        <div className="w-full grid grid-cols-2 gap-8 mb-12">
          <div className="text-center">
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Ritmo Alvo</p>
            <p className="text-3xl font-black font-mono text-blue-400">{currentStage.targetPace || '--:--'}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Repetição</p>
            <p className="text-3xl font-black font-mono">{Math.floor(currentStageIndex / 2) + 1} / {Math.floor(stages.length / 2)}</p>
          </div>
        </div>
      </div>

      <div className="pb-safe-extra flex justify-center gap-6">
        <button 
          onClick={() => setIsPaused(!isPaused)}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform ${isPaused ? 'bg-emerald-500' : 'bg-amber-500'}`}
        >
          {isPaused ? <Play size={32} fill="white" /> : <Pause size={32} fill="white" />}
        </button>
        
        <button 
          onClick={() => onFinish({ totalTime, totalDistance })}
          className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Square size={32} fill="white" />
        </button>
      </div>
    </div>
  );
};
