// Soft animated background: drifting brand-colour glows and lost-and-found things floating up.
const ICONS = [
  ['🔑', '6%', '34px', '34s', '-6s'], ['🎒', '16%', '42px', '40s', '-22s'], ['📱', '27%', '30px', '30s', '-12s'],
  ['👛', '38%', '36px', '38s', '-30s'], ['🎧', '49%', '34px', '33s', '-3s'], ['🔍', '58%', '44px', '42s', '-18s'],
  ['📚', '69%', '36px', '36s', '-26s'], ['☂️', '78%', '38px', '39s', '-9s'], ['⌚', '88%', '30px', '31s', '-15s'],
  ['🪪', '94%', '34px', '37s', '-33s'],
];
export default function Background() {
  return (
    <div className="bg-anim" aria-hidden="true">
      <span className="blob b1" /><span className="blob b2" /><span className="blob b3" /><span className="blob b4" />
      {ICONS.map(([e, x, s, d, l]) => <span key={e} className="ico" style={{ '--x': x, '--s': s, '--d': d, '--l': l }}>{e}</span>)}
    </div>
  );
}
