// 인기 고양이 사료 브랜드 칼로리 데이터

export interface FoodBrandData {
  name: string;
  wetCalories?: number; // kcal/100g
  dryCalories?: number; // kcal/100g
  treatCalories?: number; // kcal/100g
}

export const popularFoodBrands: FoodBrandData[] = [
  // 습식 사료
  { name: "로얄캐닌 습식", wetCalories: 85 },
  { name: "힐스 습식", wetCalories: 82 },
  { name: "웰니스 코어 습식", wetCalories: 90 },
  { name: "아보덤 습식", wetCalories: 88 },
  { name: "자연주의 습식", wetCalories: 80 },

  // 건식 사료
  { name: "로얄캐닌 건식", dryCalories: 385 },
  { name: "나우프레시 건식", dryCalories: 360 },
  { name: "오리젠 6피쉬", dryCalories: 410 },
  { name: "아카나 건식", dryCalories: 400 },
  { name: "힐스 건식", dryCalories: 375 },
  { name: "ANF 건식", dryCalories: 365 },
  { name: "네츄럴발란스 건식", dryCalories: 370 },

  // 간식
  { name: "츄르", treatCalories: 70 },
  { name: "그리니즈", treatCalories: 320 },
  { name: "덴티비츠", treatCalories: 310 },
  { name: "프리즈드라이 간식", treatCalories: 450 },
  { name: "동결건조 닭고기", treatCalories: 420 },
];

// 브랜드 이름으로 칼로리 찾기
export function findBrandCalories(brandName: string): Partial<FoodBrandData> | null {
  const brand = popularFoodBrands.find(b =>
    b.name.toLowerCase().includes(brandName.toLowerCase()) ||
    brandName.toLowerCase().includes(b.name.toLowerCase())
  );
  return brand || null;
}
