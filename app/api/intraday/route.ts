import { NextResponse } from 'next/server';
import {
  analyzeConfluence,
  buildLevels,
  Candle,
  computeRsi,
  firstFiveMinuteRange,
  RsiSettings
} from '@/lib/trading';

const NIFTY_SYMBOL = '%5ENSEI';

const DEFAULT_RSI: RsiSettings = {
  period: 14,
  overbought: 70,
  oversold: 30,
  smoothing: 14
};

function parseYahooResponse(payload: any): Candle[] {
  const result = payload?.chart?.result?.[0];
  if (!result) return [];
  const timestamps: number[] = result.timestamp || [];
  const indicators = result.indicators?.quote?.[0];
  if (!indicators) return [];

  return timestamps
    .map((timestamp, index) => {
      const open = indicators.open?.[index];
      const high = indicators.high?.[index];
      const low = indicators.low?.[index];
      const close = indicators.close?.[index];
      const volume = indicators.volume?.[index];

      if ([open, high, low, close, volume].some((value) => value == null)) {
        return null;
      }

      return {
        time: timestamp,
        open,
        high,
        low,
        close,
        volume
      } satisfies Candle;
    })
    .filter((candle): candle is Candle => Boolean(candle));
}

export const revalidate = 0;

function parseSettings(url: URL): RsiSettings {
  const period = Number(url.searchParams.get('period'));
  const overbought = Number(url.searchParams.get('overbought'));
  const oversold = Number(url.searchParams.get('oversold'));
  const smoothing = Number(url.searchParams.get('smoothing'));

  return {
    period: Number.isFinite(period) && period > 1 ? Math.min(period, 50) : DEFAULT_RSI.period,
    overbought:
      Number.isFinite(overbought) && overbought > 0 && overbought < 100
        ? overbought
        : DEFAULT_RSI.overbought,
    oversold:
      Number.isFinite(oversold) && oversold > 0 && oversold < 100
        ? oversold
        : DEFAULT_RSI.oversold,
    smoothing:
      Number.isFinite(smoothing) && smoothing >= 1 ? Math.min(smoothing, 50) : DEFAULT_RSI.smoothing
  } satisfies RsiSettings;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const settings = parseSettings(url);

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${NIFTY_SYMBOL}?interval=1m&range=1d&includePrePost=false`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NiftyAI/1.0)'
        },
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 502 });
    }

    const json = await response.json();
    const candles = parseYahooResponse(json);

    if (candles.length === 0) {
      return NextResponse.json({ error: 'No candles returned' }, { status: 500 });
    }

    const firstRange = firstFiveMinuteRange(candles);
    const levels = buildLevels(firstRange);

    const rsi = computeRsi(candles, settings);
    const confluence = analyzeConfluence(candles, levels, rsi, settings);

    return NextResponse.json({
      candles,
      levels,
      firstRange,
      rsi,
      rsiSettings: settings,
      confluence
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
}
