import { BookOpen, Briefcase, Calendar, Code, Coffee, Dumbbell, Folder, GraduationCap, Heart, House, Lightbulb, Music, Plane, ShoppingBag, Target, Wallet } from 'lucide-react'
import type { Category } from './domain'
const icons = { folder: Folder, briefcase: Briefcase, 'graduation-cap': GraduationCap, house: House, wallet: Wallet, lightbulb: Lightbulb, code: Code, heart: Heart, 'book-open': BookOpen, target: Target, plane: Plane, music: Music, calendar: Calendar, 'shopping-bag': ShoppingBag, dumbbell: Dumbbell, coffee: Coffee }
export const iconLabels: Record<string, string> = { folder: 'Mapa', briefcase: 'Posao', 'graduation-cap': 'Fakultet', house: 'Dom', wallet: 'Financije', lightbulb: 'Ideje', code: 'Programiranje', heart: 'Zdravlje', 'book-open': 'Knjiga', target: 'Ciljevi', plane: 'Putovanja', music: 'Glazba', calendar: 'Kalendar', 'shopping-bag': 'Kupovina', dumbbell: 'Trening', coffee: 'Kava' }
export function CategoryIcon({ category, size = 20 }: { category?: Partial<Category>; size?: number }) {
  const Icon = icons[category?.icon as keyof typeof icons] ?? Folder
  return <Icon size={size} style={{ color: category?.color ?? '#B4D6D3', flexShrink: 0 }} aria-hidden="true" />
}
