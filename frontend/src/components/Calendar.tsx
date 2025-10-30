import { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { HealthLog } from "../types";

interface CalendarProps {
    logs: HealthLog[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export default function Calendar({
    logs,
    selectedDate,
    onSelectDate,
}: CalendarProps) {
    const { i18n } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const locale = i18n.language === "ko" ? ko : enUS;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // 달력 시작 요일 맞추기 (일요일부터)
    const startDayOfWeek = monthStart.getDay();
    const prefixDays = Array.from({ length: startDayOfWeek }, (_, i) => null);

    // 날짜별 로그 개수 계산
    const getLogsForDate = (date: Date) => {
        return logs.filter((log) => {
            const logDate = new Date(log.date);
            return isSameDay(logDate, date);
        });
    };

    // 날짜별 색상 (로그 개수에 따라)
    const getDateColor = (date: Date) => {
        const dayLogs = getLogsForDate(date);
        if (dayLogs.length === 0) return "bg-white";
        if (dayLogs.length <= 2) return "bg-blue-50";
        if (dayLogs.length <= 5) return "bg-blue-100";
        return "bg-blue-200";
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    ←
                </button>
                <h2 className="text-xl font-bold text-gray-800">
                    {format(currentMonth, "MMMM yyyy", { locale })}
                </h2>
                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    →
                </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                        key={day}
                        className="text-center text-sm font-semibold text-gray-600 py-2"
                    >
                        {i18n.language === "ko"
                            ? ["일", "월", "화", "수", "목", "금", "토"][
                            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day)
                            ]
                            : day}
                    </div>
                ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-2">
                {/* 앞쪽 빈 칸 */}
                {prefixDays.map((_, i) => (
                    <div key={`prefix-${i}`} className="aspect-square" />
                ))}

                {/* 실제 날짜 */}
                {daysInMonth.map((date) => {
                    const dayLogs = getLogsForDate(date);
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());

                    return (
                        <button
                            key={date.toString()}
                            onClick={() => onSelectDate(date)}
                            className={`
                aspect-square rounded-lg p-2 transition relative
                ${getDateColor(date)}
                ${isSelected ? "ring-2 ring-blue-500" : ""}
                ${isToday
                                    ? "border-2 border-blue-500"
                                    : "border border-gray-200"
                                }
                hover:ring-2 hover:ring-blue-300
              `}
                        >
                            <div className="text-sm font-medium text-gray-800">
                                {format(date, "d")}
                            </div>
                            {dayLogs.length > 0 && (
                                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                                    <div className="flex gap-0.5">
                                        {dayLogs.slice(0, 3).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 h-1 rounded-full bg-blue-500"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* 범례 */}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-50 border border-gray-200 rounded" />
                    <span>1-2 {i18n.language === "ko" ? "기록" : "logs"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-gray-200 rounded" />
                    <span>3-5 {i18n.language === "ko" ? "기록" : "logs"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-200 border border-gray-200 rounded" />
                    <span>6+ {i18n.language === "ko" ? "기록" : "logs"}</span>
                </div>
            </div>
        </div>
    );
}
