export interface FoodBrandData {
  name: string;
  wetCalories?: number; // kcal/100g
  dryCalories?: number; // kcal/100g
  treatCalories?: number; // kcal/100g
}

export const popularFoodBrands: FoodBrandData[] = [
  // Wet food brands
  { name: "로얄캐닌 습식", wetCalories: 85 },
  { name: "Royal Canin Wet", wetCalories: 85 },
  { name: "힐스 습식", wetCalories: 82 },
  { name: "Hill's Wet", wetCalories: 82 },
  { name: "웰니스 코어 습식", wetCalories: 90 },
  { name: "Wellness Core Wet", wetCalories: 90 },
  { name: "아보덤 습식", wetCalories: 88 },
  { name: "AvoDerm Wet", wetCalories: 88 },
  { name: "자연주의 습식", wetCalories: 80 },
  { name: "Nature Wet", wetCalories: 80 },
  { name: "Royal Canin Light Weight Pouch", wetCalories: 64.4 },

  // Dry food brands
  { name: "로얄캐닌 건식", dryCalories: 385 },
  { name: "Royal Canin Dry", dryCalories: 385 },
  { name: "나우프레시 건식", dryCalories: 360 },
  { name: "Now Fresh Dry", dryCalories: 360 },
  { name: "오리젠 6피쉬", dryCalories: 410 },
  { name: "Orijen 6 Fish", dryCalories: 410 },
  { name: "아카나 건식", dryCalories: 400 },
  { name: "Acana Dry", dryCalories: 400 },
  { name: "힐스 건식", dryCalories: 375 },
  { name: "Hill's Dry", dryCalories: 375 },
  { name: "ANF 건식", dryCalories: 365 },
  { name: "ANF Dry", dryCalories: 365 },
  { name: "네츄럴발란스 건식", dryCalories: 370 },
  { name: "Natural Balance Dry", dryCalories: 370 },

  // Treat
  { name: "츄르", treatCalories: 70 },
  { name: "Churu", treatCalories: 70 },
  { name: "그리니즈", treatCalories: 320 },
  { name: "Greenies", treatCalories: 320 },
  { name: "덴티비츠", treatCalories: 310 },
  { name: "Denti-Bites", treatCalories: 310 },
  { name: "프리즈드라이 간식", treatCalories: 450 },
  { name: "Freeze-dried Treat", treatCalories: 450 },
  { name: "동결건조 닭고기", treatCalories: 420 },
  { name: "Freeze-dried Chicken", treatCalories: 420 },
];

// 브랜드 이름으로 칼로리 찾기
export function findBrandCalories(brandName: string): Partial<FoodBrandData> | null {
  const brand = popularFoodBrands.find(b =>
    b.name.toLowerCase().includes(brandName.toLowerCase()) ||
    brandName.toLowerCase().includes(b.name.toLowerCase())
  );
  return brand || null;
}
