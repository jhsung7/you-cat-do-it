import { describe, it, expect } from 'vitest';
import {
  calculateRER,
  calculateDER,
  estimateFoodCalories,
  calculateRecommendedWater,
  analyzeCalorieIntake,
  analyzeWaterIntake,
  getDailySummary,
} from './calorieCalculator';

describe('calculateRER', () => {
  it('should calculate RER for a 4kg cat correctly', () => {
    const result = calculateRER(4);
    expect(result).toBeCloseTo(197.99, 0.5);
  });

  it('should calculate RER for a 3kg cat correctly', () => {
    const result = calculateRER(3);
    expect(result).toBeCloseTo(159.57, 0.5);
  });

  it('should calculate RER for a 6kg cat correctly', () => {
    const result = calculateRER(6);
    expect(result).toBeCloseTo(268.36, 0.5);
  });

  it('should handle decimal weights', () => {
    const result = calculateRER(4.5);
    expect(result).toBeGreaterThan(0);
  });
});

describe('calculateDER', () => {
  it('should calculate DER for a neutered normal cat', () => {
    const result = calculateDER(4, true, 'normal');
    expect(result).toBe(238); // 198.43 * 1.2 ≈ 238
  });

  it('should calculate DER for a non-neutered normal cat', () => {
    const result = calculateDER(4, false, 'normal');
    expect(result).toBe(277); // 197.99 * 1.4 ≈ 277
  });

  it('should calculate DER for an active neutered cat', () => {
    const result = calculateDER(4, true, 'active');
    expect(result).toBe(277); // 197.99 * 1.4 ≈ 277
  });

  it('should calculate DER for a lazy neutered cat', () => {
    const result = calculateDER(4, true, 'lazy');
    expect(result).toBe(198); // 198.43 * 1.0 ≈ 198
  });

  it('should return different values for neutered vs non-neutered', () => {
    const neutered = calculateDER(4, true, 'normal');
    const notNeutered = calculateDER(4, false, 'normal');
    expect(notNeutered).toBeGreaterThan(neutered);
  });
});

describe('estimateFoodCalories', () => {
  it('should calculate calories for wet food only', () => {
    const result = estimateFoodCalories(100, 0, 0, 85, 375, 400);
    expect(result).toBe(85); // 100g * 85kcal/100g = 85kcal
  });

  it('should calculate calories for dry food only', () => {
    const result = estimateFoodCalories(0, 50, 0, 85, 375, 400);
    expect(result).toBe(188); // 50g * 375kcal/100g = 187.5 ≈ 188
  });

  it('should calculate calories for snacks only', () => {
    const result = estimateFoodCalories(0, 0, 10, 85, 375, 400);
    expect(result).toBe(40); // 10g * 400kcal/100g = 40kcal
  });

  it('should calculate total calories for mixed diet', () => {
    const result = estimateFoodCalories(100, 30, 5, 85, 375, 400);
    // 100*0.85 + 30*3.75 + 5*4 = 85 + 112.5 + 20 = 217.5 ≈ 218
    expect(result).toBe(218);
  });

  it('should return 0 for no food', () => {
    const result = estimateFoodCalories(0, 0, 0);
    expect(result).toBe(0);
  });

  it('should use default calorie values when not provided', () => {
    const result = estimateFoodCalories(100, 50, 10);
    expect(result).toBeGreaterThan(0);
  });
});

describe('calculateRecommendedWater', () => {
  it('should calculate water for a 4kg cat', () => {
    const result = calculateRecommendedWater(4);
    expect(result).toBe(220); // 4kg * 55ml/kg = 220ml
  });

  it('should calculate water for a 3kg cat', () => {
    const result = calculateRecommendedWater(3);
    expect(result).toBe(165); // 3kg * 55ml/kg = 165ml
  });

  it('should calculate water for a 6kg cat', () => {
    const result = calculateRecommendedWater(6);
    expect(result).toBe(330); // 6kg * 55ml/kg = 330ml
  });

  it('should handle decimal weights', () => {
    const result = calculateRecommendedWater(4.5);
    expect(result).toBe(248); // 4.5kg * 55ml/kg = 247.5 ≈ 248
  });
});

describe('analyzeCalorieIntake', () => {
  it('should return "low" status for under 80%', () => {
    const result = analyzeCalorieIntake(150, 200);
    expect(result.status).toBe('low');
    expect(result.percentage).toBe(75);
    expect(result.message).toContain('75%');
  });

  it('should return "normal" status for 80-120%', () => {
    const result = analyzeCalorieIntake(200, 200);
    expect(result.status).toBe('normal');
    expect(result.percentage).toBe(100);
    expect(result.messageEn).toContain('normal range');
  });

  it('should return "high" status for over 120%', () => {
    const result = analyzeCalorieIntake(250, 200);
    expect(result.status).toBe('high');
    expect(result.percentage).toBe(125);
    expect(result.message).toContain('125%');
  });

  it('should have both Korean and English messages', () => {
    const result = analyzeCalorieIntake(200, 200);
    expect(result.message).toBeTruthy();
    expect(result.messageEn).toBeTruthy();
  });
});

describe('analyzeWaterIntake', () => {
  it('should return "low" status for under 70%', () => {
    const result = analyzeWaterIntake(100, 4); // 100ml vs recommended 220ml ≈ 45%
    expect(result.status).toBe('low');
    expect(result.percentage).toBe(45);
    expect(result.messageEn).toContain('dehydration');
  });

  it('should return "normal" status for 70-150%', () => {
    const result = analyzeWaterIntake(220, 4); // 220ml vs recommended 220ml = 100%
    expect(result.status).toBe('normal');
    expect(result.percentage).toBe(100);
  });

  it('should return "high" status for over 150%', () => {
    const result = analyzeWaterIntake(350, 4); // 350ml vs recommended 220ml ≈ 159%
    expect(result.status).toBe('high');
    expect(result.percentage).toBe(159);
    expect(result.messageEn).toContain('illness');
  });

  it('should have both Korean and English messages', () => {
    const result = analyzeWaterIntake(220, 4);
    expect(result.message).toBeTruthy();
    expect(result.messageEn).toBeTruthy();
  });
});

describe('getDailySummary', () => {
  const mockCat = {
    id: '1',
    name: 'Fluffy',
    breed: 'Persian',
    birthDate: '2020-01-01',
    weight: 4,
    gender: 'female' as const,
    neutered: true,
  };

  it('should calculate daily summary correctly', () => {
    const mockLogs = [
      { wetFoodAmount: 50, dryFoodAmount: 20, snackAmount: 5, waterAmount: 100 },
      { wetFoodAmount: 50, dryFoodAmount: 20, snackAmount: 5, waterAmount: 120 },
    ];

    const result = getDailySummary(mockCat, mockLogs);

    expect(result.totalWetFood).toBe(100);
    expect(result.totalDryFood).toBe(40);
    expect(result.totalSnacks).toBe(10);
    expect(result.totalWater).toBe(220);
    expect(result.estimatedCalories).toBeGreaterThan(0);
    expect(result.recommendedCalories).toBeGreaterThan(0);
    expect(result.recommendedWater).toBe(220);
    expect(result.calorieAnalysis).toBeDefined();
    expect(result.waterAnalysis).toBeDefined();
  });

  it('should handle empty logs array', () => {
    const result = getDailySummary(mockCat, []);

    expect(result.totalWetFood).toBe(0);
    expect(result.totalDryFood).toBe(0);
    expect(result.totalSnacks).toBe(0);
    expect(result.totalWater).toBe(0);
    expect(result.estimatedCalories).toBe(0);
  });

  it('should handle logs with missing fields', () => {
    const mockLogs = [
      { wetFoodAmount: 50 }, // missing other fields
      { dryFoodAmount: 20 },
    ];

    const result = getDailySummary(mockCat, mockLogs);

    expect(result.totalWetFood).toBe(50);
    expect(result.totalDryFood).toBe(20);
    expect(result.totalSnacks).toBe(0);
    expect(result.totalWater).toBe(0);
  });

  it('should use custom calorie values when provided', () => {
    const mockLogs = [
      { wetFoodAmount: 100, dryFoodAmount: 50, snackAmount: 10, waterAmount: 200 },
    ];

    const result1 = getDailySummary(mockCat, mockLogs, 85, 375, 400);
    const result2 = getDailySummary(mockCat, mockLogs, 100, 350, 300);

    expect(result1.estimatedCalories).not.toBe(result2.estimatedCalories);
  });
});
