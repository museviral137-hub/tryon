/**
 * Centralized Legal & Support Constants
 * All business, contact, and jurisdiction placeholders are centralized here.
 */

export const LEGAL_CONFIG = {
  BUSINESS_LEGAL_NAME: '[BUSINESS LEGAL NAME]',
  BUSINESS_ADDRESS: '[BUSINESS ADDRESS]',
  SUPPORT_EMAIL: '[SUPPORT EMAIL]',
  SUPPORT_PHONE: '[SUPPORT PHONE]',
  GOVERNING_JURISDICTION: '[GOVERNING LAW / JURISDICTION]',
  SUPPORT_HOURS: '[SUPPORT HOURS (e.g., Monday – Saturday, 9:00 AM – 7:00 PM IST)]',
  PRIVACY_CONTACT: '[PRIVACY CONTACT / DATA PROTECTION OFFICER]',
  LAST_UPDATED_DATE: 'September 1, 2026',
  APP_NAME: 'VestiAI',
  APP_DESCRIPTION: 'Boutique Management & AI Virtual Try-On Platform',
} as const;

export interface PolicyMeta {
  id: string;
  slug: string;
  tab: string;
  title: string;
  shortDescription: string;
  iconName: string;
  category: 'Legal' | 'Privacy & Data' | 'Support';
}

export const LEGAL_POLICIES: PolicyMeta[] = [
  {
    id: 'terms',
    slug: '/terms',
    tab: 'terms',
    title: 'Terms & Conditions',
    shortDescription: 'Rules and terms governing the use of the boutique software, shop accounts, and AI virtual try-ons.',
    iconName: 'FileText',
    category: 'Legal',
  },
  {
    id: 'privacy',
    slug: '/privacy',
    tab: 'privacy',
    title: 'Privacy Policy',
    shortDescription: 'How customer data, boutique records, and photographs are collected, handled, and safeguarded.',
    iconName: 'ShieldCheck',
    category: 'Privacy & Data',
  },
  {
    id: 'refund-policy',
    slug: '/refund-policy',
    tab: 'refund-policy',
    title: 'Refund & Cancellation Policy',
    shortDescription: 'AI credit usage rules, automatic refund triggers on generation failures, and cancellation details.',
    iconName: 'RotateCcw',
    category: 'Legal',
  },
  {
    id: 'ai-disclaimer',
    slug: '/ai-disclaimer',
    tab: 'ai-disclaimer',
    title: 'AI / Virtual Try-On Disclaimer',
    shortDescription: 'Visual approximation notice, fit variability disclaimer, and third-party AI processing guidance.',
    iconName: 'Sparkles',
    category: 'Legal',
  },
  {
    id: 'photo-consent',
    slug: '/photo-consent',
    tab: 'photo-consent',
    title: 'Customer Photo Consent',
    shortDescription: 'Mandatory customer permission protocols, photo processing scope, and retention/deletion guidelines.',
    iconName: 'Camera',
    category: 'Privacy & Data',
  },
  {
    id: 'cookie-policy',
    slug: '/cookie-policy',
    tab: 'cookie-policy',
    title: 'Cookie Policy',
    shortDescription: 'Information about essential session authentication, local browser cache, and storage practices.',
    iconName: 'Cookie',
    category: 'Privacy & Data',
  },
  {
    id: 'data-deletion',
    slug: '/data-deletion',
    tab: 'data-deletion',
    title: 'Data Deletion & Account Deletion',
    shortDescription: 'Instructions on deleting customer photos, purging boutique trial logs, and closing shop accounts.',
    iconName: 'Trash2',
    category: 'Privacy & Data',
  },
  {
    id: 'contact-support',
    slug: '/contact-support',
    tab: 'contact-support',
    title: 'Contact & Support',
    shortDescription: 'Direct support channels for billing, AI credits, technical inquiries, and data deletion requests.',
    iconName: 'Headphones',
    category: 'Support',
  },
];
