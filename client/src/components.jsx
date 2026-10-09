import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtDate } from './api';
import Icon, { CATEGORY_ICON } from './Icons.jsx';

export function Badge({ type, children }) {
  return <span className={`badge ${type}`}>{children || type}</span>;
}

export function ago(d) {
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 8) return `${days} days ago`;
  return fmtDate(d);
}

export function ItemCard({ item, score }) {
  return (
    <Link to={`/item/${item._id}`} className={`card item ${item.type}`}>
      <div className="thumb">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} loading="lazy" />
          : <div className="noimg"><Icon name={CATEGORY_ICON[item.category] || 'grid'} size={30} /></div>}
        <span className={`tag ${item.type}`}>{item.type === 'lost' ? 'Lost' : 'Found'}</span>
        {score != null && <span className="score on-img">{score}% match</span>}
        {item.status === 'recovered' && <span className="rec">Recovered</span>}
      </div>
      <div className="card-body">
        <p className="cat-line">{item.category}</p>
        <h3>{item.name}</h3>
        <p className="meta"><span><Icon name="pin" />{item.location}</span><span><Icon name="clock" />{ago(item.date)}</span></p>
      </div>
    </Link>
  );
}

export function Bars({ data, colors }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="muted small">No data yet.</p>;
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div className="bar-row" key={d.label}>
          <span className="bar-label">{d.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: colors?.[i] }} /></div>
          <span className="bar-val">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="row between"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
        {children}
      </div>
    </div>
  );
}

// Number that counts up once when it mounts (skipped for reduced motion).
export function CountUp({ value, ms = 900 }) {
  const [n, setN] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const target = Number(value) || 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || target === 0) { setN(target); return undefined; }
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, ms]);
  return <>{n}</>;
}

export function EmptyState({ icon = 'inbox', title, text, children }) {
  return (
    <div className="empty">
      <span className="empty-ic"><Icon name={icon} size={26} /></span>
      <b>{title}</b>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
