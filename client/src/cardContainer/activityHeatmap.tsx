import React, { useState } from "react";
import type { ActivityDay } from "./player";
import "./activityHeatmap.css";

interface ActivityHeatmapProps {
    days: ActivityDay[];
}

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const HOUR_LABELS = [0, 6, 12, 18, 23];
// Сверху вниз: 23 → 0, поздние часы наверху
const HOURS_TOP_DOWN = Array.from({ length: 24 }, (_, i) => 23 - i);

// 'YYYY-MM-DD' парсим как локальную дату — new Date('2026-10-08') дал бы UTC и сдвиг на день
const parseDay = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};

// Ступени яркости: 0 — пусто, 1..4 — от «заглянул» до «весь час в игре»
const level = (minutes: number) => {
    if (minutes <= 0) return 0;
    if (minutes < 15) return 1;
    if (minutes < 30) return 2;
    if (minutes < 45) return 3;
    return 4;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ days }) => {
    const [hovered, setHovered] = useState<{ day: number; hour: number } | null>(null);

    const totalMinutes = days.reduce((sum, d) => sum + d.hours.reduce((a, b) => a + b, 0), 0);

    // Самый «плотный» час по всем дням — подсказка, когда игрока обычно ловить
    const byHour = Array.from({ length: 24 }, (_, h) =>
        days.reduce((sum, d) => sum + (d.hours[h] || 0), 0)
    );
    const peakHour = totalMinutes > 0 ? byHour.indexOf(Math.max(...byHour)) : null;

    const hoveredDay = hovered ? days[hovered.day] : null;
    const hoveredMinutes = hovered && hoveredDay ? hoveredDay.hours[hovered.hour] || 0 : 0;

    return (
        <div className="activityHeatmap">
            <div className="activityStats">
                <div className="activityStat">
                    <span className="activityStatLabel">За 7 дней</span>
                    <span className="activityStatValue">{(totalMinutes / 60).toFixed(1)} ч.</span>
                </div>
                <div className="activityStat">
                    <span className="activityStatLabel">Пик</span>
                    <span className="activityStatValue">
                        {peakHour !== null ? `${pad(peakHour)}:00–${pad((peakHour + 1) % 24)}:00` : '-'}
                    </span>
                </div>
            </div>

            <div className="activityGrid">
                {/* Колонка подписей часов повторяет структуру дня — строки всегда совпадают */}
                <div className="activityColumn">
                    <span className="activityDayLabel" />
                    <div className="activityTicks">
                        {HOURS_TOP_DOWN.map((h) => (
                            <span key={h} className="activityHourLabel">
                                {HOUR_LABELS.includes(h) ? pad(h) : ''}
                            </span>
                        ))}
                    </div>
                    <span className="activityDateLabel" />
                </div>

                {days.map((day, dayIdx) => {
                    const date = parseDay(day.date);
                    return (
                        <div key={day.date} className="activityColumn">
                            <span className="activityDayLabel">{WEEKDAYS[date.getDay()]}</span>
                            <div className="activityTicks">
                                {HOURS_TOP_DOWN.map((hour) => (
                                    <span
                                        key={hour}
                                        className={`activityTick lvl${level(day.hours[hour] || 0)} ${
                                            hovered?.day === dayIdx && hovered.hour === hour ? 'isHovered' : ''
                                        }`}
                                        onMouseEnter={() => setHovered({ day: dayIdx, hour })}
                                        onMouseLeave={() => setHovered(null)}
                                    />
                                ))}
                            </div>
                            <span className="activityDateLabel">{pad(date.getDate())}.{pad(date.getMonth() + 1)}</span>
                        </div>
                    );
                })}
            </div>

            <div className="activityFooter">
                <p className="activityReadout">
                    {hovered && hoveredDay
                        ? `${WEEKDAYS[parseDay(hoveredDay.date).getDay()]}, ${pad(hovered.hour)}:00 — ${
                              hoveredMinutes > 0 ? `${hoveredMinutes} мин в игре` : 'не в сети'
                          }`
                        : 'Наведите на черточку, чтобы увидеть час'}
                </p>
                <div className="activityLegend">
                    <span>меньше</span>
                    {[0, 1, 2, 3, 4].map((l) => (
                        <span key={l} className={`activityLegendTick lvl${l}`} />
                    ))}
                    <span>больше</span>
                </div>
            </div>
        </div>
    );
};
