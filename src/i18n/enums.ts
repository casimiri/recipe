// enums.ts — localizes the app's fixed vocabulary: category labels, meal slots,
// diet/time/difficulty filters, cuisines, and the common recipe tags shown on
// cards. trEnum(value, lang) returns the translation for a known English term,
// or the original string for anything not in the table (e.g. an imported
// recipe's bespoke tag) — graceful fallback, never a missing key.
import type { Lang } from './index';

type Tri = { fr: string; es: string; de: string };

const MAP: Record<string, Tri> = {
  // categories / cuisines
  Popular: { fr: 'Populaire', es: 'Popular', de: 'Beliebt' },
  Western: { fr: 'Occidental', es: 'Occidental', de: 'Westlich' },
  Asian: { fr: 'Asiatique', es: 'Asiática', de: 'Asiatisch' },
  Drinks: { fr: 'Boissons', es: 'Bebidas', de: 'Getränke' },
  Local: { fr: 'Local', es: 'Local', de: 'Regional' },
  Dessert: { fr: 'Dessert', es: 'Postre', de: 'Dessert' },
  Healthy: { fr: 'Sain', es: 'Saludable', de: 'Gesund' },
  Italian: { fr: 'Italien', es: 'Italiana', de: 'Italienisch' },
  // meals
  Breakfast: { fr: 'Petit-déjeuner', es: 'Desayuno', de: 'Frühstück' },
  Lunch: { fr: 'Déjeuner', es: 'Almuerzo', de: 'Mittagessen' },
  Dinner: { fr: 'Dîner', es: 'Cena', de: 'Abendessen' },
  Drink: { fr: 'Boisson', es: 'Bebida', de: 'Getränk' },
  // diet
  Vegetarian: { fr: 'Végétarien', es: 'Vegetariano', de: 'Vegetarisch' },
  Vegan: { fr: 'Végan', es: 'Vegano', de: 'Vegan' },
  'Gluten-free': { fr: 'Sans gluten', es: 'Sin gluten', de: 'Glutenfrei' },
  Pescatarian: { fr: 'Pescétarien', es: 'Pescetariano', de: 'Pescetarisch' },
  'High protein': { fr: 'Riche en protéines', es: 'Alto en proteínas', de: 'Proteinreich' },
  // time
  'Under 15 min': { fr: 'Moins de 15 min', es: 'Menos de 15 min', de: 'Unter 15 Min.' },
  'Under 30 min': { fr: 'Moins de 30 min', es: 'Menos de 30 min', de: 'Unter 30 Min.' },
  'Under 40 min': { fr: 'Moins de 40 min', es: 'Menos de 40 min', de: 'Unter 40 Min.' },
  'Under 1 hr': { fr: 'Moins d’1 h', es: 'Menos de 1 h', de: 'Unter 1 Std.' },
  'Under 5 min': { fr: 'Moins de 5 min', es: 'Menos de 5 min', de: 'Unter 5 Min.' },
  // difficulty
  Easy: { fr: 'Facile', es: 'Fácil', de: 'Einfach' },
  Medium: { fr: 'Moyen', es: 'Medio', de: 'Mittel' },
  Hard: { fr: 'Difficile', es: 'Difícil', de: 'Schwer' },
  // common recipe tags
  Brunch: { fr: 'Brunch', es: 'Brunch', de: 'Brunch' },
  'One pot': { fr: 'Un seul plat', es: 'Un solo cazo', de: 'Ein Topf' },
  Quick: { fr: 'Rapide', es: 'Rápido', de: 'Schnell' },
  Pantry: { fr: 'Placard', es: 'Despensa', de: 'Vorrat' },
  'High fiber': { fr: 'Riche en fibres', es: 'Alto en fibra', de: 'Ballaststoffreich' },
  'Crowd-pleaser': { fr: 'Pour tous', es: 'Para todos', de: 'Publikumsliebling' },
  'Make ahead': { fr: 'À préparer à l’avance', es: 'Para preparar antes', de: 'Vorzubereiten' },
  'Date night': { fr: 'Soirée en amoureux', es: 'Cita romántica', de: 'Date-Abend' },
  Sunday: { fr: 'Dimanche', es: 'Domingo', de: 'Sonntag' },
};

export function trEnum(value: string, lang: Lang): string {
  if (lang === 'en') return value;
  return MAP[value]?.[lang] ?? value;
}
