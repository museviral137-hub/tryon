import { PaymentPackage } from '../types';

export const AI_CREDIT_PACKAGES: PaymentPackage[] = [
  {
    id: 'starter',
    name: 'Starter Trial',
    credits: 50,
    price: 199,
    currency: '₹',
    pricePerCredit: 3.98,
    popular: false,
    tagline: 'Ideal for small boutiques starting out with AI try-on sessions.',
    features: [
      '50 High-Definition Try-On Renders',
      'All Indian Garment Categories (Sarees, Kurtas, Lehengas)',
      'Instant WhatsApp Shareable Cards',
      'High-Resolution Customer Previews',
      'Standard Support via WhatsApp / Email',
      'Credits Never Expire',
    ],
  },
  {
    id: 'popular',
    name: 'Boutique Popular',
    credits: 150,
    price: 499,
    currency: '₹',
    pricePerCredit: 3.33,
    popular: true,
    tagline: 'Best value for active retail stores and festive season rush.',
    features: [
      '150 High-Definition Try-On Renders',
      'Save 16% per credit vs. Starter',
      'All Garments & Custom Boutique Watermark',
      'Multi-Look Fitting Sessions & History',
      'Priority Cloud Rendering Queue',
      'Credits Never Expire',
    ],
  },
  {
    id: 'pro',
    name: 'Studio Pro',
    credits: 500,
    price: 1499,
    currency: '₹',
    pricePerCredit: 2.99,
    popular: false,
    tagline: 'Built for busy showrooms, multi-counter stores, and designer studios.',
    features: [
      '500 High-Definition Try-On Renders',
      'Save 25% per credit vs. Starter',
      'Instant Fabric Texture & Drape Synthesis',
      'Unlimited Customer Catalogs & Profiles',
      'Fast-Track Cloud GPU Rendering',
      'Dedicated Boutique Support Rep',
      'Credits Never Expire',
    ],
  },
  {
    id: 'business',
    name: 'Enterprise Business',
    credits: 1000,
    price: 2499,
    currency: '₹',
    pricePerCredit: 2.5,
    popular: false,
    tagline: 'Maximum power for high-volume retail chains & bridal collections.',
    features: [
      '1,000 High-Definition Try-On Renders',
      'Lowest Rate (₹2.50 per render)',
      'Multi-Staff Team Access Included',
      'Bulk Garment Image Processing',
      'Highest Priority AI GPU Pipeline',
      'Custom Branding & Priority Phone Support',
      'Credits Never Expire',
    ],
  },
];

export const PAYMENT_FAQ = [
  {
    q: 'How do AI Virtual Try-On credits work?',
    a: 'Each successful AI Virtual Try-On preview uses exactly 1 credit. Failed trials (e.g. unreadable photo or network error) are automatically refunded back to your boutique balance.',
  },
  {
    q: 'Do purchased credits ever expire?',
    a: 'No. All purchased credits remain in your boutique account indefinitely with zero expiration date.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We accept all major Indian payment methods through secured payment gateways, including UPI (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit Cards, Net Banking, and corporate cards.',
  },
  {
    q: 'What is your refund policy on credit packages?',
    a: 'We provide full refunds for unconsumed credit balances within 7 days of purchase in accordance with our Refund & Cancellation Policy. If you experience technical issues, our support team is available to assist.',
  },
];
