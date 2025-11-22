// 고양이 칼로리 계산 유틸리티

import { Cat } from '../types/cat';

/**
 * 고양이의 기초대사량(RER: Resting Energy Requirement) 계산
 * RER = 70 × (체중kg)^0.75 
 */ 
export function calculateRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

/**
 * 고양이의 일일 권장 칼로리(DER: Daily Energy Requirement) 계산
 * 활동량과 중성화 여부를 고려
 */
export function calculateDER(
  weightKg: number,
  neutered: boolean,
  activityLevel: 'active' | 'normal' | 'lazy' = 'normal'
): number {
  const rer = calculateRER(weightKg);

  // 활동 계수 결정
  let activityFactor: number;

  if (activityLevel === 'active') {
    activityFactor = neutered ? 1.4 : 1.6;
  } else if (activityLevel === 'lazy') {
    activityFactor = neutered ? 1.0 : 1.2;
  } else {
    // normal
    activityFactor = neutered ? 1.2 : 1.4;
  }

  return Math.round(rer * activityFactor);
}

/**
 * 사료/간식의 칼로리 추정
 * 일반적인 고양이 사료 칼로리: 습식 약 70-100kcal/100g, 건식 약 350-400kcal/100g
 */
export function estimateFoodCalories(
  wetFoodGrams: number = 0,
  dryFoodGrams: number = 0,
  snackGrams: number = 0,
  wetFoodCaloriesPer100g: number = 85,
  dryFoodCaloriesPer100g: number = 375,
  snackCaloriesPer100g: number = 400
): number {
  const wetFoodCalories = wetFoodGrams * (wetFoodCaloriesPer100g / 100);
  const dryFoodCalories = dryFoodGrams * (dryFoodCaloriesPer100g / 100);
  const snackCalories = snackGrams * (snackCaloriesPer100g / 100);

  return Math.round(wetFoodCalories + dryFoodCalories + snackCalories);
}

/**
 * 일일 권장 수분 섭취량 계산
 * 일반적으로 체중 1kg당 50-60ml
 */
export function calculateRecommendedWater(weightKg: number): number {
  return Math.round(weightKg * 55); // 평균 55ml/kg
}

/**
 * 칼로리 섭취 상태 분석
 */
export function analyzeCalorieIntake(
  actualCalories: number,
  recommendedCalories: number
): {
  status: 'low' | 'normal' | 'high';
  percentage: number;
  message: string;
  messageEn: string;
} {
  const percentage = Math.round((actualCalories / recommendedCalories) * 100);

  if (percentage < 80) {
    return {
      status: 'low',
      percentage,
      message: `권장량의 ${percentage}%만 섭취했습니다. 식사량을 늘리는 것을 고려하세요.`,
      messageEn: `Only ${percentage}% of recommended intake. Consider increasing food amount.`
    };
  } else if (percentage > 120) {
    return {
      status: 'high',
      percentage,
      message: `권장량의 ${percentage}%를 섭취했습니다. 과식 주의가 필요합니다.`,
      messageEn: `${percentage}% of recommended intake. Be careful of overfeeding.`
    };
  } else {
    return {
      status: 'normal',
      percentage,
      message: `적정 칼로리를 섭취하고 있습니다.`,
      messageEn: `Calorie intake is within normal range.`
    };
  }
}

/**
 * 수분 섭취 상태 분석
 */
export function analyzeWaterIntake(
  actualWaterMl: number,
  weightKg: number
): {
  status: 'low' | 'normal' | 'high';
  percentage: number;
  message: string;
  messageEn: string;
} {
  const recommended = calculateRecommendedWater(weightKg);
  const percentage = Math.round((actualWaterMl / recommended) * 100);

  if (percentage < 70) {
    return {
      status: 'low',
      percentage,
      message: `권장 수분량의 ${percentage}%만 섭취했습니다. 탈수 주의가 필요합니다.`,
      messageEn: `Only ${percentage}% of recommended water intake. Risk of dehydration.`
    };
  } else if (percentage > 150) {
    return {
      status: 'high',
      percentage,
      message: `권장 수분량의 ${percentage}%를 섭취했습니다. 과다 섭취이거나 질병 가능성을 확인하세요.`,
      messageEn: `${percentage}% of recommended water intake. May indicate illness - consult vet.`
    };
  } else {
    return {
      status: 'normal',
      percentage,
      message: `적정 수분을 섭취하고 있습니다.`,
      messageEn: `Water intake is within normal range.`
    };
  }
}

/**
 * 일일 칼로리 및 수분 섭취 요약
 */
export function getDailySummary(
  cat: Cat,
  dailyLogs: any[],
  wetFoodCaloriesPer100g: number = 85,
  dryFoodCaloriesPer100g: number = 375,
  snackCaloriesPer100g: number = 400
) {
  const totalWetFood = dailyLogs.reduce((sum, log) => sum + (log.wetFoodAmount || 0), 0);
  const totalDryFood = dailyLogs.reduce((sum, log) => sum + (log.dryFoodAmount || 0), 0);
  const totalSnacks = dailyLogs.reduce((sum, log) => sum + (log.snackAmount || 0), 0);
  const totalWater = dailyLogs.reduce((sum, log) => sum + (log.waterAmount || 0), 0);

  const estimatedCalories = estimateFoodCalories(
    totalWetFood,
    totalDryFood,
    totalSnacks,
    wetFoodCaloriesPer100g,
    dryFoodCaloriesPer100g,
    snackCaloriesPer100g
  );
  const recommendedCalories = calculateDER(cat.weight, cat.neutered);
  const recommendedWater = calculateRecommendedWater(cat.weight);

  const calorieAnalysis = analyzeCalorieIntake(estimatedCalories, recommendedCalories);
  const waterAnalysis = analyzeWaterIntake(totalWater, cat.weight);

  return {
    totalWetFood,
    totalDryFood,
    totalSnacks,
    totalWater,
    estimatedCalories,
    recommendedCalories,
    recommendedWater,
    calorieAnalysis,
    waterAnalysis,
  };
}
