// Quiet background: a dot grid (CSS) and a few belongings slowly drifting up.
const ICONS = [
  ['🔑', '8%', '30px', '38s', '-6s'], ['🎒', '22%', '38px', '44s', '-22s'], ['📱', '36%', '28px', '36s', '-12s'],
  ['👛', '52%', '32px', '42s', '-30s'], ['🎧', '66%', '30px', '39s', '-3s'], ['📚', '78%', '34px', '41s', '-18s'],
  ['☂️', '90%', '34px', '45s', '-26s'],
];
export default function Background() {
  return (
    <div className="bg-anim" aria-hidden="true">
      {ICONS.map(([e, x, s, d, l]) => <span key={e} className="ico" style={{ '--x': x, '--s': s, '--d': d, '--l': l }}>{e}</span>)}
    </div>
  );
}
