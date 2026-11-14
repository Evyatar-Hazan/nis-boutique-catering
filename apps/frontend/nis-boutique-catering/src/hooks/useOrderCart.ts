import { useEffect, useMemo, useState } from 'react';
import type { CatalogProduct } from '../../data/products.js';

const storageKey = 'nis-order-cart-v1';

export interface CartLine {
  readonly product: CatalogProduct;
  readonly quantity: number;
  readonly lineTotal: number;
}

type CartState = Readonly<Record<number, number>>;

const readCart = (): CartState => {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) => /^\d+$/u.test(key) && typeof value === 'number' && value > 0,
      ),
    );
  } catch {
    return {};
  }
};

export const useOrderCart = (catalog: readonly CatalogProduct[]) => {
  const [cart, setCart] = useState<CartState>(readCart);
  useEffect(() => window.localStorage.setItem(storageKey, JSON.stringify(cart)), [cart]);

  const lines = useMemo<CartLine[]>(
    () => catalog.flatMap((product) => {
      const quantity = cart[product.seq] ?? 0;
      return quantity > 0 ? [{ product, quantity, lineTotal: product.priceIls * quantity }] : [];
    }),
    [cart, catalog],
  );
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const setQuantity = (seq: number, quantity: number) => {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[seq];
      else next[seq] = quantity;
      return next;
    });
  };

  const clear = () => setCart({});
  return { clear, itemCount, lines, quantities: cart, setQuantity, total } as const;
};
