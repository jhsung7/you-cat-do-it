import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCatStore } from "../store/catStore";
import { useHealthStore } from "../store/healthStore";
import { startVoiceRecognition } from "../services/speech";
import { parseHealthLogFromVoice } from "../services/gemini";
import type { HealthLog } from "../types";

interface QuickLogSettings {
    mealAmount: number;
    waterAmount: number;
    litterCount: number;
}

function HealthLogPage() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { selectedCat } = useCatStore();
    const { addHealthLog, getRecentLogs } = useHealthStore();

    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showForm, setShowForm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [voiceMessage, setVoiceMessage] = useState("");
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // 빠른 입력 기본값 설정
    const [quickLogSettings, setQuickLogSettings] = useState<QuickLogSettings>(() => {
        const saved = localStorage.getItem('quickLogSettings');
        return saved ? JSON.parse(saved) : {
            mealAmount: 50,
            waterAmount: 50,
            litterCount: 1,
        };
    });

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        type: 'general' as HealthLog['type'],
        foodAmount: "",
        waterAmount: "",
        litterCount: "",
        activityLevel: "normal" as "active" | "normal" | "lazy",
        mood: "normal" as "happy" | "normal" | "sad" | "angry",
        notes: "",
    });

    // 설정 저장
    const saveSettings = () => {
        localStorage.setItem('quickLogSettings', JSON.stringify(quickLogSettings));
        setShowSettings(false);
        setVoiceMessage(i18n.language === "ko" ? "✅ 설정이 저장되었습니다!" : "✅ Settings saved!");
        setTimeout(() => setVoiceMessage(""), 2000);
    };

    // 🚀 빠른 입력 함수
    const quickLog = (type: HealthLog['type']) => {
        if (!selectedCat) {
            alert(t("healthLog.selectCatFirst"));
            return;
        }

        const now = new Date();
        const log: HealthLog = {
            id: crypto.randomUUID(),
            catId: selectedCat.id,
            date: now.toISOString().split("T")[0],
            time: now.toTimeString().slice(0, 5),
            timestamp: now.getTime(),
            type: type,
            foodAmount: type === 'meal' ? quickLogSettings.mealAmount : undefined,
            waterAmount: type === 'water' ? quickLogSettings.waterAmount : undefined,
            litterCount: type === 'litter' ? quickLogSettings.litterCount : undefined,
            activityLevel: "normal",
            mood: "normal",
            notes: "",
        };

        console.log("🚀 Quick log:", log);
        addHealthLog(log);

        // 성공 메시지
        let typeName = "";
        if (i18n.language === "ko") {
            typeName = type === 'meal' ? '식사' 
                     : type === 'water' ? '물' 
                     : type === 'litter' ? '배변' 
                     : '기록';
        } else {
            typeName = type === 'meal' ? 'Meal' 
                     : type === 'water' ? 'Water' 
                     : type === 'litter' ? 'Litter' 
                     : 'Record';
        }
        
        const message = i18n.language === "ko" 
            ? `✅ ${typeName} 저장 완료!`
            : `✅ ${typeName} logged successfully!`;
        
        setVoiceMessage(message);
        setTimeout(() => setVoiceMessage(""), 2000);
    };

    // 🎤 음성 입력
    const handleVoiceInput = () => {
        if (!selectedCat) {
            setVoiceMessage(t("healthLog.selectCatFirst"));
            setTimeout(() => setVoiceMessage(""), 3000);
            return;
        }

        setIsListening(true);
        setVoiceMessage(
            i18n.language === "ko"
                ? "🎤 듣고 있습니다... (말씀해주세요)"
                : "🎤 Listening... (Please speak)"
        );

        const recognition = startVoiceRecognition(
            async (transcript) => {
                setIsListening(false);
                recognitionRef.current = null;
                setIsProcessing(true);
                setVoiceMessage(
                    i18n.language === "ko"
                        ? `📝 "${transcript}" - AI가 분석 중입니다...`
                        : `📝 "${transcript}" - AI is analyzing...`
                );

                const parsed = await parseHealthLogFromVoice(
                    transcript,
                    selectedCat.name,
                    i18n.language as "ko" | "en"
                );

                setIsProcessing(false);

                if (parsed.success) {
                    setFormData((prev) => ({
                        ...prev,
                        foodAmount: parsed.foodAmount !== undefined ? String(parsed.foodAmount) : prev.foodAmount,
                        waterAmount: parsed.waterAmount !== undefined ? String(parsed.waterAmount) : prev.waterAmount,
                        litterCount: parsed.litterCount !== undefined ? String(parsed.litterCount) : prev.litterCount,
                        activityLevel: parsed.activityLevel || prev.activityLevel,
                        mood: parsed.mood || prev.mood,
                        notes: parsed.notes || prev.notes,
                    }));

                    setVoiceMessage(
                        i18n.language === "ko"
                            ? "✅ 자동으로 입력되었습니다! 확인 후 저장해주세요."
                            : "✅ Auto-filled successfully! Please review and save."
                    );

                    setShowForm(true);
                    setTimeout(() => setVoiceMessage(""), 5000);
                } else {
                    setVoiceMessage(
                        (i18n.language === "ko" ? "❌ 음성을 이해하지 못했습니다. " : "❌ Failed to understand. ") +
                        (i18n.language === "ko" ? "수동으로 입력해주세요." : "Please use manual input.")
                    );
                    setTimeout(() => setVoiceMessage(""), 5000);
                }
            },
            (error) => {
                setIsListening(false);
                recognitionRef.current = null;
                setVoiceMessage(error + " " + (i18n.language === "ko" ? "수동 입력을 사용해주세요." : "Please use manual input."));
                setTimeout(() => setVoiceMessage(""), 5000);
            },
            i18n.language as "ko" | "en"
        );

        recognitionRef.current = recognition;
    };

    const handleStopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
            setIsListening(false);
            setVoiceMessage(i18n.language === "ko" ? "⏹️ 음성 입력이 중지되었습니다." : "⏹️ Voice input stopped.");
            setTimeout(() => setVoiceMessage(""), 3000);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCat) return;

        try {
            const dateTime = new Date(`${formData.date}T${formData.time}`);
            const log: HealthLog = {
                id: crypto.randomUUID(),
                catId: selectedCat.id,
                date: formData.date,
                time: formData.time,
                timestamp: dateTime.getTime(),
                type: formData.type,
                foodAmount: formData.foodAmount ? Number(formData.foodAmount) : undefined,
                waterAmount: formData.waterAmount ? Number(formData.waterAmount) : undefined,
                litterCount: formData.litterCount ? Number(formData.litterCount) : undefined,
                activityLevel: formData.activityLevel,
                mood: formData.mood,
                notes: formData.notes,
            };

            console.log("✅ Saving log:", log);
            addHealthLog(log);

            setShowForm(false);
            setFormData({
                date: new Date().toISOString().split("T")[0],
                time: new Date().toTimeString().slice(0, 5),
                type: 'general',
                foodAmount: "",
                waterAmount: "",
                litterCount: "",
                activityLevel: "normal",
                mood: "normal",
                notes: "",
            });

            setVoiceMessage(i18n.language === "ko" ? "✅ 저장 완료!" : "✅ Saved!");
            setTimeout(() => setVoiceMessage(""), 2000);
        } catch (error) {
            console.error("❌ Error saving health log:", error);
            alert(i18n.language === "ko" ? "저장 중 오류가 발생했습니다." : "Error saving data.");
        }
    };

    if (!selectedCat) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">🐱</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {t("healthLog.selectCatFirst")}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {t("healthLog.selectCatDescription")}
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        {t("healthLog.backButton")}
                    </button>
                </div>
            </div>
        );
    }

    const activityOptions = [
        { value: "active", label: t("healthLog.active") },
        { value: "normal", label: t("healthLog.normal") },
        { value: "lazy", label: t("healthLog.lazy") },
    ];

    const moodEmojis: Record<"happy" | "normal" | "sad" | "angry", string> = {
        happy: "😊",
        normal: "😐",
        sad: "😢",
        angry: "😠",
    };

    const moodOptions: Array<{
        value: "happy" | "normal" | "sad" | "angry";
        label: string;
        emoji: string;
    }> = [
            { value: "happy", label: t("healthLog.moodHappy"), emoji: "😊" },
            { value: "normal", label: t("healthLog.moodNormal"), emoji: "😐" },
            { value: "sad", label: t("healthLog.moodSad"), emoji: "😢" },
            { value: "angry", label: t("healthLog.moodAngry"), emoji: "😠" },
        ];

    const catLogs = getRecentLogs(selectedCat.id, 365);

    // 캘린더용: 날짜별로 로그 그룹화
    const logsByDate = catLogs.reduce((acc, log) => {
        if (!acc[log.date]) {
            acc[log.date] = [];
        }
        acc[log.date].push(log);
        return acc;
    }, {} as Record<string, HealthLog[]>);

    // 선택된 날짜의 로그
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const selectedDateLogs = logsByDate[selectedDateStr] || [];

    // 캘린더 렌더링
    const renderCalendar = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasLogs = logsByDate[dateStr] && logsByDate[dateStr].length > 0;
            const isSelected = dateStr === selectedDateStr;

            days.push(
                <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={`p-2 rounded-lg transition ${
                        isSelected 
                            ? 'bg-blue-500 text-white' 
                            : hasLogs 
                            ? 'bg-green-100 text-gray-800 hover:bg-green-200' 
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <div className="text-sm font-medium">{day}</div>
                    {hasLogs && (
                        <div className="text-xs mt-1">
                            {logsByDate[dateStr].length}개
                        </div>
                    )}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ========== 헤더 ========== */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate("/")} className="text-blue-600 hover:text-blue-700">
                                ← {t("healthLog.backButton")}
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {selectedCat?.name} {t("healthLog.title")}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {selectedCat?.breed} · {selectedCat?.weight}kg
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 text-gray-600 hover:text-gray-800"
                            title={i18n.language === "ko" ? "설정" : "Settings"}
                        >
                            ⚙️
                        </button>
                    </div>

                    {/* 뷰 모드 전환 */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 px-4 py-2 rounded-lg transition ${
                                viewMode === 'list'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            📝 {i18n.language === 'ko' ? '목록' : 'List'}
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex-1 px-4 py-2 rounded-lg transition ${
                                viewMode === 'calendar'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            📅 {i18n.language === 'ko' ? '캘린더' : 'Calendar'}
                        </button>
                    </div>

                    {/* 빠른 입력 버튼들 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        <button
                            onClick={() => quickLog('meal')}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition text-sm"
                        >
                            <span className="text-lg">🍽️</span>
                            <span>{i18n.language === 'ko' ? '식사' : 'Meal'}</span>
                        </button>
                        <button
                            onClick={() => quickLog('water')}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm"
                        >
                            <span className="text-lg">💧</span>
                            <span>{i18n.language === 'ko' ? '물' : 'Water'}</span>
                        </button>
                        <button
                            onClick={() => quickLog('litter')}
                            className="flex items-center justify-center gap-1 px-3 py-2 text-white rounded-md hover:opacity-90 transition text-sm"
                            style={{ backgroundColor: '#8B4513' }}
                        >
                            <span className="text-lg">🚽</span>
                            <span>{i18n.language === 'ko' ? '배변' : 'Litter'}</span>
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition text-sm"
                        >
                            <span className="text-lg">📝</span>
                            <span>{i18n.language === 'ko' ? '상세입력' : 'Detail'}</span>
                        </button>
                    </div>

                    {/* 음성입력 */}
                    <div className="flex gap-2">
                        {isListening ? (
                            <button
                                onClick={handleStopListening}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition animate-pulse"
                            >
                                ⏹️ {i18n.language === "ko" ? "멈춤" : "Stop"}
                            </button>
                        ) : (
                            <button
                                onClick={handleVoiceInput}
                                disabled={isProcessing}
                                className={`flex-1 px-4 py-2 rounded-lg transition ${
                                    isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                                } text-white`}
                            >
                                {isProcessing
                                    ? "⏳ " + (i18n.language === "ko" ? "분석 중..." : "Processing...")
                                    : "🎤 " + (i18n.language === "ko" ? "음성 입력" : "Voice Input")}
                            </button>
                        )}
                    </div>

                    {voiceMessage && (
                        <div
                            className={`mt-2 px-4 py-2 rounded-lg text-sm ${
                                voiceMessage.includes("✅")
                                    ? "bg-green-50 text-green-700"
                                    : voiceMessage.includes("❌")
                                    ? "bg-red-50 text-red-700"
                                    : "bg-blue-50 text-blue-700"
                            }`}
                        >
                            {voiceMessage}
                        </div>
                    )}
                </div>
            </div>

            {/* ========== 메인 콘텐츠 ========== */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {viewMode === 'list' ? (
                    // 목록 뷰
                    catLogs.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <div className="text-6xl mb-4">📝</div>
                            <p className="text-xl text-gray-600 mb-2">{t("healthLog.noLogs")}</p>
                            <p className="text-gray-500 mb-6">
                                {i18n.language === 'ko' ? '위의 버튼으로 빠르게 기록을 시작하세요!' : 'Start logging with the buttons above!'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {catLogs.map((log) => (
                                <div key={log.id} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {new Date(log.date).toLocaleDateString(
                                                    i18n.language === "ko" ? "ko-KR" : "en-US",
                                                    { year: "numeric", month: "long", day: "numeric" }
                                                )}
                                            </h3>
                                            <p className="text-sm text-gray-500">{log.time}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">
                                                {log.type === 'meal' && '🍽️'}
                                                {log.type === 'water' && '💧'}
                                                {log.type === 'litter' && '🚽'}
                                                {log.type === 'weight' && '⚖️'}
                                                {log.type === 'symptom' && '⚠️'}
                                                {log.type === 'general' && '📝'}
                                            </span>
                                            <span className="text-2xl">{moodEmojis[log.mood ?? "normal"]}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        {log.foodAmount !== undefined && (
                                            <div>
                                                <p className="text-sm text-gray-600">{t("healthLog.food")}</p>
                                                <p className="text-xl font-bold text-gray-800">{log.foodAmount}g</p>
                                            </div>
                                        )}
                                        {log.waterAmount !== undefined && (
                                            <div>
                                                <p className="text-sm text-gray-600">{t("healthLog.water")}</p>
                                                <p className="text-xl font-bold text-gray-800">{log.waterAmount}ml</p>
                                            </div>
                                        )}
                                        {log.litterCount !== undefined && (
                                            <div>
                                                <p className="text-sm text-gray-600">{t("healthLog.litter")}</p>
                                                <p className="text-xl font-bold text-gray-800">
                                                    {log.litterCount}{t("healthLog.times")}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {log.notes && (
                                        <div className="border-t mt-4 pt-4">
                                            <p className="text-sm text-gray-600 mb-1">{t("healthLog.memo")}</p>
                                            <p className="text-gray-800">{log.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    // 캘린더 뷰
                    <div className="bg-white rounded-lg shadow-md p-6">
                        {/* 월 네비게이션 */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                ←
                            </button>
                            <h2 className="text-xl font-bold">
                                {selectedDate.toLocaleDateString(i18n.language === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long" })}
                            </h2>
                            <button
                                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                →
                            </button>
                        </div>

                        {/* 요일 헤더 */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {[i18n.language === 'ko' ? '일' : 'Sun', 
                              i18n.language === 'ko' ? '월' : 'Mon', 
                              i18n.language === 'ko' ? '화' : 'Tue', 
                              i18n.language === 'ko' ? '수' : 'Wed', 
                              i18n.language === 'ko' ? '목' : 'Thu', 
                              i18n.language === 'ko' ? '금' : 'Fri', 
                              i18n.language === 'ko' ? '토' : 'Sat'].map(day => (
                                <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* 캘린더 그리드 */}
                        <div className="grid grid-cols-7 gap-2 mb-6">
                            {renderCalendar()}
                        </div>

                        {/* 선택된 날짜의 로그 */}
                        {selectedDateLogs.length > 0 && (
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-bold mb-4">
                                    {selectedDate.toLocaleDateString(i18n.language === "ko" ? "ko-KR" : "en-US", { 
                                        month: "long", 
                                        day: "numeric" 
                                    })} {i18n.language === 'ko' ? '기록' : 'Logs'}
                                </h3>
                                <div className="space-y-3">
                                    {selectedDateLogs.map(log => (
                                        <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <span className="text-2xl">
                                                {log.type === 'meal' && '🍽️'}
                                                {log.type === 'water' && '💧'}
                                                {log.type === 'litter' && '🚽'}
                                                {log.type === 'weight' && '⚖️'}
                                                {log.type === 'symptom' && '⚠️'}
                                                {log.type === 'general' && '📝'}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600">{log.time}</p>
                                                <div className="flex gap-3 text-sm">
                                                    {log.foodAmount && <span>🍽️ {log.foodAmount}g</span>}
                                                    {log.waterAmount && <span>💧 {log.waterAmount}ml</span>}
                                                    {log.litterCount && <span>🚽 {log.litterCount}회</span>}
                                                </div>
                                                {log.notes && <p className="text-sm text-gray-700 mt-1">{log.notes}</p>}
                                            </div>
                                            <span className="text-xl">{moodEmojis[log.mood ?? "normal"]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ========== 설정 모달 ========== */}
            {showSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                            ⚙️ {i18n.language === 'ko' ? '빠른 입력 설정' : 'Quick Log Settings'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    🍽️ {i18n.language === 'ko' ? '식사 기본량 (g)' : 'Default Meal Amount (g)'}
                                </label>
                                <input
                                    type="number"
                                    value={quickLogSettings.mealAmount}
                                    onChange={(e) => setQuickLogSettings({ ...quickLogSettings, mealAmount: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    💧 {i18n.language === 'ko' ? '물 기본량 (ml)' : 'Default Water Amount (ml)'}
                                </label>
                                <input
                                    type="number"
                                    value={quickLogSettings.waterAmount}
                                    onChange={(e) => setQuickLogSettings({ ...quickLogSettings, waterAmount: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    🚽 {i18n.language === 'ko' ? '배변 기본 횟수' : 'Default Litter Count'}
                                </label>
                                <input
                                    type="number"
                                    value={quickLogSettings.litterCount}
                                    onChange={(e) => setQuickLogSettings({ ...quickLogSettings, litterCount: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                {i18n.language === 'ko' ? '취소' : 'Cancel'}
                            </button>
                            <button
                                onClick={saveSettings}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                {i18n.language === 'ko' ? '저장' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== 상세 입력 폼 (통합) ========== */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {i18n.language === 'ko' ? '상세 기록 입력' : 'Detailed Log'}
                            </h2>

                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("healthLog.date")}
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {i18n.language === 'ko' ? '시간' : 'Time'}
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {i18n.language === 'ko' ? '기록 유형' : 'Record Type'}
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as HealthLog['type'] })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="general">📝 {i18n.language === 'ko' ? '종합' : 'General'}</option>
                                        <option value="meal">🍽️ {i18n.language === 'ko' ? '식사' : 'Meal'}</option>
                                        <option value="water">💧 {i18n.language === 'ko' ? '수분' : 'Water'}</option>
                                        <option value="litter">🚽 {i18n.language === 'ko' ? '배변' : 'Litter'}</option>
                                        <option value="weight">⚖️ {i18n.language === 'ko' ? '체중' : 'Weight'}</option>
                                        <option value="symptom">⚠️ {i18n.language === 'ko' ? '증상' : 'Symptom'}</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("healthLog.food")} (g)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.foodAmount}
                                            onChange={(e) => setFormData({ ...formData, foodAmount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("healthLog.water")} (ml)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.waterAmount}
                                            onChange={(e) => setFormData({ ...formData, waterAmount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("healthLog.litter")}
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.litterCount}
                                            onChange={(e) => setFormData({ ...formData, litterCount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("healthLog.activity")}
                                        </label>
                                        <select
                                            value={formData.activityLevel}
                                            onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as "active" | "normal" | "lazy" })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        >
                                            {activityOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("healthLog.mood")}
                                        </label>
                                        <select
                                            value={formData.mood}
                                            onChange={(e) => setFormData({ ...formData, mood: e.target.value as "happy" | "normal" | "sad" | "angry" })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        >
                                            {moodOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.emoji} {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("healthLog.memo")}
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        placeholder={t("healthLog.memo")}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        {t("healthLog.cancel")}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                    >
                                        {t("healthLog.save")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HealthLogPage;