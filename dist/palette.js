const candidates = [
  ['#678b70','세이지 그린'], ['#cf9875','테라코타'],
  ['#859dc1','블루'], ['#b194b5','라벤더'],
  ['#b9a25f','머스터드'], ['#ca8393','로즈'],
  ['#6faaa7','틸'], ['#b78057','앰버'],
  ['#8a85ba','바이올렛'], ['#899b61','올리브'],
  ['#6796b0','스카이 블루'], ['#ad7880','베리'],
];
export function bookPalette(books, editingId = null) {
  const used = new Set(books.filter(b => b.status === 'active' && b.id !== editingId).map(b => b.color.toLowerCase()));
  const available = candidates.filter(([color]) => !used.has(color));
  // Deterministic fallback keeps six choices even with many active books.
  for (let i = 0; available.length < 6; i++) {
    const n = (i * 2654435761) >>> 0;
    const color = '#' + [0, 8, 16].map(shift => (80 + ((n >>> shift) % 120)).toString(16).padStart(2, '0')).join('');
    if (!used.has(color) && !available.some(([value]) => value === color)) available.push([color, `추가 색상 ${i + 1}`]);
  }
  return available.slice(0, 6);
}
