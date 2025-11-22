import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { HealthLog } from "../types";

interface DailyTimelineProps {
    date: Date;
    logs: HealthLog[];
    onAddLog: () => void;
}

export default function DailyTimeline({
    date,
    logs,
    onAddLog,
}: DailyTimelineProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === "ko" ? ko : enUS;

    // 시간순 정렬
    const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);

    // 아이콘 매핑
    type LogType = "meal" | "water" | "litter" | "weight" | "symptom" | "general" | "play" | "grooming";

    const getIcon = (type: LogType | undefined): string => {
        const icons: Record<LogType, string> = {
            meal: "🍽️",
            water: "💧",
            litter: "🚽",
            weight: "⚖️",
            symptom: "⚠️",
            general: "📝",
            play: "🎾",
            grooming: "🪥",
        };
        return type ? icons[type] : "❓";
    };

    // 기분 이모지
    const moodEmojis = {
        happy: "😊",
        normal: "😐",
        sad: "😢",
        angry: "😠",
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                    {format(date, "PPP", { locale })}
                </h3>
                <button
                    onClick={onAddLog}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                    + {t("healthLog.addRecord")}
                </button>
            </div>

            {sortedLogs.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-gray-600 mb-4">
                        {i18n.language === "ko"
                            ? "이 날의 기록이 없습니다"
                            : "No records for this day"}
                    </p>
                    <button
                        onClick={onAddLog}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        + {i18n.language === "ko" ? "첫 기록 추가" : "Add First Record"}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedLogs.map((log, index) => (
                        <div key={log.id} className="relative">
                            {/* 타임라인 선 */}
                            {index < sortedLogs.length - 1 && (
                                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
                            )}

                            <div className="flex gap-4">
                                {/* 시간 & 아이콘 */}
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                                        {getIcon(log.type)}
                                    </div>
                                    {log.time && (
                                        <span className="text-xs text-gray-500 mt-1">
                                            {log.time}
                                        </span>
                                    )}
                                </div>

                                {/* 내용 */}
                                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-800">
                                            {log.type === "meal" && t("healthLog.food")}
                                            {log.type === "water" && t("healthLog.water")}
                                            {log.type === "litter" && t("healthLog.litter")}
                                            {log.type === "weight" && t("healthLog.weight")}
                                            {log.type === "symptom" && t("healthLog.symptom")}
                                            {log.type === "general" && t("healthLog.general")}
                                            {log.type === "play" && t("healthLog.play")}
                                            {log.type === "grooming" && t("healthLog.brushedTeeth")}
                                        </span>
                                        {log.mood && (
                                            <span className="text-xl">{moodEmojis[log.mood]}</span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {log.foodAmount !== undefined && (
                                            <div>
                                                <span className="text-gray-600">
                                                    {t("healthLog.food")}:{" "}
                                                </span>
                                                <span className="font-medium">{log.foodAmount}g</span>
                                            </div>
                                        )}
                                        {log.waterAmount !== undefined && (
                                            <div>
                                                <span className="text-gray-600">
                                                    {t("healthLog.water")}:{" "}
                                                </span>
                                                <span className="font-medium">{log.waterAmount}ml</span>
                                            </div>
                                        )}
                                        {log.litterCount !== undefined && (
                                            <div>
                                                <span className="text-gray-600">
                                                    {t("healthLog.litter")}:{" "}
                                                </span>
                                                <span className="font-medium">
                                                    {log.litterCount}
                                                    {t("healthLog.times")}
                                                </span>
                                            </div>
                                        )}
                                        {log.activityLevel && (
                                            <div>
                                                <span className="text-gray-600">
                                                    {t("healthLog.activity")}:{" "}
                                                </span>
                                                <span className="font-medium">
                                                    {t(`healthLog.${log.activityLevel}`)}
                                                </span>
                                            </div>
                                        )}
                                        {log.playDurationMinutes !== undefined && (
                                            <div>
                                                <span className="text-gray-600">
                                                    {t("healthLog.play")}:{" "}
                                                </span>
                                                <span className="font-medium">
                                                    {log.playDurationMinutes}m (
                                                    {log.playType === "catWheel"
                                                        ? i18n.language === "ko"
                                                            ? "러닝휠"
                                                            : "wheel"
                                                        : i18n.language === "ko"
                                                        ? "장난감"
                                                        : "toys"}
                                                    )
                                                </span>
                                            </div>
                                        )}
                                        {log.brushedTeeth && (
                                            <div>
                                                <span className="text-gray-600">
                                                    {t("healthLog.brushedTeeth")}
                                                </span>
                                                {log.dentalCareProduct && (
                                                    <span className="font-medium">
                                                        {" "}
                                                        ({log.dentalCareProduct})
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {log.notes && (
                                        <p className="mt-2 text-sm text-gray-700 border-t pt-2">
                                            {log.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
