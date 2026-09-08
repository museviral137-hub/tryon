import { Garment, Customer } from '../types';

/**
 * Normalizes user typed Product IDs into standardized format (e.g., J002).
 * Handles: "j2" -> "J002", "J 2" -> "J002", "j002" -> "J002", "j-2" -> "J002", "2" -> "J002"
 */
export function normalizeProductId(input: string, defaultPrefix: string = 'J'): string {
  if (!input) return '';
  
  const cleaned = input.trim().toUpperCase().replace(/[\s\-_#]/g, '');
  if (!cleaned) return '';

  // Case 1: Match Prefix + Number (e.g., J2, J02, J002, K5, S12)
  const prefixMatch = cleaned.match(/^([A-Z]+)(\d+)$/);
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    const num = parseInt(prefixMatch[2], 10);
    return `${prefix}${String(num).padStart(3, '0')}`;
  }

  // Case 2: Only numbers typed (e.g., "2" -> "J002")
  const numOnlyMatch = cleaned.match(/^(\d+)$/);
  if (numOnlyMatch) {
    const num = parseInt(numOnlyMatch[1], 10);
    return `${defaultPrefix.toUpperCase()}${String(num).padStart(3, '0')}`;
  }

  // Case 3: Starts with number then letters or single letter
  return cleaned;
}

/**
 * Generate next unique product ID based on existing garments
 * e.g., if J001-J006 exist, returns J007
 */
export function generateProductId(
  existingGarments: Garment[],
  prefix: string = 'J',
  startNum: number = 1
): string {
  const cleanPrefix = (prefix || 'J').toUpperCase().trim();
  let maxNum = startNum - 1;

  for (const g of existingGarments) {
    const pId = (g.productId || '').toUpperCase().trim();
    if (pId.startsWith(cleanPrefix)) {
      const numPart = pId.substring(cleanPrefix.length);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${cleanPrefix}${String(nextNum).padStart(3, '0')}`;
}

/**
 * Generate next unique customer ID based on existing customers
 * e.g., if C001-C004 exist, returns C005
 */
export function generateCustomerId(
  existingCustomers: Customer[],
  prefix: string = 'C',
  startNum: number = 1
): string {
  const cleanPrefix = (prefix || 'C').toUpperCase().trim();
  let maxNum = startNum - 1;

  for (const c of existingCustomers) {
    const cId = (c.customerId || '').toUpperCase().trim();
    if (cId.startsWith(cleanPrefix)) {
      const numPart = cId.substring(cleanPrefix.length);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${cleanPrefix}${String(nextNum).padStart(3, '0')}`;
}

/**
 * Intelligent single garment finder:
 * - Checks exact productId
 * - Checks normalized productId (e.g. user typed "j2" matches "J002")
 * - Checks numeric portion
 */
export function findGarmentBySmartQuery(garments: Garment[], query: string): Garment | null {
  if (!query || !query.trim()) return null;
  const raw = query.trim();
  const normalized = normalizeProductId(raw);
  const upperRaw = raw.toUpperCase().replace(/\s+/g, '');

  // 1. Direct exact match on Product ID (case insensitive)
  const exact = garments.find(g => g.productId.toUpperCase() === upperRaw);
  if (exact) return exact;

  // 2. Normalized match (e.g. J2 -> J002)
  const normalizedMatch = garments.find(g => g.productId.toUpperCase() === normalized);
  if (normalizedMatch) return normalizedMatch;

  // 3. Numeric match if input is just digit (e.g. 2 -> J002)
  const numOnly = parseInt(raw, 10);
  if (!isNaN(numOnly)) {
    const numMatch = garments.find(g => {
      const gNum = parseInt(g.productId.replace(/\D/g, ''), 10);
      return gNum === numOnly;
    });
    if (numMatch) return numMatch;
  }

  return null;
}

/**
 * Filter & search garments for autocomplete & library
 */
export function searchGarments(garments: Garment[], query: string, categoryFilter: string = 'All'): Garment[] {
  let list = garments;

  if (categoryFilter && categoryFilter !== 'All') {
    list = list.filter(g => g.category.toLowerCase() === categoryFilter.toLowerCase());
  }

  if (!query || !query.trim()) {
    return list;
  }

  const q = query.trim().toLowerCase();
  const normalizedQ = normalizeProductId(query).toLowerCase();

  return list.filter(g => {
    const pId = g.productId.toLowerCase();
    const name = g.name.toLowerCase();
    const cat = g.category.toLowerCase();
    const brand = (g.brand || '').toLowerCase();
    const color = (g.color || '').toLowerCase();

    // Match if ID starts with or contains query or normalized query
    if (pId === normalizedQ || pId.includes(q)) return true;
    if (name.includes(q)) return true;
    if (cat.includes(q)) return true;
    if (brand.includes(q)) return true;
    if (color.includes(q)) return true;

    // Check if query is short like "j2" and product is "j002"
    const digitsInQuery = q.replace(/\D/g, '');
    const digitsInId = pId.replace(/\D/g, '');
    if (digitsInQuery && digitsInId) {
      if (parseInt(digitsInQuery, 10) === parseInt(digitsInId, 10)) {
        return true;
      }
    }

    return false;
  });
}
