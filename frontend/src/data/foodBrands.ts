// 인기 고양이 사료 브랜드 칼로리 데이터

export interface FoodBrandData {
  name: string
  wetCalories?: number
  dryCalories?: number
  treatCalories?: number
  wetProtein?: number // g/100g
  dryProtein?: number
  treatProtein?: number
}

export const popularFoodBrands: FoodBrandData[] = [
  { name: '로얄캐닌 습식', wetCalories: 85, wetProtein: 11 },
  { name: '힐스 습식', wetCalories: 82, wetProtein: 10 },
  { name: '웰니스 코어 습식', wetCalories: 90, wetProtein: 12 },
  { name: '아보덤 습식', wetCalories: 88, wetProtein: 10 },
  { name: '자연주의 습식', wetCalories: 80, wetProtein: 9 },

  { name: '로얄캐닌 건식', dryCalories: 385, dryProtein: 32 },
  { name: '나우프레시 건식', dryCalories: 360, dryProtein: 34 },
  { name: '오리젠 6피쉬', dryCalories: 410, dryProtein: 38 },
  { name: '아카나 건식', dryCalories: 400, dryProtein: 35 },
  { name: '힐스 건식', dryCalories: 375, dryProtein: 30 },
  { name: 'ANF 건식', dryCalories: 365, dryProtein: 31 },
  { name: '네츄럴발란스 건식', dryCalories: 370, dryProtein: 32 },

  { name: '츄르', treatCalories: 70, treatProtein: 8 },
  { name: '그리니즈', treatCalories: 320, treatProtein: 25 },
  { name: '덴티비츠', treatCalories: 310, treatProtein: 22 },
  { name: '프리즈드라이 간식', treatCalories: 450, treatProtein: 60 },
  { name: '동결건조 닭고기', treatCalories: 420, treatProtein: 58 },
]

// 브랜드 이름으로 칼로리 찾기
export function findBrandCalories(brandName: string): Partial<FoodBrandData> | null {
  const lower = brandName.toLowerCase()
  const brand = popularFoodBrands.find(
    (b) => b.name.toLowerCase().includes(lower) || lower.includes(b.name.toLowerCase())
  )
  return brand || null
}
