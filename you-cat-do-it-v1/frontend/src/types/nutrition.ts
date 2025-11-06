export interface CatNutritionSearchOptions {
  limit?: number;
  dataTypes?: string[];
  requireCatKeyword?: boolean;
}

export interface CatNutritionNutrients {
  caloriesKcal?: number;
  caloriesKcalPer100g?: number;
  proteinGPer100g?: number;
  fatGPer100g?: number;
  fiberGPer100g?: number;
  moistureGPer100g?: number;
}

export interface CatNutritionItem {
  id: number;
  description: string;
  brandOwner?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  nutrients: CatNutritionNutrients;
  source: 'usda';
  dataType: string;
  publicationDate?: string;
  link: string;
}

export interface CatNutritionSearchResult {
  items: CatNutritionItem[];
  totalHits: number;
  page: number;
  pageSize: number;
  source: 'usda';
}
