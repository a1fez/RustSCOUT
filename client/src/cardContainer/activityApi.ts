import type { ActivityDay } from './player'

const API = '';
const DAYS = 7;

const pad = (n : number) => (n < 10 ? `0${n}` : `${n}`);
const localDayKey = (d : Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

interface ActivityRow {
    day: string; 
    minutes: number[];
}

export function toLocalDays(rows: ActivityRow[], days = DAYS): ActivityDay[] {
    const byDay = new Map<string, number[]>();

    for (const row of rows) {
        const [y, m, d] = row.day.split('-').map(Number);

        row.minutes.forEach((min, utcHour) => {
            if (!min) return;

            const local = new Date(Date.UTC(y, m - 1, d, utcHour));
            const key = localDayKey(local);

            let hours = byDay.get(key);
            if (!hours) {
                hours = new Array(24).fill(0);
                byDay.set(key, hours);
            }
            const h = local.getHours();
            hours[h] = Math.min(hours[h] + min, 60);
        });
    }

const result: ActivityDay[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const key = localDayKey(date);
        result.push({ date: key, hours: byDay.get(key) ?? new Array(24).fill(0) });
    }
    return result;
}

export async function fetchActivity(bmId: string, signal?: AbortSignal): Promise<ActivityDay[]> {
    const res = await fetch(`${API}/api/player/${bmId}/activity?days=${DAYS}`, { signal });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || `HTTP ${res.status}`);
    }
    return toLocalDays(data.data);
}