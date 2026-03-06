import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
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
  Flame,
  Settings as SettingsIcon,
  Bell,
  Volume2,
  VolumeX,
  Trash2,
  Info,
  ChevronRight,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Workout, 
  WorkoutType, 
  RunRecord, 
  UserProgress, 
  UserProfile, 
  UserSettings,
  IntervalStage
} from './types';
import { TRAINING_PLAN } from './data/plan';
import { 
  Card, 
  ProgressCircle, 
  TrainingCard, 
  HistoryCard, 
  BottomNav,
  SectionHeader
} from './components/UI';
import { useGPS } from './hooks/useGPS';
import { useStorage } from './hooks/useStorage';
import { Map } from './components/Map';
import { AudioService } from './services/audioService';
import { PaceGraph } from './components/PaceGraph';
import { IntervalTracker } from './components/IntervalTracker';

// --- MAIN APP ---

export default function App() {
  const { progress, profile, completeWorkout, saveRun, updateSettings, resetProgress } = useStorage();
  const [activeTab, setActiveTab] = useState('home');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showSummary, setShowSummary] = useState<RunRecord | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunRecord | null>(null);
  const [isIntervalMode, setIsIntervalMode] = useState(false);
  const [currentIntervalStages, setCurrentIntervalStages] = useState<IntervalStage[]>([]);

  const { 
    positions, 
    distance, 
    isActive, 
    segments, 
    calories,
    startTracking, 
    stopTracking,
    setDistance,
    setPositions,
    setSegments,
    setCalories
  } = useGPS(profile.weight);

  // Timer logic
  useEffect(() => {
    let interval: number;
    if (isRunning && !isPaused) {
      interval = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  // Voice alerts logic
  useEffect(() => {
    if (isRunning && !isPaused && progress.settings.voiceEnabled) {
      const currentKm = Math.floor(distance);
      if (currentKm > 0 && segments.length === currentKm) {
        const lastSegment = segments[segments.length - 1];
        AudioService.speak(`Quilômetro ${currentKm} concluído. Ritmo: ${lastSegment.pace}.`);
      }
    }
  }, [distance, segments.length, isRunning, isPaused, progress.settings.voiceEnabled]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const calculatePace = () => {
    if (distance <= 0) return "0:00";
    const paceInSeconds = timer / distance;
    const m = Math.floor(paceInSeconds / 60);
    const s = Math.floor(paceInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentPace = calculatePace();

  const handleStartRun = (workout?: Workout) => {
    if (workout?.type === WorkoutType.INTERVALADO) {
      // Create interval stages based on workout description
      const stages: IntervalStage[] = [
        { type: 'AQUECIMENTO', duration: 300, targetPace: '7:00' }
      ];
      
      const match = workout.description.match(/(\d+)x(\d+)m/);
      if (match) {
        const reps = parseInt(match[1]);
        const dist = parseInt(match[2]);
        const durationPerRep = Math.round((dist / 1000) * 360); 
        
        for (let i = 0; i < reps; i++) {
          stages.push({ type: 'FORTE', duration: durationPerRep, targetPace: workout.pace });
          stages.push({ type: 'RECUPERAÇÃO', duration: 90, targetPace: '8:00' });
        }
      }
      
      stages.push({ type: 'VOLTA À CALMA', duration: 300, targetPace: '7:30' });
      
      setCurrentIntervalStages(stages);
      setIsIntervalMode(true);
    } else {
      setIsRunning(true);
      setIsPaused(false);
      setTimer(0);
      startTracking();
      if (progress.settings.soundEnabled) AudioService.playSound('start');
      if (progress.settings.voiceEnabled) AudioService.speak("Iniciando corrida. Bom treino!");
    }
  };

  const handlePauseRun = () => {
    setIsPaused(!isPaused);
    if (progress.settings.soundEnabled) AudioService.playSound('pause');
    if (progress.settings.voiceEnabled) AudioService.speak(isPaused ? "Retomando corrida." : "Corrida pausada.");
  };

  const handleFinishRun = () => {
    stopTracking();
    const runRecord: RunRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      distance,
      duration: timer,
      averagePace: currentPace,
      calories,
      path: positions.map(p => ({ lat: p.latitude, lng: p.longitude, speed: p.speed })),
      segments,
      isInterval: isIntervalMode,
      effortLevel: 'moderado' // Default effort level
    };
    
    saveRun(runRecord);
    setShowSummary(runRecord);
    setIsRunning(false);
    setIsPaused(false);
    setTimer(0);
    setIsIntervalMode(false);
    if (progress.settings.soundEnabled) AudioService.playSound('finish');
    if (progress.settings.voiceEnabled) AudioService.speak("Treino concluído! Parabéns pelo desempenho.");
  };

  const handleIntervalFinish = (data: any) => {
    handleFinishRun();
  };

  const renderHome = () => {
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
    const currentWorkout = TRAINING_PLAN.find(w => w.week === progress.currentWeek && w.day.toLowerCase() === today.split('-')[0].toLowerCase()) 
      || TRAINING_PLAN.find(w => !progress.completedWorkouts.includes(w.id));

    const totalProgress = (progress.completedWorkouts.length / TRAINING_PLAN.length) * 100;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 pb-40"
      >
        <header className="flex justify-between items-start mb-8">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Bem-vindo de volta</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Atleta</h1>
          </div>
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
            <TrendingUp size={24} />
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-blue-600 text-white border-none shadow-blue-100">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Nível</p>
            <p className="text-lg font-black capitalize">{progress.evolutionLevel}</p>
            <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${totalProgress}%` }} />
            </div>
          </Card>
          <Card className="bg-slate-900 text-white border-none">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Semana</p>
            <p className="text-3xl font-black">{progress.currentWeek}<span className="text-sm opacity-50 ml-1">/8</span></p>
          </Card>
        </div>

        <SectionHeader 
          title="Treino de Hoje" 
          subtitle="Siga o plano para atingir seu objetivo"
          icon={<Zap size={20} />}
        />

        {currentWorkout ? (
          <TrainingCard 
            workout={currentWorkout} 
            onComplete={completeWorkout}
            isCompleted={progress.completedWorkouts.includes(currentWorkout.id)}
            onClick={() => handleStartRun(currentWorkout)}
          />
        ) : (
          <Card className="bg-emerald-50 border-emerald-100 text-center py-8">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="font-black text-emerald-800 text-lg">Tudo pronto por hoje!</h3>
            <p className="text-sm text-emerald-600">Você concluiu todos os treinos previstos.</p>
          </Card>
        )}

        {progress.planAdjustments.length > 0 && (
          <div className="mt-8">
            <SectionHeader title="Feedback da IA" icon={<Activity size={20} />} />
            <Card className="bg-amber-50 border-amber-100">
              <div className="flex gap-3">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600 h-fit">
                  <Info size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">Ajuste no Plano</p>
                  <p className="text-xs text-amber-700 leading-relaxed">{progress.planAdjustments[0].message}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="mt-8">
          <button 
            onClick={() => setActiveTab('run')}
            className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Play size={24} fill="currentColor" />
            INICIAR CORRIDA LIVRE
          </button>
        </div>
      </motion.div>
    );
  };

  const renderPlan = () => {
    const weeks = [1, 2, 3, 4, 5, 6, 7, 8];
    return (
      <div className="p-6 pb-40">
        <SectionHeader title="Plano de 8 Semanas" subtitle="Sua jornada rumo aos 5K em 30 min" icon={<Calendar size={20} />} />
        
        {weeks.map(week => (
          <div key={week} className="mb-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              Semana {week}
              {week === progress.currentWeek && <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full">Atual</span>}
            </h3>
            <div className="space-y-4">
              {TRAINING_PLAN.filter(w => w.week === week).map(workout => (
                <TrainingCard 
                  key={workout.id} 
                  workout={workout} 
                  onComplete={completeWorkout}
                  isCompleted={progress.completedWorkouts.includes(workout.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRunTracker = () => {
    if (isIntervalMode) {
      return (
        <IntervalTracker 
          stages={currentIntervalStages}
          onFinish={handleIntervalFinish}
          onCancel={() => setIsIntervalMode(false)}
          isSoundEnabled={progress.settings.soundEnabled}
          isVoiceEnabled={progress.settings.voiceEnabled}
        />
      );
    }

    if (!isRunning) {
      return (
        <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-8 text-white">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/20">
              <MapPin size={48} />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">Pronto para correr?</h2>
            <p className="text-slate-400 mb-12 max-w-xs mx-auto">Certifique-se de estar em um local aberto para melhor sinal de GPS.</p>
            
            <button 
              onClick={() => handleStartRun()}
              className="w-64 bg-blue-600 text-white py-5 rounded-full font-black text-xl shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
            >
              COMEÇAR AGORA
            </button>
            
            <button 
              onClick={() => setActiveTab('home')}
              className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs"
            >
              Voltar
            </button>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col text-white">
        <div className="h-1/3 relative">
          <Map positions={positions} isTracking={isRunning && !isPaused} className="w-full h-full" />
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-[1001]">
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Tempo</p>
              <p className="text-xl font-black font-mono">{formatTime(timer)}</p>
            </div>
            <button 
              onClick={handlePauseRun}
              className="bg-white text-slate-900 p-3 rounded-full shadow-lg active:scale-90 transition-transform"
            >
              {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 rounded-t-[40px] -mt-10 relative z-10 p-8 flex flex-col justify-between border-t border-white/5">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-widest opacity-30 mb-2">Distância Percorrida</p>
            <h2 className="text-8xl font-black tracking-tighter mb-8 italic">
              {distance.toFixed(2)}
              <span className="text-2xl ml-2 not-italic opacity-30">KM</span>
            </h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-30 mb-1">Pace Atual</p>
                <p className="text-4xl font-black font-mono text-blue-400">{currentPace}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-30 mb-1">Calorias</p>
                <p className="text-4xl font-black font-mono text-orange-400">{Math.round(calories)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-6 pb-safe-extra">
            <button 
              onClick={handleFinishRun}
              className="w-full bg-red-500 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Square size={24} fill="currentColor" />
              FINALIZAR
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    return (
      <div className="p-6 pb-40">
        <SectionHeader title="Seu Histórico" subtitle="Acompanhe sua evolução" icon={<History size={20} />} />
        {progress.runs.length === 0 ? (
          <Card className="text-center py-12">
            <Activity size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">Nenhuma corrida registrada ainda.</p>
          </Card>
        ) : (
          <div className="space-y-1">
            {progress.runs.map(run => (
              <HistoryCard key={run.id} run={run} onClick={() => setSelectedRun(run)} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMore = () => {
    return (
      <div className="p-6 pb-40">
        <SectionHeader title="Configurações" icon={<SettingsIcon size={20} />} />
        
        <Card className="mb-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                  <Volume2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Efeitos Sonoros</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black">Bips e alertas</p>
                </div>
              </div>
              <button 
                onClick={() => updateSettings({ soundEnabled: !progress.settings.soundEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${progress.settings.soundEnabled ? "bg-blue-600" : "bg-slate-200"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${progress.settings.soundEnabled ? "left-7" : "left-1"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Alertas de Voz</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black">Feedback por áudio</p>
                </div>
              </div>
              <button 
                onClick={() => updateSettings({ voiceEnabled: !progress.settings.voiceEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${progress.settings.voiceEnabled ? "bg-blue-600" : "bg-slate-200"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${progress.settings.voiceEnabled ? "left-7" : "left-1"}`} />
              </button>
            </div>
          </div>
        </Card>

        <SectionHeader title="Recursos Extras" icon={<Info size={20} />} />
        <div className="space-y-3">
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-xl text-orange-600">
                <Activity size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Exercícios de Fortalecimento</span>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </Card>
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                <TrendingUp size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Estratégia de Prova</span>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </Card>
        </div>

        <div className="mt-12">
          <button 
            onClick={resetProgress}
            className="w-full flex items-center justify-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest py-4 border border-red-100 rounded-2xl active:bg-red-50"
          >
            <Trash2 size={16} />
            Resetar todos os dados
          </button>
        </div>
      </div>
    );
  };

  const renderSummaryModal = (run: RunRecord, onClose: () => void) => {
    const paceData = run.segments.map(s => ({ distance: s.km, pace: (parseInt(s.pace.split(':')[0]) * 60 + parseInt(s.pace.split(':')[1])) }));
    
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-y-auto">
        <div className="p-6 pb-safe-extra">
          <div className="flex justify-between items-center mb-8">
            <button onClick={onClose} className="p-2 -ml-2 text-slate-400">
              <ChevronLeft size={28} />
            </button>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Resumo da Corrida</h2>
            <div className="w-10" />
          </div>

          <div className="text-center mb-12">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Distância Total</p>
            <h3 className="text-7xl font-black text-slate-800 tracking-tighter italic">
              {run.distance.toFixed(2)}
              <span className="text-xl not-italic ml-2 opacity-30">KM</span>
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tempo</p>
              <p className="text-xl font-black font-mono text-slate-800">{formatTime(run.duration)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pace Médio</p>
              <p className="text-xl font-black font-mono text-blue-600">{run.averagePace}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Calorias</p>
              <p className="text-xl font-black font-mono text-orange-500">{Math.round(run.calories)}</p>
            </div>
          </div>

          <SectionHeader title="Análise de Ritmo" icon={<TrendingUp size={20} />} />
          <Card className="mb-8 p-2">
            <PaceGraph data={paceData} />
          </Card>

          <SectionHeader title="Segmentos por KM" icon={<Activity size={20} />} />
          <div className="space-y-2 mb-12">
            {run.segments.map((seg, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-black text-slate-400 shadow-sm">{seg.km}</span>
                  <span className="font-black text-slate-700">{seg.pace} /km</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${seg.diffFromPrevious <= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {seg.diffFromPrevious <= 0 ? '↑' : '↓'} {Math.abs(seg.diffFromPrevious).toFixed(1)}s
                </span>
              </div>
            ))}
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg shadow-xl active:scale-[0.98] transition-all"
          >
            FECHAR
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <AnimatePresence mode="wait">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'plan' && renderPlan()}
        {activeTab === 'run' && renderRunTracker()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'more' && renderMore()}
      </AnimatePresence>

      {!isRunning && !isIntervalMode && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <AnimatePresence>
        {showSummary && renderSummaryModal(showSummary, () => setShowSummary(null))}
        {selectedRun && renderSummaryModal(selectedRun, () => setSelectedRun(null))}
      </AnimatePresence>
    </div>
  );
}
