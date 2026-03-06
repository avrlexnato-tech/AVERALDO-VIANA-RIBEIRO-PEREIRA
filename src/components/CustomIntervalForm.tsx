import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Save, 
  Plus, 
  Minus, 
  Zap, 
  Clock, 
  Timer, 
  Activity,
  Copy
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustomWorkout } from '../types';
import { Card } from './UI';

interface CustomIntervalFormProps {
  onSave: (workout: CustomWorkout) => void;
  onCancel: () => void;
  initialData?: CustomWorkout | null;
}

const PRESETS = [
  { name: '6 × 400m', reps: 6, distance: 400, pace: '5:00', recovery: 90 },
  { name: '6 × 800m', reps: 6, distance: 800, pace: '5:15', recovery: 120 },
  { name: '6 × 1000m', reps: 6, distance: 1000, pace: '5:30', recovery: 180 },
  { name: '8 × 400m', reps: 8, distance: 400, pace: '4:45', recovery: 90 },
  { name: '5 × 600m', reps: 5, distance: 600, pace: '5:10', recovery: 120 },
];

export const CustomIntervalForm: React.FC<CustomIntervalFormProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [reps, setReps] = useState(initialData?.reps || 6);
  const [distance, setDistance] = useState(initialData?.distancePerRep || 400);
  const [pace, setPace] = useState(initialData?.targetPace || '5:30');
  const [recoveryTime, setRecoveryTime] = useState(initialData?.recoveryTime || 90);
  const [recoveryUnit, setRecoveryUnit] = useState<'sec' | 'min'>(initialData && initialData.recoveryTime >= 60 ? 'min' : 'sec');
  const [recoveryType, setRecoveryType] = useState<'parado' | 'caminhada' | 'trote'>(initialData?.recoveryType || 'caminhada');
  const [warmup, setWarmup] = useState(initialData?.warmupTime || 10);
  const [cooldown, setCooldown] = useState(initialData?.cooldownTime || 10);

  const handleSave = () => {
    const workout: CustomWorkout = {
      id: initialData?.id || Date.now().toString(),
      name: name || `${reps}x${distance}m`,
      reps,
      distancePerRep: distance,
      targetPace: pace,
      recoveryTime: recoveryUnit === 'min' ? recoveryTime * 60 : recoveryTime,
      recoveryType,
      warmupTime: warmup,
      cooldownTime: cooldown,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };
    onSave(workout);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setReps(preset.reps);
    setDistance(preset.distance);
    setPace(preset.pace);
    setRecoveryTime(preset.recovery >= 60 ? preset.recovery / 60 : preset.recovery);
    setRecoveryUnit(preset.recovery >= 60 ? 'min' : 'sec');
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-50 flex flex-col overflow-y-auto">
      <div className="p-6 pb-safe-extra">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onCancel} className="p-2 -ml-2 text-slate-400">
            <ChevronLeft size={28} />
          </button>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            {initialData ? 'Editar Treino' : 'Novo Intervalado'}
          </h2>
          <button 
            onClick={handleSave}
            className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200"
          >
            <Save size={20} />
          </button>
        </div>

        <div className="mb-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Presets Rápidos</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(preset)}
                className="bg-white border border-slate-200 px-4 py-2 rounded-full text-xs font-bold text-slate-600 active:bg-blue-50 active:border-blue-200 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Treino</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tiros de 400m"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Repetições</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1">
                <button onClick={() => setReps(Math.max(1, reps - 1))} className="p-3 text-slate-400"><Minus size={16} /></button>
                <span className="flex-1 text-center font-black text-lg">{reps}</span>
                <button onClick={() => setReps(reps + 1)} className="p-3 text-blue-600"><Plus size={16} /></button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Distância (m)</label>
              <input 
                type="number" 
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 font-bold focus:outline-none focus:border-blue-500 text-center text-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pace Alvo (min/km)</label>
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-4">
              <Zap size={20} className="text-blue-500 mr-3" />
              <input 
                type="text" 
                value={pace}
                onChange={(e) => setPace(e.target.value)}
                placeholder="5:30"
                className="flex-1 bg-transparent text-slate-800 font-bold focus:outline-none text-lg"
              />
              <span className="text-slate-400 font-bold">/km</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Recuperação</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1">
                <input 
                  type="number" 
                  value={recoveryTime}
                  onChange={(e) => setRecoveryTime(parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent px-3 py-3 text-slate-800 font-bold focus:outline-none text-center text-lg"
                />
                <select 
                  value={recoveryUnit}
                  onChange={(e) => setRecoveryUnit(e.target.value as any)}
                  className="bg-slate-100 rounded-xl px-2 py-2 text-[10px] font-black uppercase outline-none mr-1"
                >
                  <option value="sec">Seg</option>
                  <option value="min">Min</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tipo</label>
              <select 
                value={recoveryType}
                onChange={(e) => setRecoveryType(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 font-bold focus:outline-none text-sm"
              >
                <option value="parado">Parado</option>
                <option value="caminhada">Caminhada</option>
                <option value="trote">Trote</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Aquecimento (min)</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1">
                <button onClick={() => setWarmup(Math.max(0, warmup - 1))} className="p-3 text-slate-400"><Minus size={16} /></button>
                <span className="flex-1 text-center font-black text-lg">{warmup}</span>
                <button onClick={() => setWarmup(warmup + 1)} className="p-3 text-blue-600"><Plus size={16} /></button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Desaquecimento (min)</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1">
                <button onClick={() => setCooldown(Math.max(0, cooldown - 1))} className="p-3 text-slate-400"><Minus size={16} /></button>
                <span className="flex-1 text-center font-black text-lg">{cooldown}</span>
                <button onClick={() => setCooldown(cooldown + 1)} className="p-3 text-blue-600"><Plus size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Save size={24} />
            SALVAR TREINO
          </button>
        </div>
      </div>
    </div>
  );
};
