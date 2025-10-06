/**
 * Business Templates for Quick Start
 *
 * Pre-configured templates that allow users to generate brand kits
 * in under 60 seconds with one click.
 */

export interface BusinessTemplate {
  id: string;
  name: string;
  icon: string;
  industry: 'tech' | 'food' | 'fashion' | 'health' | 'creative' | 'finance' | 'education' | 'other';
  businessName: string;
  description: string;
  notes?: string;
  color: string; // For UI display
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    icon: '💻',
    industry: 'tech',
    businessName: 'TechVision AI',
    description: 'An innovative AI-powered software platform helping businesses automate workflows and boost productivity through intelligent automation.',
    notes: 'Modern, clean, professional. Blue or purple tones. Sans-serif fonts.',
    color: 'bg-blue-500',
  },
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    icon: '☕',
    industry: 'food',
    businessName: 'Sunrise Coffee Co',
    description: 'A local artisan coffee roastery focused on sustainable sourcing and community connection, serving specialty drinks in a warm, welcoming space.',
    notes: 'Warm, inviting, organic. Earthy tones like brown, cream, orange. Handwritten or serif fonts.',
    color: 'bg-amber-600',
  },
  {
    id: 'fashion-brand',
    name: 'Fashion Brand',
    icon: '👗',
    industry: 'fashion',
    businessName: 'Luxe Atelier',
    description: 'A contemporary fashion label creating sustainable, minimalist clothing for modern professionals who value quality and timeless design.',
    notes: 'Elegant, sophisticated, minimal. Black, white, gold accents. Serif fonts.',
    color: 'bg-pink-500',
  },
  {
    id: 'fitness-studio',
    name: 'Fitness Studio',
    icon: '🏋️',
    industry: 'health',
    businessName: 'Elevate Fitness',
    description: 'A high-energy boutique fitness studio offering HIIT workouts, yoga, and personalized training programs for all fitness levels.',
    notes: 'Energetic, bold, motivating. Bright colors like red, orange, electric blue. Strong sans-serif fonts.',
    color: 'bg-red-500',
  },
  {
    id: 'creative-agency',
    name: 'Creative Agency',
    icon: '🎨',
    industry: 'creative',
    businessName: 'Pixel & Co Studio',
    description: 'A full-service creative agency specializing in brand identity, web design, and digital marketing for ambitious startups and growing brands.',
    notes: 'Creative, vibrant, unique. Colorful palette with bold contrasts. Modern geometric fonts.',
    color: 'bg-purple-500',
  },
  {
    id: 'financial-advisor',
    name: 'Financial Services',
    icon: '💼',
    industry: 'finance',
    businessName: 'Pinnacle Wealth Advisors',
    description: 'A trusted financial planning firm providing personalized investment strategies and retirement planning for high-net-worth individuals and families.',
    notes: 'Professional, trustworthy, stable. Navy blue, green, gold. Classic serif fonts.',
    color: 'bg-emerald-600',
  },
];

/**
 * Sample business for instant demo
 * Pre-generated brand kit exists for this business
 */
export const SAMPLE_BUSINESS: BusinessTemplate = {
  id: 'sample-demo',
  name: 'Demo Business',
  icon: '✨',
  industry: 'tech',
  businessName: 'Demo Startup Inc',
  description: 'A sample technology company to demonstrate brand kit generation capabilities. This is a pre-generated example.',
  notes: 'Professional, modern, trustworthy',
  color: 'bg-indigo-500',
};

/**
 * Get template by ID
 */
export function getTemplateById(id: string): BusinessTemplate | undefined {
  return BUSINESS_TEMPLATES.find(t => t.id === id);
}

/**
 * Generate slug from template
 */
export function generateSlugFromTemplate(template: BusinessTemplate): string {
  return template.businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
