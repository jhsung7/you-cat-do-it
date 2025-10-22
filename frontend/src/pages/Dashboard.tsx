import React, { useEffect, useState } from 'react';
import { useCatStore } from '../store/catStore';
import { Cat } from '../types';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const { cats, loadCats, addCat, selectCat } = useCatStore(); 
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    
    // 폼 데이터
    const [formData, setFormData] = useState({
        name: '',
        breed: '',
        weight: '',
        gender: 'male' as 'male' | 'female' | 'unknown',
        neutered: false,
        birthDate: '',
    });

    useEffect(() => {
        loadCats();
    }, [loadCats]);

    // 폼 제출
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newCat: Cat = {
        id: Date.now().toString(),
        name: formData.name,
        breed: formData.breed,
        weight: parseFloat(formData.weight),
        gender: formData.gender,
        neutered: formData.neutered,
        birthDate: formData.birthDate,
        };

        addCat(newCat);
        
        // 폼 초기화
        setFormData({
        name: '',
        breed: '',
        weight: '',
        gender: 'male',
        neutered: false,
        birthDate: '',
        });
        setShowForm(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
            {/* 헤더 */}
            <div className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🐈‍⬛ 고양이 건강 관리
                </h1>
                <p className="text-gray-600">
                우리 고양이들의 건강을 한눈에!
                </p>
            </div>
            
            {/* 고양이 추가 버튼 (고양이가 있을 때도 보임) */}
            {cats.length > 0 && (
                <button
                onClick={() => setShowForm(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
                >
                + 고양이 추가
                </button>
            )}
            </div>

            {/* 고양이 추가 폼 (모달) */}
            {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-6">새 고양이 등록</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 이름 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        이름 *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="예: 후추"
                    />
                    </div>

                    {/* 품종 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        품종 *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.breed}
                        onChange={(e) => setFormData({...formData, breed: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="예: 코리안숏헤어"
                    />
                    </div>

                    {/* 체중 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        체중 (kg) *
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="예: 4.5"
                    />
                    </div>

                    {/* 생년월일 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        생년월일
                    </label>
                    <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    </div>

                    {/* 성별 */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        성별
                    </label>
                    <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="male">수컷</option>
                        <option value="female">암컷</option>
                        <option value="unknown">미상</option>
                    </select>
                    </div>

                    {/* 중성화 */}
                    <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="neutered"
                        checked={formData.neutered}
                        onChange={(e) => setFormData({...formData, neutered: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="neutered" className="ml-2 text-sm text-gray-700">
                        중성화 완료
                    </label>
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
                        등록하기
                    </button>
                    </div>
                </form>
                </div>
            </div>
            )}

            {/* 고양이 목록 */}
            {cats.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🐈</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                아직 등록된 고양이가 없어요
                </h2>
                <p className="text-gray-600 mb-6">
                첫 번째 고양이를 등록해보세요!
                </p>
                <button
                onClick={() => setShowForm(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
                >
                고양이 추가하기
                </button>
            </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cats.map(cat => (
                <div
                    key={cat.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                    <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                        🐱
                    </div>
                    <div className="ml-4">
                        <h3 className="text-xl font-bold text-gray-800">
                        {cat.name}
                        </h3>
                        <p className="text-sm text-gray-600">{cat.breed}</p>
                    </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">체중</span>
                        <span className="font-semibold">{cat.weight}kg</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">성별</span>
                        <span className="font-semibold">
                        {cat.gender === 'male' ? '수컷' : 
                        cat.gender === 'female' ? '암컷' : '미상'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">중성화</span>
                        <span className="font-semibold">
                        {cat.neutered ? '완료' : '미완료'}
                        </span>
                    </div>
                    </div>
                    
                    <button
                        onClick={() => {
                            selectCat(cat.id);
                            navigate('/health-log');
                        }}
                        className="w-full mt-4 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition"
                        >
                        건강 기록 보기
                        </button>
                </div>
                ))}
            </div>
            )}
        </div>
        </div>
    );
}

export default Dashboard;