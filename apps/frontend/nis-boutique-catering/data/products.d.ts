export interface CatalogProduct {
  readonly seq: number;
  readonly category: string;
  readonly name: string;
  readonly description: string;
  readonly priceIls: number;
  readonly priceUnit: 'per_unit' | null;
  readonly status: 'approved';
  readonly images: readonly string[];
}

export const products: readonly CatalogProduct[];
