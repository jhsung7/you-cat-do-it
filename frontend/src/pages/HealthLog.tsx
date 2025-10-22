import React, { useEffect, useState } from 'react';
import { useHealthStore } from '../store/healthStore';
import { useCatStore } from '../store/catStore';
import { HealthLog as HealthLogType } from '../types';
import { useNavigate } from 'react-router-dom';

function HealthLog() {
    const navigate = useNavigate();
    const { selectedCat } = useCatStore();
    const { healthLogs, loadHealthLogs, addHealthLog } = useHealthStore();
    const [showForm, setShowForm] = useState(false);
    
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        foodAmount: '',
        waterAmount: '',
        litterCount: '2',
        activityLevel: 'normal' as 'active' | 'normal' | 'lazy',
        mood: 'normal' as 'happy' | 'normal' | 'sad' | 'angry',
        notes: '',
    });

    useEffect(() => {
        if (selectedCat) {
        loadHealthLogs(selectedCat.id);
        }
    }, [selectedCat, loadHealthLogs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedCat) return;

        const newLog: HealthLogType = {
        id: Date.now().toString(),
        catId: selectedCat.id,
        date: formData.date,
        foodAmount: parseFloat(formData.foodAmount),
        waterAmount: parseFloat(formData.waterAmount),
        litterCount: parseInt(formData.litterCount),
        activityLevel: formData.activityLevel,
        mood: formData.mood,
        notes: formData.notes,
        };

        addHealthLog(newLog);
        setShowForm(false);
        
        // 폼 초기화
        setFormData({
        date: new Date().toISOString().split('T')[0],
        foodAmount: '',
        waterAmount: '',
        litterCount: '2',
        activityLevel: 'normal',
        mood: 'normal',
        notes: '',
        });
    };

    if (!selectedCat) {
        return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
            <div className="text-6xl mb-4">🐱</div>
            <p className="text-xl text-gray-600">고양이를 먼저 선택해주세요</p>
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
            <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
            >
                ← 돌아가기
            </button>
            
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">
                    {selectedCat.name}의 건강 기록
                </h1>
                <p className="text-gray-600">{selectedCat.breed} · {selectedCat.weight}kg</p>
                </div>
                
                <button
                onClick={() => setShowForm(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
                >
                + 오늘 기록 추가
                </button>
            </div>
        </div>

            {/* 기록 추가 폼 */}
            {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">건강 기록 추가</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 날짜 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        날짜
                    </label>
                    <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    </div>

                    {/* 사료량 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        사료 섭취량 (g)
                    </label>
                    <input
                        type="number"
                        required
                        value={formData.foodAmount}
                        onChange={(e) => setFormData({...formData, foodAmount: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 120"
                    />
                    </div>

                    {/* 물 섭취량 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        물 섭취량 (ml)
                    </label>
                    <input
                        type="number"
                        required
                        value={formData.waterAmount}
                        onChange={(e) => setFormData({...formData, waterAmount: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 200"
                    />
                    </div>

                    {/* 배변 횟수 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        배변 횟수
                    </label>
                    <input
                        type="number"
                        required
                        value={formData.litterCount}
                        onChange={(e) => setFormData({...formData, litterCount: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    </div>

                    {/* 활동량 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        활동량
                    </label>
                    <select
                        value={formData.activityLevel}
                        onChange={(e) => setFormData({...formData, activityLevel: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="lazy">무기력</option>
                        <option value="normal">보통</option>
                        <option value="active">활발</option>
                    </select>
                    </div>

                    {/* 기분 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        기분
                    </label>
                    <div className="flex gap-2">
                        {[
                        { value: 'happy', emoji: '😊', label: '행복' },
                        { value: 'normal', emoji: '😐', label: '보통' },
                        { value: 'sad', emoji: '😢', label: '슬픔' },
                        { value: 'angry', emoji: '😠', label: '화남' },
                        ].map(mood => (
                        <button
                            key={mood.value}
                            type="button"
                            onClick={() => setFormData({...formData, mood: mood.value as any})}
                            className={`flex-1 py-3 rounded-lg border-2 transition ${
                            formData.mood === mood.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <div className="text-2xl">{mood.emoji}</div>
                            <div className="text-xs mt-1">{mood.label}</div>
                        </button>
                        ))}
                    </div>
                    </div>

                    {/* 메모 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        메모 (선택)
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="특이사항을 기록하세요"
                    />
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        저장하기
                    </button>
                    </div>
                </form>
                </div>
            </div>
            )}

            {/* 건강 기록 목록 */}
            {healthLogs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                아직 기록이 없어요
                </h2>
                <p className="text-gray-600 mb-6">
                첫 번째 건강 기록을 추가해보세요!
                </p>
            </div>
            ) : (
            <div className="space-y-4">
                {healthLogs
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(log => (
                    <div key={log.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">
                        {new Date(log.date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                        </h3>
                        <div className="text-3xl">
                        {log.mood === 'happy' ? '😊' :
                        log.mood === 'sad' ? '😢' :
                        log.mood === 'angry' ? '😠' : '😐'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                        <p className="text-sm text-gray-600">사료</p>
                        <p className="text-lg font-semibold">{log.foodAmount}g</p>
                        </div>
                        <div>
                        <p className="text-sm text-gray-600">물</p>
                        <p className="text-lg font-semibold">{log.waterAmount}ml</p>
                        </div>
                        <div>
                        <p className="text-sm text-gray-600">배변</p>
                        <p className="text-lg font-semibold">{log.litterCount}회</p>
                        </div>
                        <div>
                        <p className="text-sm text-gray-600">활동량</p>
                        <p className="text-lg font-semibold">
                            {log.activityLevel === 'active' ? '활발' :
                            log.activityLevel === 'lazy' ? '무기력' : '보통'}
                        </p>
                        </div>
                    </div>

                    {log.notes && (
                        <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-1">메모</p>
                        <p className="text-gray-800">{log.notes}</p>
                        </div>
                    )}
                    </div>
                ))}
            </div>
            )}
        </div>
        </div>
    );
}

export default HealthLog;
