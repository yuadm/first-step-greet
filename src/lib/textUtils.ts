export function capitalizeFirstLetter(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalizeValue(value: any): string {
  if (Array.isArray(value)) {
    return value.map(item => capitalizeFirstLetter(String(item))).join(', ');
  }
  return capitalizeFirstLetter(String(value));
}