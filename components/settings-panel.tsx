'use client';

import { useState } from 'react';
import { RsiSettings } from '@/lib/trading';

interface Props {
  settings: RsiSettings;
  onChange: (settings: RsiSettings) => void;
  loading: boolean;
}

export function SettingsPanel({ settings, onChange, loading }: Props) {
  const [local, setLocal] = useState(settings);

  const handleUpdate = (field: keyof RsiSettings, value: number) => {
    const next = { ...local, [field]: value };
    setLocal(next);
  };

  const apply = () => {
    onChange(local);
  };

  return (
    <aside className="card sticky top-6 h-fit space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Agent Controls</h2>
        <p className="text-sm text-neutral-400">Tune RSI model to adapt sensitivity and confluence thresholds.</p>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-neutral-300">RSI Period</span>
        <input
          type="number"
          min={2}
          max={50}
          value={local.period}
          onChange={(event) => handleUpdate('period', Number(event.target.value))}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-sky-500 focus:outline-none"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-neutral-300">Smoothing</span>
        <input
          type="number"
          min={1}
          max={50}
          value={local.smoothing}
          onChange={(event) => handleUpdate('smoothing', Number(event.target.value))}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-sky-500 focus:outline-none"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-neutral-300">Overbought Threshold</span>
        <input
          type="number"
          min={40}
          max={90}
          value={local.overbought}
          onChange={(event) => handleUpdate('overbought', Number(event.target.value))}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-sky-500 focus:outline-none"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-neutral-300">Oversold Threshold</span>
        <input
          type="number"
          min={10}
          max={60}
          value={local.oversold}
          onChange={(event) => handleUpdate('oversold', Number(event.target.value))}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-sky-500 focus:outline-none"
        />
      </label>

      <button
        onClick={apply}
        disabled={loading}
        className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-neutral-700"
      >
        {loading ? 'Updating…' : 'Apply Settings'}
      </button>
    </aside>
  );
}
