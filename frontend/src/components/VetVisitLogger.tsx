import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VetVisit, Prescription } from '../types';

interface VetVisitLoggerProps {
  catId: string;
  onSave: (visit: VetVisit, prescriptions: Prescription[]) => void;
  onClose: () => void;
}

function VetVisitLogger({ catId, onSave, onClose }: VetVisitLoggerProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ko' | 'en';

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hospitalName: '',
    veterinarianName: '',
    visitReason: '',
    diagnosis: '',
    treatment: '',
    nextVisitDate: '',
    cost: '',
    notes: '',
  });

  const [prescriptions, setPrescriptions] = useState<Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate: string;
  }>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hospitalName || !formData.visitReason) {
      alert(lang === 'ko' ? '필수 항목을 입력해주세요.' : 'Please fill required fields.');
      return;
    }

    const dateTime = new Date(formData.date);
    const visit: VetVisit = {
      id: crypto.randomUUID(),
      catId,
      date: formData.date,
      timestamp: dateTime.getTime(),
      hospitalName: formData.hospitalName,
      veterinarianName: formData.veterinarianName || undefined,
      visitReason: formData.visitReason,
      diagnosis: formData.diagnosis || undefined,
      treatment: formData.treatment || undefined,
      nextVisitDate: formData.nextVisitDate || undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      notes: formData.notes || undefined,
    };

    const prescriptionRecords: Prescription[] = prescriptions.map((p) => ({
      id: crypto.randomUUID(),
      catId,
      visitId: visit.id,
      medicationName: p.medicationName,
      dosage: p.dosage,
      frequency: p.frequency,
      startDate: p.startDate,
      endDate: p.endDate,
      completed: false,
    }));

    onSave(visit, prescriptionRecords);
    onClose();
  };

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        medicationName: '',
        dosage: '',
        frequency: lang === 'ko' ? '하루 1회' : 'Once daily',
        startDate: formData.date,
        endDate: '',
      },
    ]);
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            🏥 {lang === 'ko' ? '병원 방문 기록' : 'Vet Visit Record'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">
              {lang === 'ko' ? '기본 정보' : 'Basic Information'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'ko' ? '방문 날짜' : 'Visit Date'} *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'ko' ? '병원명' : 'Hospital Name'} *
                </label>
                <input
                  type="text"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ko' ? '수의사명' : 'Veterinarian Name'}
              </label>
              <input
                type="text"
                value={formData.veterinarianName}
                onChange={(e) => setFormData({ ...formData, veterinarianName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ko' ? '방문 사유 / 주 증상' : 'Visit Reason / Symptoms'} *
              </label>
              <textarea
                value={formData.visitReason}
                onChange={(e) => setFormData({ ...formData, visitReason: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={lang === 'ko' ? '예: 구토, 식욕부진' : 'e.g., Vomiting, loss of appetite'}
                required
              />
            </div>
          </div>

          {/* 진단 및 치료 */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-bold text-gray-800">
              {lang === 'ko' ? '진단 및 치료' : 'Diagnosis & Treatment'}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ko' ? '진단명' : 'Diagnosis'}
              </label>
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={lang === 'ko' ? '예: 급성 위장염' : 'e.g., Acute gastritis'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ko' ? '치료 내용' : 'Treatment'}
              </label>
              <textarea
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={lang === 'ko' ? '예: 수액 치료, 항생제 주사' : 'e.g., IV fluids, antibiotic injection'}
              />
            </div>
          </div>

          {/* 처방약 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                💊 {lang === 'ko' ? '처방약' : 'Prescriptions'} ({prescriptions.length})
              </h3>
              <button
                type="button"
                onClick={addPrescription}
                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
              >
                + {lang === 'ko' ? '약 추가' : 'Add Medicine'}
              </button>
            </div>

            {prescriptions.map((prescription, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {lang === 'ko' ? '약' : 'Medicine'} #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePrescription(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    ✕ {lang === 'ko' ? '삭제' : 'Remove'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={prescription.medicationName}
                    onChange={(e) => updatePrescription(index, 'medicationName', e.target.value)}
                    placeholder={lang === 'ko' ? '약품명' : 'Medication name'}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={prescription.dosage}
                    onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                    placeholder={lang === 'ko' ? '용량 (예: 0.5ml)' : 'Dosage (e.g., 0.5ml)'}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={prescription.frequency}
                    onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option>{lang === 'ko' ? '하루 1회' : 'Once daily'}</option>
                    <option>{lang === 'ko' ? '하루 2회' : 'Twice daily'}</option>
                    <option>{lang === 'ko' ? '하루 3회' : 'Three times daily'}</option>
                  </select>
                  <input
                    type="date"
                    value={prescription.startDate}
                    onChange={(e) => updatePrescription(index, 'startDate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="date"
                    value={prescription.endDate}
                    onChange={(e) => updatePrescription(index, 'endDate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder={lang === 'ko' ? '종료일' : 'End date'}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 추가 정보 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'ko' ? '재진 날짜' : 'Next Visit Date'}
                </label>
                <input
                  type="date"
                  value={formData.nextVisitDate}
                  onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'ko' ? '진료비' : 'Cost'} (₩)
                </label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ko' ? '메모' : 'Notes'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={lang === 'ko' ? '추가 메모...' : 'Additional notes...'}
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              {lang === 'ko' ? '취소' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              {lang === 'ko' ? '저장' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VetVisitLogger;
