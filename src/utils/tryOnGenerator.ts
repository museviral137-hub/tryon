import { Customer, Garment, TryOnResult } from '../types';

/**
 * Curated pairings for standard demo items to give realistic try-on previews
 */
const CURATED_TRYON_MAP: Record<string, string> = {
  'c-001_g-002': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80',
  'c-001_g-003': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
  'c-001_g-005': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
  'c-002_g-001': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
  'c-002_g-004': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
  'c-002_g-006': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',
  'c-003_g-002': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=80',
  'c-003_g-003': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
  'c-004_g-005': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
};

// Fallback high quality model photos styled for try-on simulation
const FALLBACK_FEMALE_TRYONS = [
  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80',
];

const FALLBACK_MALE_TRYONS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',
];

/**
 * Generate mock AI Try-On result object
 */
export async function generateMockTryOn(
  customer: Customer,
  garment: Garment,
  shopName: string = 'VestiAI Boutique'
): Promise<TryOnResult> {
  const pairKey = `${customer.id}_${garment.id}`;
  
  let resultImageUrl = CURATED_TRYON_MAP[pairKey];

  if (!resultImageUrl) {
    if (garment.imageUrl && garment.imageUrl.startsWith('data:image')) {
      // If custom user uploaded photo, use it as preview reference
      resultImageUrl = garment.imageUrl;
    } else if (customer.gender === 'Male') {
      const idx = Math.abs(hashCode(customer.id + garment.id)) % FALLBACK_MALE_TRYONS.length;
      resultImageUrl = FALLBACK_MALE_TRYONS[idx];
    } else {
      const idx = Math.abs(hashCode(customer.id + garment.id)) % FALLBACK_FEMALE_TRYONS.length;
      resultImageUrl = FALLBACK_FEMALE_TRYONS[idx];
    }
  }

  const result: TryOnResult = {
    id: `try-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    customerId: customer.id,
    customerName: customer.name,
    customerPhoto: customer.imageUrl,
    customerPhone: customer.phone,
    garmentId: garment.id,
    garmentProductId: garment.productId,
    garmentName: garment.name,
    garmentPhoto: garment.imageUrl,
    garmentPrice: garment.price,
    garmentCategory: garment.category,
    resultImageUrl,
    status: 'Completed',
    createdAt: new Date().toISOString(),
    notes: `Virtual trial room generated for ${customer.name} at ${shopName}.`,
  };

  return result;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Generate a high quality composite image canvas for downloading
 */
export async function createDownloadableCanvas(
  result: TryOnResult,
  shopName: string
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(result.resultImageUrl);
      return;
    }

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 1200);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 1200);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw main image centered
      try {
        ctx.drawImage(img, 50, 120, 800, 900);
      } catch {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(50, 120, 800, 900);
      }

      // Draw top banner
      ctx.fillStyle = '#10b981';
      ctx.fillRect(50, 40, 6, 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(shopName, 70, 75);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px sans-serif';
      ctx.fillText('VestiAI Virtual Trial Room', 70, 100);

      // Draw bottom info card
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(50, 940, 800, 180);

      // Garment details
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`Product ID: ${result.garmentProductId}`, 80, 985);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(result.garmentName, 80, 1025);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`₹${result.garmentPrice.toLocaleString('en-IN')}`, 80, 1065);

      // Customer details
      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Customer: ${result.customerName} (${result.customerId})`, 820, 990);
      ctx.fillText(`Generated: ${new Date(result.createdAt).toLocaleDateString('en-IN')}`, 820, 1030);

      ctx.fillStyle = '#10b981';
      ctx.fillText('✓ AI Fit Verified', 820, 1070);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      // Fallback
      resolve(result.resultImageUrl);
    };

    img.src = result.resultImageUrl;
  });
}

/**
 * Generate formatted WhatsApp share URL
 */
export function getWhatsAppShareUrl(
  phone: string | undefined,
  customerName: string,
  garmentName: string,
  productId: string,
  price: number,
  shopName: string
): string {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const message = encodeURIComponent(
    `Hello ${customerName}! ✨\n\nHere is your virtual trial room preview from *${shopName}* for:\n👗 *${garmentName}* (ID: *${productId}*)\n🏷️ Price: *₹${price.toLocaleString('en-IN')}*\n\nLet us know if you'd like us to reserve this piece for you!`
  );

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${message}`;
  }
  return `https://wa.me/?text=${message}`;
}
