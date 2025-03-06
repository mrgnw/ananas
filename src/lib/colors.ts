// Define color palette type for better type checking
export type ColorPair = {
  bg: string;
  text: string;
};

// Ordered sequence of highly contrasting colors - carefully arranged for maximum differentiation
// The order is specifically designed to have maximum visual difference between adjacent colors
export const languageColorPalette: ColorPair[] = [
  { bg: 'bg-red-100', text: 'text-red-800' },           // 1: Red - vibrant and distinct
  { bg: 'bg-blue-100', text: 'text-blue-800' },         // 2: Blue - contrasts with red
  { bg: 'bg-amber-100', text: 'text-amber-800' },       // 3: Amber/Gold - warm tone
  { bg: 'bg-emerald-100', text: 'text-emerald-800' },   // 4: Emerald - cool tone
  { bg: 'bg-purple-100', text: 'text-purple-800' },     // 5: Purple - distinct from others
  { bg: 'bg-orange-100', text: 'text-orange-800' },     // 6: Orange - high contrast against blue
  { bg: 'bg-cyan-100', text: 'text-cyan-800' },         // 7: Cyan - complementary to orange
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },   // 8: Fuchsia - distinct from purple
  { bg: 'bg-lime-100', text: 'text-lime-800' },         // 9: Lime - high contrast to fuchsia
  { bg: 'bg-indigo-100', text: 'text-indigo-800' },     // 10: Indigo - different from blue/purple
  { bg: 'bg-rose-100', text: 'text-rose-800' },         // 11: Rose - contrasts with lime
  { bg: 'bg-teal-100', text: 'text-teal-800' },         // 12: Teal - distinct from cyan
];

// Helper function to get color classes based on index
export function getColorByIndex(index: number, isDropdown = false): string {
  const colorIndex = index % languageColorPalette.length;
  const colors = languageColorPalette[colorIndex];
  
  return isDropdown ? colors.text : `${colors.bg} ${colors.text}`;
}