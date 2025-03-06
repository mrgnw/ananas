export function getLanguageColors(key: string, display: boolean, type: string): string {
  // Use a more distinct and vibrant color palette with higher contrast
  const colorPalette = [
    { bg: 'bg-blue-100', text: 'text-blue-800' },       // Blue
    { bg: 'bg-red-100', text: 'text-red-800' },         // Red
    { bg: 'bg-emerald-100', text: 'text-emerald-800' }, // Emerald (more distinct from other greens)
    { bg: 'bg-amber-100', text: 'text-amber-800' },     // Amber (golden)
    { bg: 'bg-purple-100', text: 'text-purple-800' },   // Purple
    { bg: 'bg-pink-100', text: 'text-pink-800' },       // Pink
    { bg: 'bg-violet-100', text: 'text-violet-800' },   // Violet (distinct from purple)
    { bg: 'bg-cyan-100', text: 'text-cyan-800' },       // Cyan
    { bg: 'bg-orange-100', text: 'text-orange-800' },   // Orange
    { bg: 'bg-teal-100', text: 'text-teal-800' },       // Teal
    { bg: 'bg-lime-100', text: 'text-lime-800' },       // Lime
    { bg: 'bg-rose-100', text: 'text-rose-800' },       // Rose (distinct from pink/red)
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' }, // Fuchsia
    { bg: 'bg-indigo-100', text: 'text-indigo-800' },   // Indigo
    { bg: 'bg-sky-100', text: 'text-sky-800' }          // Sky blue (distinct from blue/cyan)
  ];

  const index = key.charCodeAt(0) % colorPalette.length;
  const colors = colorPalette[index];

  if (type === 'dropdown') {
    return display ? colors.text : '';
  }
  return display ? `${colors.bg} ${colors.text}` : '';
}