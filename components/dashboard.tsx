'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Candle,
  ConfluenceSignal,
  EnrichedLevels,
  RsiSettings
} from '@/lib/trading';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsPanel } from '@/components/settings-panel';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  XAxis,
  Tooltip,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';

interface ApiResponse {
  candles: Candle[];
  levels: EnrichedLevels | null;
  firstRange: { high: number; low: number } | null;
  rsi: number[];
  rsiSettings: RsiSettings;
  confluence: ConfluenceSignal[];
  error?: string;
}

const DEFAULT_SETTINGS: RsiSettings = {
  period: 14,
  overbought: 70,
  oversold: 30,
  smoothing: 14
};

function useMarketData(settings: RsiSettings) {
  return useQuery<ApiResponse>({
    queryKey: ['intraday', settings],
    queryFn: async () => {
      const params = new URLSearchParams({
        period: String(settings.period),
        overbought: String(settings.overbought),
        oversold: String(settings.oversold),
        smoothing: String(settings.smoothing)
      });

      const res = await fetch(`/api/intraday?${params}`);
      if (!res.ok) {
        throw new Error('Failed to load market data');
      }
      return res.json();
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: true
  });
}

function formatTime(timestamp: number) {
  return format(new Date(timestamp * 1000), 'HH:mm');
}

export function Dashboard() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const { data, isLoading, error, refetch, isFetching } = useMarketData(settings);

  const priceData = useMemo(() => {
    if (!data?.candles) return [];
    const offset = Math.max(data.candles.length - (data.rsi?.length ?? 0), 0);
    return data.candles.map((candle, idx) => ({
      time: formatTime(candle.time),
      close: candle.close,
      high: candle.high,
      low: candle.low,
      rsi: idx >= offset && data?.rsi ? data.rsi[idx - offset] : null
    }));
  }, [data]);

  const rsiData = useMemo(() => {
    if (!data?.rsi || !data.candles) return [];
    const offset = data.candles.length - data.rsi.length;
    return data.rsi.map((value, idx) => ({
      time: formatTime(data.candles[idx + offset].time),
      rsi: value
    }));
  }, [data]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <SettingsPanel
          settings={settings}
          onChange={(next) => {
            setSettings(next);
            refetch();
          }}
          loading={isFetching}
        />

        <div className="card space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Nifty 50 AI Trading Agent</h1>
              <p className="text-sm text-neutral-400">Dynamic S/R levels and RSI confluence analytics</p>
            </div>
            <button
              onClick={() => refetch()}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800"
            >
              Refresh
            </button>
          </header>

          {isLoading ? (
            <div className="text-neutral-400">Loading market data…</div>
          ) : error ? (
            <div className="text-red-400">{(error as Error).message}</div>
          ) : data?.error ? (
            <div className="text-red-400">{data.error}</div>
          ) : (
            <div className="space-y-6">
              {data?.levels && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.levels.resistance.map((level) => (
                    <div key={level.name} className="card bg-neutral-900/90 border-red-500/40">
                      <h2 className="text-xs uppercase tracking-wide text-red-400">{level.name}</h2>
                      <p className="text-xl font-semibold text-red-200">{level.value.toFixed(2)}</p>
                    </div>
                  ))}
                  {data.levels.support.map((level) => (
                    <div key={level.name} className="card bg-neutral-900/90 border-green-500/40">
                      <h2 className="text-xs uppercase tracking-wide text-green-400">{level.name}</h2>
                      <p className="text-xl font-semibold text-green-200">{level.value.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Price Action</CardTitle>
                </CardHeader>
                <CardBody className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceData}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} stroke="#9ca3af" width={70} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#404040' }}
                        labelStyle={{ color: '#e5e7eb' }}
                        formatter={(value: number) => value?.toFixed?.(2) ?? value}
                      />
                      <Line type="monotone" dataKey="close" stroke="#60a5fa" dot={false} strokeWidth={2} />
                      {data?.levels?.resistance.map((level) => (
                        <ReferenceLine
                          key={level.name}
                          y={level.value}
                          stroke="#f87171"
                          strokeDasharray="4 4"
                          label={{ value: level.name, position: 'insideTopRight', fill: '#f87171' }}
                        />
                      ))}
                      {data?.levels?.support.map((level) => (
                        <ReferenceLine
                          key={level.name}
                          y={level.value}
                          stroke="#34d399"
                          strokeDasharray="4 4"
                          label={{ value: level.name, position: 'insideBottomRight', fill: '#34d399' }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Relative Strength Index</CardTitle>
                </CardHeader>
                <CardBody className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rsiData}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[0, 100]} stroke="#9ca3af" width={50} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#404040' }}
                        labelStyle={{ color: '#e5e7eb' }}
                        formatter={(value: number) => value?.toFixed?.(2) ?? value}
                      />
                      <ReferenceLine y={settings.overbought} stroke="#f87171" strokeDasharray="3 3" />
                      <ReferenceLine y={settings.oversold} stroke="#34d399" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="rsi" stroke="#a855f7" fill="#a855f733" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              {data?.confluence?.length ? (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Confluence Signals</CardTitle>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    {data.confluence.map((signal, idx) => (
                      <div
                        key={`${signal.level.name}-${signal.candle.time}-${idx}`}
                        className="flex items-start justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900/70 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold capitalize text-neutral-100">
                            {signal.type}
                          </p>
                          <p className="text-sm text-neutral-300">{signal.message}</p>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {formatTime(signal.candle.time)}
                        </span>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Confluence Signals</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <p className="text-sm text-neutral-400">
                      No significant confluence detected yet. Monitoring market structure…
                    </p>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
