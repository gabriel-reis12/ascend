export interface Food {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  category: string;
  is_custom: boolean;
  serving_size?: number;
  serving_unit?: string;
  created_by: string | null;
  created_at: string;
}
