export interface CatalogProduct {
  readonly seq: number;
  readonly category: string;
  readonly name: string;
  readonly description: string;
  readonly priceIls: number | null;
  readonly priceLabel: string | null;
  readonly priceUnit: 'per_unit' | null;
  readonly status: 'approved';
  readonly images: readonly string[];
}

export const products: readonly CatalogProduct[];
