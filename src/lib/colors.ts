export function getLanguageColors(key: string, display: boolean, type: string): string {
  const colorPalette = [
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-red-100', text: 'text-red-800' },
    { bg: 'bg-green-100', text: 'text-green-800' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' },
    { bg: 'bg-pink-100', text: 'text-pink-800' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    { bg: 'bg-orange-100', text: 'text-orange-800' },
    { bg: 'bg-teal-100', text: 'text-teal-800' },
    { bg: 'bg-lime-100', text: 'text-lime-800' },
    { bg: 'bg-amber-100', text: 'text-amber-800' }
  ];

  const index = key.charCodeAt(0) % colorPalette.length;
  const colors = colorPalette[index];

  if (type === 'dropdown') {
    return display ? colors.text : '';
  }
  return display ? `${colors.bg} ${colors.text}` : '';
}