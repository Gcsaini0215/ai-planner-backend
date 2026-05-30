'use strict';

module.exports = [

  // ══════════════════════════════════════════════════════════════
  // WEIGHT GAIN — calorie-dense, high protein, complex carbs
  // ══════════════════════════════════════════════════════════════
  { name: 'Whole Milk',               calories: 61,  protein: 3.2, carbs: 4.8, fat: 3.3,  fiber: 0,   servingSize: '1 cup (240ml)', category: 'dairy',     goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Peanut Butter (natural)',  calories: 588, protein: 25,  carbs: 20,  fat: 50,   fiber: 6,   servingSize: '2 tbsp (32g)',   category: 'fats',      goals: ['weight-gain'],                      isVerified: true },
  { name: 'Almonds',                  calories: 579, protein: 21,  carbs: 22,  fat: 50,   fiber: 12,  servingSize: '30g (≈23 nuts)', category: 'fats',      goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Cashews',                  calories: 553, protein: 18,  carbs: 30,  fat: 44,   fiber: 3,   servingSize: '30g',            category: 'fats',      goals: ['weight-gain'],                      isVerified: true },
  { name: 'Walnuts',                  calories: 654, protein: 15,  carbs: 14,  fat: 65,   fiber: 7,   servingSize: '30g',            category: 'fats',      goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Avocado',                  calories: 160, protein: 2,   carbs: 9,   fat: 15,   fiber: 7,   servingSize: '100g',           category: 'fats',      goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Banana',                   calories: 89,  protein: 1.1, carbs: 23,  fat: 0.3,  fiber: 2.6, servingSize: '1 medium (118g)',category: 'fruits',    goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Brown Rice (cooked)',      calories: 123, protein: 2.7, carbs: 26,  fat: 1,    fiber: 1.8, servingSize: '100g',           category: 'grains',    goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'White Rice (cooked)',      calories: 130, protein: 2.7, carbs: 28,  fat: 0.3,  fiber: 0.4, servingSize: '100g',           category: 'grains',    goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Oats (rolled, dry)',       calories: 389, protein: 17,  carbs: 66,  fat: 7,    fiber: 11,  servingSize: '100g',           category: 'grains',    goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Sweet Potato (baked)',     calories: 90,  protein: 2,   carbs: 21,  fat: 0.1,  fiber: 3.3, servingSize: '100g',           category: 'vegetables',goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Salmon (baked)',           calories: 208, protein: 20,  carbs: 0,   fat: 13,   fiber: 0,   servingSize: '100g',           category: 'protein',   goals: ['weight-gain', 'maintain', 'high-protein'], isVerified: true },
  { name: 'Chicken Thigh (grilled)',  calories: 209, protein: 26,  carbs: 0,   fat: 11,   fiber: 0,   servingSize: '100g',           category: 'protein',   goals: ['weight-gain', 'high-protein'],      isVerified: true },
  { name: 'Whole Eggs (boiled)',      calories: 155, protein: 13,  carbs: 1.1, fat: 11,   fiber: 0,   servingSize: '100g (≈2 eggs)', category: 'protein',   goals: ['weight-gain', 'maintain', 'high-protein'], isVerified: true },
  { name: 'Mass Gainer Shake',        calories: 400, protein: 30,  carbs: 60,  fat: 5,    fiber: 3,   servingSize: '1 scoop (100g)', category: 'protein',   goals: ['weight-gain'],                      isVerified: true },
  { name: 'Whole Wheat Bread',        calories: 247, protein: 13,  carbs: 41,  fat: 3.4,  fiber: 7,   servingSize: '2 slices (60g)', category: 'grains',    goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Pasta (cooked)',           calories: 131, protein: 5,   carbs: 25,  fat: 1.1,  fiber: 1.8, servingSize: '100g',           category: 'grains',    goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Greek Yogurt (full fat)',  calories: 97,  protein: 9,   carbs: 3.6, fat: 5,    fiber: 0,   servingSize: '100g',           category: 'dairy',     goals: ['weight-gain', 'high-protein'],      isVerified: true },
  { name: 'Cottage Cheese (full fat)',calories: 206, protein: 25,  carbs: 6,   fat: 9,    fiber: 0,   servingSize: '100g',           category: 'dairy',     goals: ['weight-gain', 'high-protein'],      isVerified: true },
  { name: 'Paneer',                   calories: 265, protein: 18,  carbs: 1.2, fat: 21,   fiber: 0,   servingSize: '100g',           category: 'dairy',     goals: ['weight-gain', 'high-protein'],      isVerified: true },
  { name: 'Rajma (kidney beans)',     calories: 127, protein: 8.7, carbs: 23,  fat: 0.5,  fiber: 6.4, servingSize: '100g',           category: 'protein',   goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Chickpeas (cooked)',       calories: 164, protein: 9,   carbs: 27,  fat: 2.6,  fiber: 7.6, servingSize: '100g',           category: 'protein',   goals: ['weight-gain', 'maintain'],          isVerified: true },
  { name: 'Dark Chocolate (70%)',     calories: 598, protein: 7.8, carbs: 46,  fat: 43,   fiber: 11,  servingSize: '30g',            category: 'snacks',    goals: ['weight-gain'],                      isVerified: true },
  { name: 'Granola',                  calories: 471, protein: 10,  carbs: 64,  fat: 20,   fiber: 7,   servingSize: '100g',           category: 'grains',    goals: ['weight-gain'],                      isVerified: true },
  { name: 'Olive Oil',                calories: 884, protein: 0,   carbs: 0,   fat: 100,  fiber: 0,   servingSize: '1 tbsp (14g)',   category: 'fats',      goals: ['weight-gain', 'maintain'],          isVerified: true },

  // ══════════════════════════════════════════════════════════════
  // WEIGHT LOSS — low calorie, high fiber, high protein, low fat
  // ══════════════════════════════════════════════════════════════
  { name: 'Chicken Breast (grilled)', calories: 165, protein: 31,  carbs: 0,   fat: 3.6,  fiber: 0,   servingSize: '100g',           category: 'protein',   goals: ['weight-loss', 'maintain', 'high-protein', 'low-carb'], isVerified: true },
  { name: 'Tuna (canned in water)',   calories: 116, protein: 26,  carbs: 0,   fat: 1,    fiber: 0,   servingSize: '100g',           category: 'protein',   goals: ['weight-loss', 'high-protein', 'low-carb'],  isVerified: true },
  { name: 'Egg Whites',               calories: 52,  protein: 11,  carbs: 0.7, fat: 0.2,  fiber: 0,   servingSize: '100g',           category: 'protein',   goals: ['weight-loss', 'high-protein', 'low-carb'],  isVerified: true },
  { name: 'Greek Yogurt (0% fat)',    calories: 59,  protein: 10,  carbs: 3.6, fat: 0.4,  fiber: 0,   servingSize: '100g',           category: 'dairy',     goals: ['weight-loss', 'high-protein'],      isVerified: true },
  { name: 'Cottage Cheese (low fat)', calories: 72,  protein: 12,  carbs: 3,   fat: 1,    fiber: 0,   servingSize: '100g',           category: 'dairy',     goals: ['weight-loss', 'high-protein'],      isVerified: true },
  { name: 'Broccoli (steamed)',       calories: 35,  protein: 2.4, carbs: 7,   fat: 0.4,  fiber: 2.6, servingSize: '100g',           category: 'vegetables',goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Spinach (raw)',            calories: 23,  protein: 2.9, carbs: 3.6, fat: 0.4,  fiber: 2.2, servingSize: '100g',           category: 'vegetables',goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Cucumber (raw)',           calories: 16,  protein: 0.7, carbs: 3.6, fat: 0.1,  fiber: 0.5, servingSize: '100g',           category: 'vegetables',goals: ['weight-loss'],                      isVerified: true },
  { name: 'Celery (raw)',             calories: 16,  protein: 0.7, carbs: 3,   fat: 0.2,  fiber: 1.6, servingSize: '100g',           category: 'vegetables',goals: ['weight-loss'],                      isVerified: true },
  { name: 'Lettuce (raw)',            calories: 15,  protein: 1.4, carbs: 2.9, fat: 0.2,  fiber: 1.3, servingSize: '100g',           category: 'vegetables',goals: ['weight-loss'],                      isVerified: true },
  { name: 'Tomato (raw)',             calories: 18,  protein: 0.9, carbs: 3.9, fat: 0.2,  fiber: 1.2, servingSize: '100g',           category: 'vegetables',goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Zucchini (cooked)',        calories: 17,  protein: 1.2, carbs: 3.5, fat: 0.2,  fiber: 1.1, servingSize: '100g',           category: 'vegetables',goals: ['weight-loss'],                      isVerified: true },
  { name: 'Bell Pepper (raw)',        calories: 31,  protein: 1,   carbs: 6,   fat: 0.3,  fiber: 2.1, servingSize: '100g',           category: 'vegetables',goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Mushrooms (raw)',          calories: 22,  protein: 3.1, carbs: 3.3, fat: 0.3,  fiber: 1,   servingSize: '100g',           category: 'vegetables',goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Cauliflower (steamed)',    calories: 25,  protein: 1.9, carbs: 5,   fat: 0.3,  fiber: 2,   servingSize: '100g',           category: 'vegetables',goals: ['weight-loss', 'low-carb'],          isVerified: true },
  { name: 'Strawberries',            calories: 32,  protein: 0.7, carbs: 7.7, fat: 0.3,  fiber: 2,   servingSize: '100g',           category: 'fruits',    goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Watermelon',              calories: 30,  protein: 0.6, carbs: 7.6, fat: 0.2,  fiber: 0.4, servingSize: '100g',           category: 'fruits',    goals: ['weight-loss'],                      isVerified: true },
  { name: 'Grapefruit',              calories: 42,  protein: 0.8, carbs: 10,  fat: 0.1,  fiber: 1.6, servingSize: '100g',           category: 'fruits',    goals: ['weight-loss'],                      isVerified: true },
  { name: 'Apple',                   calories: 52,  protein: 0.3, carbs: 14,  fat: 0.2,  fiber: 2.4, servingSize: '1 medium (182g)',category: 'fruits',    goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Lentils (cooked)',         calories: 116, protein: 9,   carbs: 20,  fat: 0.4,  fiber: 7.9, servingSize: '100g',           category: 'protein',   goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Quinoa (cooked)',          calories: 120, protein: 4.4, carbs: 22,  fat: 1.9,  fiber: 2.8, servingSize: '100g',           category: 'grains',    goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Whey Protein Shake',       calories: 120, protein: 25,  carbs: 3,   fat: 1.5,  fiber: 1,   servingSize: '1 scoop (30g)', category: 'protein',   goals: ['weight-loss', 'high-protein'],      isVerified: true },
  { name: 'Green Tea',               calories: 2,   protein: 0,   carbs: 0,   fat: 0,    fiber: 0,   servingSize: '1 cup (240ml)', category: 'beverages', goals: ['weight-loss'],                      isVerified: true },
  { name: 'Black Coffee',            calories: 2,   protein: 0.3, carbs: 0,   fat: 0,    fiber: 0,   servingSize: '1 cup (240ml)', category: 'beverages', goals: ['weight-loss'],                      isVerified: true },
  { name: 'Rice Cakes (plain)',       calories: 35,  protein: 0.7, carbs: 7.3, fat: 0.3,  fiber: 0.4, servingSize: '1 cake (9g)',   category: 'snacks',    goals: ['weight-loss'],                      isVerified: true },
  { name: 'Popcorn (air-popped)',    calories: 31,  protein: 1,   carbs: 6.2, fat: 0.4,  fiber: 1.2, servingSize: '1 cup (8g)',    category: 'snacks',    goals: ['weight-loss'],                      isVerified: true },
  { name: 'Dal (yellow, cooked)',    calories: 116, protein: 9,   carbs: 20,  fat: 0.4,  fiber: 7.9, servingSize: '100g',          category: 'protein',   goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Idli (steamed)',          calories: 39,  protein: 2,   carbs: 8,   fat: 0.2,  fiber: 0.5, servingSize: '1 piece (40g)', category: 'grains',    goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Sambar (vegetable)',      calories: 60,  protein: 3,   carbs: 10,  fat: 1,    fiber: 3,   servingSize: '100g',          category: 'other',     goals: ['weight-loss', 'maintain'],          isVerified: true },

  // ══════════════════════════════════════════════════════════════
  // MAINTAIN — balanced macros, moderate calories
  // ══════════════════════════════════════════════════════════════
  { name: 'Chapati / Roti',          calories: 297, protein: 9,   carbs: 55,  fat: 4,    fiber: 5,   servingSize: '1 piece (60g)', category: 'grains',    goals: ['maintain'],                         isVerified: true },
  { name: 'Dosa (plain)',            calories: 168, protein: 4,   carbs: 29,  fat: 4,    fiber: 1.5, servingSize: '1 medium',      category: 'grains',    goals: ['maintain'],                         isVerified: true },
  { name: 'Poha',                    calories: 180, protein: 3.5, carbs: 35,  fat: 4,    fiber: 1.5, servingSize: '1 cup cooked',  category: 'grains',    goals: ['maintain'],                         isVerified: true },
  { name: 'Upma',                    calories: 170, protein: 5,   carbs: 30,  fat: 4,    fiber: 2,   servingSize: '1 cup cooked',  category: 'grains',    goals: ['maintain'],                         isVerified: true },
  { name: 'Chole (chickpea curry)',  calories: 180, protein: 8,   carbs: 28,  fat: 5,    fiber: 8,   servingSize: '100g',          category: 'protein',   goals: ['maintain'],                         isVerified: true },
  { name: 'Mixed Salad Greens',      calories: 20,  protein: 1.5, carbs: 3,   fat: 0.3,  fiber: 2,   servingSize: '100g',          category: 'vegetables',goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Carrot (raw)',            calories: 41,  protein: 0.9, carbs: 10,  fat: 0.2,  fiber: 2.8, servingSize: '100g',          category: 'vegetables',goals: ['weight-loss', 'maintain'],          isVerified: true },
  { name: 'Orange',                  calories: 47,  protein: 0.9, carbs: 12,  fat: 0.1,  fiber: 2.4, servingSize: '1 medium (131g)',category: 'fruits',   goals: ['maintain'],                         isVerified: true },
  { name: 'Mango',                   calories: 60,  protein: 0.8, carbs: 15,  fat: 0.4,  fiber: 1.6, servingSize: '100g',          category: 'fruits',    goals: ['maintain', 'weight-gain'],          isVerified: true },
  { name: 'Blueberries',             calories: 57,  protein: 0.7, carbs: 14,  fat: 0.3,  fiber: 2.4, servingSize: '100g',          category: 'fruits',    goals: ['maintain'],                         isVerified: true },
  { name: 'Low-fat Yogurt',          calories: 63,  protein: 5,   carbs: 7,   fat: 1.5,  fiber: 0,   servingSize: '100g',          category: 'dairy',     goals: ['maintain'],                         isVerified: true },
  { name: 'Cheddar Cheese',          calories: 402, protein: 25,  carbs: 1.3, fat: 33,   fiber: 0,   servingSize: '30g slice',     category: 'dairy',     goals: ['maintain', 'weight-gain', 'low-carb'], isVerified: true },
  { name: 'Protein Bar',             calories: 200, protein: 20,  carbs: 22,  fat: 7,    fiber: 5,   servingSize: '1 bar (60g)',   category: 'snacks',    goals: ['maintain', 'high-protein'],         isVerified: true },
  { name: 'Mixed Nuts',              calories: 607, protein: 20,  carbs: 21,  fat: 54,   fiber: 7,   servingSize: '30g',           category: 'snacks',    goals: ['maintain', 'weight-gain'],          isVerified: true },
  { name: 'Orange Juice (fresh)',    calories: 45,  protein: 0.7, carbs: 10,  fat: 0.2,  fiber: 0.2, servingSize: '100ml',         category: 'beverages', goals: ['maintain'],                         isVerified: true },
  { name: 'Protein Smoothie',        calories: 250, protein: 25,  carbs: 30,  fat: 3,    fiber: 3,   servingSize: '1 glass (350ml)',category: 'beverages', goals: ['maintain', 'weight-gain', 'high-protein'], isVerified: true },

  // ══════════════════════════════════════════════════════════════
  // HIGH PROTEIN & LOW CARB (cross-goal)
  // ══════════════════════════════════════════════════════════════
  { name: 'Turkey Breast (roasted)', calories: 135, protein: 30,  carbs: 0,   fat: 1,    fiber: 0,   servingSize: '100g',          category: 'protein',   goals: ['weight-loss', 'maintain', 'high-protein', 'low-carb'], isVerified: true },
  { name: 'Shrimp (boiled)',         calories: 99,  protein: 24,  carbs: 0.2, fat: 0.3,  fiber: 0,   servingSize: '100g',          category: 'protein',   goals: ['weight-loss', 'high-protein', 'low-carb'],  isVerified: true },
  { name: 'Tofu (firm)',             calories: 76,  protein: 8,   carbs: 1.9, fat: 4.2,  fiber: 0.3, servingSize: '100g',          category: 'protein',   goals: ['weight-loss', 'maintain', 'low-carb'],       isVerified: true },
  { name: 'Tempeh',                  calories: 195, protein: 20,  carbs: 9,   fat: 11,   fiber: 7,   servingSize: '100g',          category: 'protein',   goals: ['weight-gain', 'maintain', 'high-protein'],   isVerified: true },
  { name: 'Sardines (in olive oil)', calories: 208, protein: 25,  carbs: 0,   fat: 11,   fiber: 0,   servingSize: '100g',          category: 'protein',   goals: ['weight-gain', 'maintain', 'high-protein', 'low-carb'], isVerified: true },
];;
