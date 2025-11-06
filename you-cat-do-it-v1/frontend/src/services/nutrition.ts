import type {
  CatNutritionItem,
  CatNutritionSearchOptions,
  CatNutritionSearchResult,
} from '../types';

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const NUTRIENT_IDS = {
  energy: 1008,
  protein: 1003,
  fat: 1004,
  fiber: 1079,
  moisture: 1062,
};

const ensureApiKey = () => {
  const key = import.meta.env.VITE_USDA_API_KEY;
  if (!key) {
    throw new Error('Missing USDA API key. Set VITE_USDA_API_KEY in your environment.');
  }
  return key;
};

const getNutrientValue = (food: any, nutrientId: number): number | undefined =>
  food?.foodNutrients?.find((nutrient: any) => nutrient.nutrientId === nutrientId)?.value;

const derivePer100g = (value: number | undefined, food: any) => {
  if (!value) return undefined;
  const servingSize = food?.servingSize;
  const servingUnit = food?.servingSizeUnit;

  if (typeof servingSize === 'number' && servingSize > 0 && servingUnit === 'g') {
    return (value / servingSize) * 100;
  }

  return undefined;
};

const buildNutritionItem = (food: any): CatNutritionItem => {
  const calories = getNutrientValue(food, NUTRIENT_IDS.energy);
  const protein = getNutrientValue(food, NUTRIENT_IDS.protein);
  const fat = getNutrientValue(food, NUTRIENT_IDS.fat);
  const fiber = getNutrientValue(food, NUTRIENT_IDS.fiber);
  const moisture = getNutrientValue(food, NUTRIENT_IDS.moisture);

  return {
    id: food.fdcId,
    description: food.description,
    brandOwner: food.brandOwner,
    ingredients: food.ingredients,
    servingSize: food.servingSize,
    servingSizeUnit: food.servingSizeUnit,
    publicationDate: food.publicationDate,
    dataType: food.dataType,
    source: 'usda',
    link: `https://fdc.nal.usda.gov/fdc-app.html#/food/${food.fdcId}`,
    nutrients: {
      caloriesKcal: calories,
      caloriesKcalPer100g: derivePer100g(calories, food),
      proteinGPer100g: derivePer100g(protein, food),
      fatGPer100g: derivePer100g(fat, food),
      fiberGPer100g: derivePer100g(fiber, food),
      moistureGPer100g: derivePer100g(moisture, food),
    },
  };
};

const filterCatFoods = (foods: any[], requireKeyword: boolean) => {
  if (!requireKeyword) {
    return foods;
  }

  return foods.filter((food) => {
    const target = `${food.description ?? ''} ${food.brandOwner ?? ''} ${food.ingredients ?? ''}`;
    return /cat/i.test(target);
  });
};

export const searchCatNutrition = async (
  query: string,
  options: CatNutritionSearchOptions = {}
): Promise<CatNutritionSearchResult> => {
  const apiKey = ensureApiKey();
  const response = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      generalSearchInput: query,
      pageSize: options.limit ?? 10,
      pageNumber: 1,
      requireAllWords: true,
      dataType: options.dataTypes ?? ['Branded', 'Survey (FNDDS)'],
    }),
  });

  if (!response.ok) {
    throw new Error(`USDA search failed with status ${response.status}`);
  }

  const payload = await response.json();
  const foods = Array.isArray(payload.foods) ? payload.foods : [];

  const filteredFoods = filterCatFoods(
    foods,
    options.requireCatKeyword ?? true
  );

  return {
    items: filteredFoods.map((food) => buildNutritionItem(food)),
    totalHits: payload.totalHits ?? filteredFoods.length,
    page: payload.currentPage ?? 1,
    pageSize: payload.pageSize ?? options.limit ?? 10,
    source: 'usda',
  };
};

export const getCatNutritionItem = async (fdcId: number): Promise<CatNutritionItem> => {
  const apiKey = ensureApiKey();
  const response = await fetch(`${USDA_BASE_URL}/food/${fdcId}?api_key=${apiKey}`);

  if (!response.ok) {
    throw new Error(`USDA detail lookup failed with status ${response.status}`);
  }

  const payload = await response.json();
  return buildNutritionItem(payload);
};
