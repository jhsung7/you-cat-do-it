import { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
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
    const prefixDays = Array.from({ length: startDayOfWeek }, () => null);

    // 날짜별 로그 개수 계산
    const getLogsForDate = (date: Date) => {
        return logs.filter((log) => {
            const logDate = new Date(log.date);
            return isSameDay(logDate, date);
        });
    };

    // 날짜별 건강 상태 분석
    const getHealthStatus = (date: Date) => {
        const dayLogs = getLogsForDate(date);
        if (dayLogs.length === 0) return { color: "bg-white", icon: "" };

        // 평균 기분 계산
        const avgMood = dayLogs.reduce((sum, log) => sum + (typeof log.mood === 'number' ? log.mood : 3), 0) / dayLogs.length;

        // 식사 거부 체크
        const hasLowFood = dayLogs.some(log => (log.foodAmount || 0) < 20);

        // 부정적 증상 체크 (notes에서)
        const hasSymptoms = dayLogs.some(log =>
            log.notes?.toLowerCase().includes('vomit') ||
            log.notes?.toLowerCase().includes('구토') ||
            log.notes?.toLowerCase().includes('설사') ||
            log.notes?.toLowerCase().includes('diarrhea')
        );

        // 건강 상태에 따라 색상 결정
        if (hasSymptoms || avgMood <= 2 || hasLowFood) {
            return { color: "bg-red-50", icon: "⚠️" };
        } else if (avgMood >= 4 && !hasLowFood) {
            return { color: "bg-green-50", icon: "😊" };
        } else {
            return { color: "bg-blue-50", icon: "📝" };
        }
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
                    const healthStatus = getHealthStatus(date);
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());

                    return (
                        <button
                            key={date.toString()}
                            onClick={() => onSelectDate(date)}
                            className={`
                aspect-square rounded-lg p-2 transition relative
                ${healthStatus.color}
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
                                <div className="absolute bottom-1 right-1 text-xs">
                                    {healthStatus.icon}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* 범례 */}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-50 border border-gray-200 rounded flex items-center justify-center text-xs">
                        😊
                    </div>
                    <span>{i18n.language === "ko" ? "좋은 상태" : "Good"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-50 border border-gray-200 rounded flex items-center justify-center text-xs">
                        📝
                    </div>
                    <span>{i18n.language === "ko" ? "보통" : "Normal"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-50 border border-gray-200 rounded flex items-center justify-center text-xs">
                        ⚠️
                    </div>
                    <span>{i18n.language === "ko" ? "주의 필요" : "Needs attention"}</span>
                </div>
            </div>
        </div>
    );
}
