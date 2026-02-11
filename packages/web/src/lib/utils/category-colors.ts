import type { SkillCategory } from '@emergent/shared';

export const categoryColorMap: Record<SkillCategory, string> = {
  devops: 'bg-green-100 text-green-800',
  dotnet: 'bg-purple-100 text-purple-800',
  general: 'bg-gray-100 text-gray-800',
  react: 'bg-sky-100 text-sky-800',
  'react-native': 'bg-cyan-100 text-cyan-800',
  security: 'bg-red-100 text-red-800',
  sql: 'bg-orange-100 text-orange-800',
  testing: 'bg-yellow-100 text-yellow-800',
  typescript: 'bg-blue-100 text-blue-800',
};

export function getCategoryColor(category: string): string {
  return categoryColorMap[category as SkillCategory] ?? categoryColorMap.general;
}
