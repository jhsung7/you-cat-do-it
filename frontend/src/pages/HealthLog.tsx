import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCatStore } from "../store/catStore";
import { useHealthStore } from "../store/healthStore";
import { startVoiceRecognition } from "../services/speech";
import { parseHealthLogFromVoice } from "../services/gemini";
import type { HealthLog, Symptom } from "../types";
import SymptomChecker from "../components/SymptomChecker";
import DailySummary from "../components/DailySummary";

interface QuickLogSettings {
    // 식사 (사료)
    mealType: 'wet' | 'dry' | 'both';
    wetFoodBrand: string;
    wetFoodAmount: number;
    wetFoodCaloriesPer100g: number;
    dryFoodBrand: string;
    dryFoodAmount: number;
    dryFoodCaloriesPer100g: number;

    // 간식
    treatBrand: string;
    treatCount: number;
    treatCaloriesPer100g: number;

    // 물 (ml)
    waterAmount: number;

    // 배변 (횟수)
    urineCount: number;
    fecesCount: number;
}

function HealthLogPage() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { selectedCat } = useCatStore();
    const { addHealthLog, updateHealthLog, deleteHealthLog, getRecentLogs } = useHealthStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showForm, setShowForm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSymptomChecker, setShowSymptomChecker] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [voiceMessage, setVoiceMessage] = useState("");
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // 빠른 입력 기본값 설정
    const [quickLogSettings, setQuickLogSettings] = useState<QuickLogSettings>(() => {
        const saved = localStorage.getItem('quickLogSettings');
        return saved ? JSON.parse(saved) : {
            mealType: 'both',
            wetFoodBrand: '',
            wetFoodAmount: 50,
            wetFoodCaloriesPer100g: 85,
            dryFoodBrand: '',
            dryFoodAmount: 30,
            dryFoodCaloriesPer100g: 375,
            treatBrand: '',
            treatCount: 1,
            treatCaloriesPer100g: 400,
            waterAmount: 50,
            urineCount: 1,
            fecesCount: 1,
        };
    });

    // Mood 입력 모달만 유지
    const [showMoodModal, setShowMoodModal] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        type: 'general' as HealthLog['type'],
        foodAmount: "",
        wetFoodAmount: "",
        dryFoodAmount: "",
        snackAmount: "",
        snackType: "",
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

    // 🚀 빠른 입력 함수들
    const quickLogWater = () => {
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
            type: 'water',
            waterAmount: quickLogSettings.waterAmount,
            activityLevel: "normal",
            mood: "normal",
            notes: "",
        };

        addHealthLog(log);
        const message = i18n.language === "ko" ? `✅ 물 ${quickLogSettings.waterAmount}ml 저장!` : `✅ Water ${quickLogSettings.waterAmount}ml logged!`;
        setVoiceMessage(message);
        setTimeout(() => setVoiceMessage(""), 2000);
    };

    const quickLogUrine = () => {
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
            type: 'litter',
            litterCount: quickLogSettings.urineCount,
            activityLevel: "normal",
            mood: "normal",
            notes: i18n.language === "ko" ? `소변 ${quickLogSettings.urineCount}회` : `Urine ${quickLogSettings.urineCount}x`,
        };

        addHealthLog(log);
        const message = i18n.language === "ko" ? `✅ 소변 기록 완료!` : `✅ Urine logged!`;
        setVoiceMessage(message);
        setTimeout(() => setVoiceMessage(""), 2000);
    };

    const quickLogFeces = () => {
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
            type: 'litter',
            litterCount: quickLogSettings.fecesCount,
            activityLevel: "normal",
            mood: "normal",
            notes: i18n.language === "ko" ? `대변 ${quickLogSettings.fecesCount}회` : `Feces ${quickLogSettings.fecesCount}x`,
        };

        addHealthLog(log);
        const message = i18n.language === "ko" ? `✅ 대변 기록 완료!` : `✅ Feces logged!`;
        setVoiceMessage(message);
        setTimeout(() => setVoiceMessage(""), 2000);
    };

    const quickLogMeal = () => {
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
            type: 'meal',
            wetFoodAmount: quickLogSettings.mealType === 'wet' || quickLogSettings.mealType === 'both' ? quickLogSettings.wetFoodAmount : undefined,
            dryFoodAmount: quickLogSettings.mealType === 'dry' || quickLogSettings.mealType === 'both' ? quickLogSettings.dryFoodAmount : undefined,
            activityLevel: "normal",
            mood: "normal",
            notes: "",
        };

        addHealthLog(log);
        const message = i18n.language === "ko" ? `✅ 사료 기록 완료!` : `✅ Meal logged!`;
        setVoiceMessage(message);
        setTimeout(() => setVoiceMessage(""), 2000);
    };

    const quickLogTreat = () => {
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
            type: 'meal',
            snackAmount: quickLogSettings.treatCount * 5, // 1회당 약 5g로 가정
            activityLevel: "normal",
            mood: "normal",
            notes: i18n.language === "ko" ? `간식 ${quickLogSettings.treatCount}회` : `Treat ${quickLogSettings.treatCount}x`,
        };

        addHealthLog(log);
        const message = i18n.language === "ko" ? `✅ 간식 기록 완료!` : `✅ Treat logged!`;
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
                    // 자동 저장 로직
                    const now = new Date();
                    const log: HealthLog = {
                        id: crypto.randomUUID(),
                        catId: selectedCat.id,
                        date: now.toISOString().split("T")[0],
                        time: now.toTimeString().slice(0, 5),
                        timestamp: now.getTime(),
                        type: 'general',
                        foodAmount: parsed.foodAmount,
                        waterAmount: parsed.waterAmount,
                        litterCount: parsed.litterCount,
                        activityLevel: parsed.activityLevel || "normal",
                        mood: parsed.mood || "normal",
                        notes: parsed.notes || `음성 입력: "${transcript}"`,
                    };

                    console.log("✅ Auto-saving voice input log:", log);
                    addHealthLog(log);

                    // 증상이 감지된 경우 별도로 증상 기록 생성
                    if (parsed.symptom) {
                        const symptom: Symptom = {
                            id: crypto.randomUUID(),
                            catId: selectedCat.id,
                            date: now.toISOString().split("T")[0],
                            timestamp: now.getTime(),
                            symptomType: parsed.symptom.type,
                            severity: parsed.symptom.severity,
                            description: parsed.symptom.description,
                            urgency: parsed.symptom.severity === 'severe' ? 'emergency' :
                                     parsed.symptom.severity === 'moderate' ? 'warning' : 'mild',
                        };

                        console.log("✅ Auto-saving symptom:", symptom);
                        useHealthStore.getState().addSymptom(symptom);

                        setVoiceMessage(
                            i18n.language === "ko"
                                ? `✅ 자동으로 저장되었습니다! (증상: ${parsed.symptom.type})`
                                : `✅ Auto-saved! (Symptom: ${parsed.symptom.type})`
                        );
                    } else {
                        setVoiceMessage(
                            i18n.language === "ko"
                                ? "✅ 자동으로 저장되었습니다! 하단 리스트에서 수정 가능합니다."
                                : "✅ Auto-saved! You can edit it from the list below."
                        );
                    }

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

    const handleEditLog = (log: HealthLog) => {
        setEditingLogId(log.id);
        setFormData({
            date: log.date,
            time: log.time || new Date().toTimeString().slice(0, 5),
            type: log.type,
            foodAmount: log.foodAmount?.toString() || "",
            wetFoodAmount: log.wetFoodAmount?.toString() || "",
            dryFoodAmount: log.dryFoodAmount?.toString() || "",
            snackAmount: log.snackAmount?.toString() || "",
            snackType: log.snackType || "",
            waterAmount: log.waterAmount?.toString() || "",
            litterCount: log.litterCount?.toString() || "",
            activityLevel: log.activityLevel || "normal",
            mood: log.mood || "normal",
            notes: log.notes || "",
        });
        setShowForm(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCat) return;

        try {
            const dateTime = new Date(`${formData.date}T${formData.time}`);

            if (editingLogId) {
                // 수정 모드
                const wetFood = formData.wetFoodAmount ? Number(formData.wetFoodAmount) : undefined;
                const dryFood = formData.dryFoodAmount ? Number(formData.dryFoodAmount) : undefined;
                const totalFood = (wetFood || 0) + (dryFood || 0);

                const updates: Partial<HealthLog> = {
                    date: formData.date,
                    time: formData.time,
                    timestamp: dateTime.getTime(),
                    type: formData.type,
                    foodAmount: totalFood > 0 ? totalFood : (formData.foodAmount ? Number(formData.foodAmount) : undefined),
                    wetFoodAmount: wetFood,
                    dryFoodAmount: dryFood,
                    snackAmount: formData.snackAmount ? Number(formData.snackAmount) : undefined,
                    snackType: formData.snackType || undefined,
                    waterAmount: formData.waterAmount ? Number(formData.waterAmount) : undefined,
                    litterCount: formData.litterCount ? Number(formData.litterCount) : undefined,
                    activityLevel: formData.activityLevel,
                    mood: formData.mood,
                    notes: formData.notes,
                };

                console.log("✅ Updating log:", editingLogId, updates);
                updateHealthLog(editingLogId, updates);
                setVoiceMessage(i18n.language === "ko" ? "✅ 수정 완료!" : "✅ Updated!");
            } else {
                // 새로 추가
                const wetFood = formData.wetFoodAmount ? Number(formData.wetFoodAmount) : undefined;
                const dryFood = formData.dryFoodAmount ? Number(formData.dryFoodAmount) : undefined;
                const totalFood = (wetFood || 0) + (dryFood || 0);

                const log: HealthLog = {
                    id: crypto.randomUUID(),
                    catId: selectedCat.id,
                    date: formData.date,
                    time: formData.time,
                    timestamp: dateTime.getTime(),
                    type: formData.type,
                    foodAmount: totalFood > 0 ? totalFood : (formData.foodAmount ? Number(formData.foodAmount) : undefined),
                    wetFoodAmount: wetFood,
                    dryFoodAmount: dryFood,
                    snackAmount: formData.snackAmount ? Number(formData.snackAmount) : undefined,
                    snackType: formData.snackType || undefined,
                    waterAmount: formData.waterAmount ? Number(formData.waterAmount) : undefined,
                    litterCount: formData.litterCount ? Number(formData.litterCount) : undefined,
                    activityLevel: formData.activityLevel,
                    mood: formData.mood,
                    notes: formData.notes,
                };

                console.log("✅ Saving log:", log);
                addHealthLog(log);
                setVoiceMessage(i18n.language === "ko" ? "✅ 저장 완료!" : "✅ Saved!");
            }

            setShowForm(false);
            setEditingLogId(null);
            setFormData({
                date: new Date().toISOString().split("T")[0],
                time: new Date().toTimeString().slice(0, 5),
                type: 'general',
                foodAmount: "",
                wetFoodAmount: "",
                dryFoodAmount: "",
                snackAmount: "",
                snackType: "",
                waterAmount: "",
                litterCount: "",
                activityLevel: "normal",
                mood: "normal",
                notes: "",
            });

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

    const catLogs = getRecentLogs(selectedCat.id, 365)
        .sort((a, b) => b.timestamp - a.timestamp); // 최신순 정렬

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
            const dayLogs = logsByDate[dateStr] || [];
            const hasLogs = dayLogs.length > 0;
            const isSelected = dateStr === selectedDateStr;

            // 일일 요약 계산
            const totalFood = dayLogs.reduce((sum, log) => sum + (log.foodAmount || 0), 0);
            const totalWater = dayLogs.reduce((sum, log) => sum + (log.waterAmount || 0), 0);
            const hasSymptoms = dayLogs.some(log => log.type === 'symptom');
            const avgMood = dayLogs.length > 0
                ? dayLogs.reduce((sum, log) => sum + (typeof log.mood === 'string' ? ({'happy': 5, 'normal': 3, 'sad': 2, 'angry': 1}[log.mood] || 3) : 3), 0) / dayLogs.length
                : 3;

            days.push(
                <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={`p-1.5 rounded-lg transition min-h-[65px] flex flex-col items-start ${
                        isSelected
                            ? 'bg-blue-500 text-white'
                            : hasLogs
                                ? hasSymptoms || avgMood <= 2
                                    ? 'bg-red-50 text-gray-800 hover:bg-red-100'
                                    : avgMood >= 4
                                        ? 'bg-green-50 text-gray-800 hover:bg-green-100'
                                        : 'bg-blue-50 text-gray-800 hover:bg-blue-100'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <div className="text-xs font-medium mb-0.5">{day}</div>
                    {hasLogs && (
                        <div className="text-[10px] leading-tight space-y-0.5 w-full">
                            {totalFood > 0 && <div className="truncate">🍽️{totalFood}g</div>}
                            {totalWater > 0 && <div className="truncate">💧{totalWater}ml</div>}
                            {hasSymptoms && <div>⚠️</div>}
                        </div>
                    )}
                </button>
            );
        }

        return days;
    };

    const { cats, selectCat } = useCatStore();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ========== 헤더 (Sticky) ========== */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate("/")} className="text-blue-600 hover:text-blue-700">
                                ← {t("healthLog.backButton")}
                            </button>
                            {/* Cat Selector */}
                            <select
                                value={selectedCat?.id || ''}
                                onChange={(e) => {
                                    const cat = cats.find(c => c.id === e.target.value);
                                    if (cat) selectCat(cat.id);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                            >
                                {cats.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        🐱 {cat.name}
                                    </option>
                                ))}
                            </select>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">
                                    {t("healthLog.title")}
                                </h1>
                                <p className="text-xs text-gray-600">
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
                </div>
            </div>

            {/* ========== 버튼 영역 (스크롤 가능) ========== */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">

                    {/* 빠른 입력 버튼들 - 작고 정사각형 모양 */}
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-3">
                        <button
                            onClick={quickLogMeal}
                            className="aspect-square flex flex-col items-center justify-center gap-0.5 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-md hover:shadow-lg"
                        >
                            <span className="text-xl">🍽️</span>
                            <span className="text-xs font-semibold">{i18n.language === 'ko' ? '식사' : 'Meal'}</span>
                        </button>
                        <button
                            onClick={quickLogTreat}
                            className="aspect-square flex flex-col items-center justify-center gap-0.5 p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition shadow-md hover:shadow-lg"
                        >
                            <span className="text-xl">🍖</span>
                            <span className="text-xs font-semibold">{i18n.language === 'ko' ? '간식' : 'Treat'}</span>
                        </button>
                        <button
                            onClick={quickLogWater}
                            className="aspect-square flex flex-col items-center justify-center gap-0.5 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md hover:shadow-lg"
                        >
                            <span className="text-xl">💧</span>
                            <span className="text-xs font-semibold">{i18n.language === 'ko' ? '물' : 'Water'}</span>
                        </button>
                        <button
                            onClick={() => setShowMoodModal(true)}
                            className="aspect-square flex flex-col items-center justify-center gap-0.5 p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition shadow-md hover:shadow-lg"
                        >
                            <span className="text-xl">😊</span>
                            <span className="text-xs font-semibold">{i18n.language === 'ko' ? '기분' : 'Mood'}</span>
                        </button>
                        <button
                            onClick={quickLogUrine}
                            className="aspect-square flex flex-col items-center justify-center gap-0.5 p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition shadow-md hover:shadow-lg"
                        >
                            <span className="text-xl">💦</span>
                            <span className="text-xs font-semibold">{i18n.language === 'ko' ? '소변' : 'Urine'}</span>
                        </button>
                        <button
                            onClick={quickLogFeces}
                            className="aspect-square flex flex-col items-center justify-center gap-0.5 p-2 text-white rounded-lg hover:opacity-90 transition shadow-md hover:shadow-lg"
                            style={{ backgroundColor: '#8B4513' }}
                        >
                            <span className="text-xl">💩</span>
                            <span className="text-xs font-semibold">{i18n.language === 'ko' ? '대변' : 'Feces'}</span>
                        </button>
                        <button
                            onClick={() => setShowSymptomChecker(true)}
                            className="aspect-square flex flex-col items-center justify-center gap-0.5 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md hover:shadow-lg"
                        >
                            <span className="text-xl">⚠️</span>
                            <span className="text-xs font-semibold">{i18n.language === 'ko' ? '증상' : 'Symptom'}</span>
                        </button>
                        {/* Voice Input 버튼 */}
                        {isListening ? (
                            <button
                                onClick={handleStopListening}
                                className="aspect-square flex flex-col items-center justify-center gap-0.5 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md hover:shadow-lg animate-pulse"
                            >
                                <span className="text-xl">⏹️</span>
                                <span className="text-xs font-semibold">{i18n.language === 'ko' ? '멈춤' : 'Stop'}</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleVoiceInput}
                                disabled={isProcessing}
                                className={`aspect-square flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg transition shadow-md hover:shadow-lg ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} text-white`}
                            >
                                <span className="text-xl">{isProcessing ? '⏳' : '🎤'}</span>
                                <span className="text-xs font-semibold">{i18n.language === 'ko' ? '음성' : 'Voice'}</span>
                            </button>
                        )}
                    </div>

                    {voiceMessage && (
                        <div
                            className={`mb-3 px-4 py-2 rounded-lg text-sm ${voiceMessage.includes("✅")
                                    ? "bg-green-50 text-green-700"
                                    : voiceMessage.includes("❌")
                                        ? "bg-red-50 text-red-700"
                                        : "bg-blue-50 text-blue-700"
                                }`}
                        >
                            {voiceMessage}
                        </div>
                    )}

                    {/* Detail 버튼 - 크기 유지 */}
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full flex flex-col items-center justify-center gap-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition shadow-md hover:shadow-lg"
                    >
                        <span className="text-2xl">📝</span>
                        <span className="text-sm font-semibold">{i18n.language === 'ko' ? '상세 입력' : 'Detailed Entry'}</span>
                    </button>
                </div>
            </div>

            {/* ========== 메인 콘텐츠 ========== */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* 캘린더 뷰 - 2/3 캘린더 + 1/3 기록 레이아웃 */}
                <div className="flex gap-4">
                    {/* 왼쪽: 캘린더 (2/3) */}
                    <div className="flex-[2] bg-white rounded-lg shadow-md p-6">
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
                        <div className="grid grid-cols-7 gap-2">
                            {renderCalendar()}
                        </div>
                    </div>

                    {/* 오른쪽: 선택된 날짜의 기록 (1/3) */}
                    <div className="flex-[1] bg-white rounded-lg shadow-md p-6 max-h-[800px] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 sticky top-0 bg-white pb-2 border-b">
                            {selectedDate.toLocaleDateString(i18n.language === "ko" ? "ko-KR" : "en-US", {
                                month: "long",
                                day: "numeric"
                            })} {i18n.language === 'ko' ? '기록' : 'Logs'}
                        </h3>

                        {selectedDateLogs.length > 0 ? (
                            <>
                                {/* 칼로리 및 수분 요약 먼저 */}
                                {selectedCat && (
                                    <div className="mb-4">
                                        <DailySummary
                                            cat={selectedCat}
                                            dailyLogs={selectedDateLogs}
                                            date={selectedDate}
                                            wetFoodCaloriesPer100g={quickLogSettings.wetFoodCaloriesPer100g}
                                            dryFoodCaloriesPer100g={quickLogSettings.dryFoodCaloriesPer100g}
                                            snackCaloriesPer100g={quickLogSettings.treatCaloriesPer100g}
                                        />
                                    </div>
                                )}

                                {/* 선택된 날짜의 로그 */}
                                <div className="space-y-3">
                                    {selectedDateLogs.map(log => (
                                        <div key={log.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative group">
                                            <div onClick={() => handleEditLog(log)} className="flex-1 min-w-0 cursor-pointer">
                                                <p className="text-xs text-gray-500 mb-1">{log.time}</p>
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    {log.wetFoodAmount && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{log.wetFoodAmount}g</span>}
                                                    {log.dryFoodAmount && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{log.dryFoodAmount}g</span>}
                                                    {log.snackAmount && <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded">{log.snackAmount}g</span>}
                                                    {log.waterAmount && <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">{log.waterAmount}ml</span>}
                                                    {log.litterCount && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{log.litterCount}{t("healthLog.times")}</span>}
                                                </div>
                                                {log.notes && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{log.notes}</p>}
                                            </div>
                                            <div className="flex flex-col gap-1 flex-shrink-0">
                                                <span className="text-lg">{moodEmojis[log.mood ?? "normal"]}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(i18n.language === 'ko' ? '이 기록을 삭제하시겠습니까?' : 'Delete this log?')) {
                                                            deleteHealthLog(log.id);
                                                            setVoiceMessage(i18n.language === 'ko' ? '✅ 삭제 완료!' : '✅ Deleted!');
                                                            setTimeout(() => setVoiceMessage(''), 2000);
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title={i18n.language === 'ko' ? '삭제' : 'Delete'}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-gray-400 py-8">
                                <p className="text-sm">
                                    {i18n.language === 'ko' ? '기록이 없습니다' : 'No logs for this date'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ========== 설정 모달 ========== */}
            {showSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                            ⚙️ {i18n.language === 'ko' ? '빠른 입력 설정' : 'Quick Log Settings'}
                        </h2>

                        <div className="space-y-5">
                            {/* 사료 기본량 */}
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    🍽️ {i18n.language === 'ko' ? '식사 (사료)' : 'Meal (Food)'}
                                </h3>

                                {/* 사료 타입 선택 */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {i18n.language === 'ko' ? '사료 종류' : 'Food Type'}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setQuickLogSettings({ ...quickLogSettings, mealType: 'wet' })}
                                            className={`px-3 py-2 text-sm rounded-md border-2 transition ${quickLogSettings.mealType === 'wet' ? 'border-blue-500 bg-blue-100 text-blue-700 font-semibold' : 'border-gray-300 bg-white'}`}
                                        >
                                            {i18n.language === 'ko' ? '습식' : 'Wet'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickLogSettings({ ...quickLogSettings, mealType: 'dry' })}
                                            className={`px-3 py-2 text-sm rounded-md border-2 transition ${quickLogSettings.mealType === 'dry' ? 'border-amber-500 bg-amber-100 text-amber-700 font-semibold' : 'border-gray-300 bg-white'}`}
                                        >
                                            {i18n.language === 'ko' ? '건식' : 'Dry'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickLogSettings({ ...quickLogSettings, mealType: 'both' })}
                                            className={`px-3 py-2 text-sm rounded-md border-2 transition ${quickLogSettings.mealType === 'both' ? 'border-orange-500 bg-orange-100 text-orange-700 font-semibold' : 'border-gray-300 bg-white'}`}
                                        >
                                            {i18n.language === 'ko' ? '둘 다' : 'Both'}
                                        </button>
                                    </div>
                                </div>

                                {/* 습식 사료 */}
                                {(quickLogSettings.mealType === 'wet' || quickLogSettings.mealType === 'both') && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                {i18n.language === 'ko' ? '습식 브랜드' : 'Wet Food Brand'}
                                            </label>
                                            <input
                                                type="text"
                                                value={quickLogSettings.wetFoodBrand}
                                                onChange={(e) => setQuickLogSettings({ ...quickLogSettings, wetFoodBrand: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder={i18n.language === 'ko' ? '예: 로얄캐닌' : 'e.g., Royal Canin'}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    {i18n.language === 'ko' ? '1회 급여량 (g)' : 'Amount (g)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={quickLogSettings.wetFoodAmount}
                                                    onChange={(e) => setQuickLogSettings({ ...quickLogSettings, wetFoodAmount: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    min="1"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    {i18n.language === 'ko' ? '칼로리 (kcal/100g)' : 'Calories (kcal/100g)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={quickLogSettings.wetFoodCaloriesPer100g}
                                                    onChange={(e) => setQuickLogSettings({ ...quickLogSettings, wetFoodCaloriesPer100g: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 건식 사료 */}
                                {(quickLogSettings.mealType === 'dry' || quickLogSettings.mealType === 'both') && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                {i18n.language === 'ko' ? '건식 브랜드' : 'Dry Food Brand'}
                                            </label>
                                            <input
                                                type="text"
                                                value={quickLogSettings.dryFoodBrand}
                                                onChange={(e) => setQuickLogSettings({ ...quickLogSettings, dryFoodBrand: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                placeholder={i18n.language === 'ko' ? '예: 나우프레시' : 'e.g., Now Fresh'}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    {i18n.language === 'ko' ? '1회 급여량 (g)' : 'Amount (g)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={quickLogSettings.dryFoodAmount}
                                                    onChange={(e) => setQuickLogSettings({ ...quickLogSettings, dryFoodAmount: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    min="1"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    {i18n.language === 'ko' ? '칼로리 (kcal/100g)' : 'Calories (kcal/100g)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={quickLogSettings.dryFoodCaloriesPer100g}
                                                    onChange={(e) => setQuickLogSettings({ ...quickLogSettings, dryFoodCaloriesPer100g: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 간식 기본 횟수 */}
                            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    🍖 {i18n.language === 'ko' ? '간식 (Treat)' : 'Treat'}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {i18n.language === 'ko' ? '간식 브랜드' : 'Treat Brand'}
                                        </label>
                                        <input
                                            type="text"
                                            value={quickLogSettings.treatBrand}
                                            onChange={(e) => setQuickLogSettings({ ...quickLogSettings, treatBrand: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                            placeholder={i18n.language === 'ko' ? '예: 츄르, 그리니즈' : 'e.g., Churu, Greenies'}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                {i18n.language === 'ko' ? '간식 횟수' : 'Treat Count'}
                                            </label>
                                            <input
                                                type="number"
                                                value={quickLogSettings.treatCount}
                                                onChange={(e) => setQuickLogSettings({ ...quickLogSettings, treatCount: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                                min="1"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {i18n.language === 'ko' ? `약 ${quickLogSettings.treatCount * 5}g (1회당 ~5g)` : `~${quickLogSettings.treatCount * 5}g (~5g/treat)`}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                {i18n.language === 'ko' ? '칼로리 (kcal/100g)' : 'Calories (kcal/100g)'}
                                            </label>
                                            <input
                                                type="number"
                                                value={quickLogSettings.treatCaloriesPer100g}
                                                onChange={(e) => setQuickLogSettings({ ...quickLogSettings, treatCaloriesPer100g: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 물 기본량 */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    💧 {i18n.language === 'ko' ? '물 기본량' : 'Default Water Amount'}
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {i18n.language === 'ko' ? '기본량 (ml)' : 'Amount (ml)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={quickLogSettings.waterAmount}
                                        onChange={(e) => setQuickLogSettings({ ...quickLogSettings, waterAmount: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="1"
                                    />
                                </div>
                            </div>

                            {/* 배변 기본 횟수 */}
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    🚽 {i18n.language === 'ko' ? '배변 기본 횟수' : 'Default Litter Count'}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {i18n.language === 'ko' ? '소변 (회)' : 'Urine (x)'}
                                        </label>
                                        <input
                                            type="number"
                                            value={quickLogSettings.urineCount}
                                            onChange={(e) => setQuickLogSettings({ ...quickLogSettings, urineCount: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {i18n.language === 'ko' ? '대변 (회)' : 'Feces (x)'}
                                        </label>
                                        <input
                                            type="number"
                                            value={quickLogSettings.fecesCount}
                                            onChange={(e) => setQuickLogSettings({ ...quickLogSettings, fecesCount: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            min="0"
                                        />
                                    </div>
                                </div>
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("healthLog.wetFood")} (g)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.wetFoodAmount}
                                            onChange={(e) => setFormData({ ...formData, wetFoodAmount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("healthLog.dryFood")} (g)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.dryFoodAmount}
                                            onChange={(e) => setFormData({ ...formData, dryFoodAmount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("healthLog.snack")} (g)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.snackAmount}
                                            onChange={(e) => setFormData({ ...formData, snackAmount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("healthLog.snackType")}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.snackType}
                                            onChange={(e) => setFormData({ ...formData, snackType: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            placeholder={i18n.language === 'ko' ? "예: 츄르, 져키" : "e.g., Treats, Jerky"}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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

            {/* ========== 증상 체커 모달 ========== */}
            {showSymptomChecker && selectedCat && (
                <SymptomChecker
                    catId={selectedCat.id}
                    catName={selectedCat.name}
                    onSave={(symptom) => {
                        useHealthStore.getState().addSymptom(symptom);
                        setVoiceMessage(
                            i18n.language === 'ko'
                                ? '✅ 증상이 저장되었습니다!'
                                : '✅ Symptom saved!'
                        );
                        setTimeout(() => setVoiceMessage(''), 3000);
                    }}
                    onClose={() => setShowSymptomChecker(false)}
                />
            )}

            {/* ========== Mood 입력 모달 ========== */}
            {showMoodModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            😊 {i18n.language === 'ko' ? '기분 기록' : 'Mood Log'}
                        </h2>

                        <div className="space-y-4">
                            {/* 기분 선택 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    {i18n.language === 'ko' ? '오늘 고양이 기분은?' : "How's your cat feeling?"}
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[
                                        { mood: 'happy', emoji: '😊', color: 'yellow' },
                                        { mood: 'normal', emoji: '😐', color: 'gray' },
                                        { mood: 'sad', emoji: '😢', color: 'blue' },
                                        { mood: 'angry', emoji: '😾', color: 'red' }
                                    ].map((item) => (
                                        <button
                                            key={item.mood}
                                            type="button"
                                            onClick={() => {
                                                if (!selectedCat) return;
                                                const now = new Date();
                                                const log: HealthLog = {
                                                    id: crypto.randomUUID(),
                                                    catId: selectedCat.id,
                                                    date: now.toISOString().split("T")[0],
                                                    time: now.toTimeString().slice(0, 5),
                                                    timestamp: now.getTime(),
                                                    type: 'general',
                                                    activityLevel: "normal",
                                                    mood: item.mood as 'happy' | 'normal' | 'sad' | 'angry',
                                                    notes: "",
                                                };
                                                addHealthLog(log);
                                                setShowMoodModal(false);
                                                const message = i18n.language === "ko" ? `✅ 기분 기록 완료!` : `✅ Mood logged!`;
                                                setVoiceMessage(message);
                                                setTimeout(() => setVoiceMessage(""), 2000);
                                            }}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-${item.color}-300 hover:bg-${item.color}-50 transition`}
                                        >
                                            <span className="text-4xl">{item.emoji}</span>
                                            <span className="text-xs font-medium text-gray-600">
                                                {i18n.language === 'ko'
                                                    ? item.mood === 'happy' ? '기쁨' : item.mood === 'normal' ? '보통' : item.mood === 'sad' ? '슬픔' : '화남'
                                                    : item.mood.charAt(0).toUpperCase() + item.mood.slice(1)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowMoodModal(false)}
                                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                {i18n.language === 'ko' ? '취소' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HealthLogPage;