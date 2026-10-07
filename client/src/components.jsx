import { Link } from 'react-router-dom';
import { fmtDate } from './api';

export function Badge({ type, children }) {
  return <span className={`badge ${type}`}>{children || type}</span>;
}

function ago(d) {
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
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : <div className="noimg"><span>{item.type === 'lost' ? '🔍' : '🎁'}</span>No photo</div>}
        <span className={`tag ${item.type}`}>{item.type === 'lost' ? 'Lost' : 'Found'}</span>
        {score != null && <span className="score on-img">{score}% match</span>}
        {item.status === 'recovered' && <span className="rec">Recovered</span>}
      </div>
      <div className="card-body">
        <p className="cat-line">{item.category}</p>
        <h3>{item.name}</h3>
        <p className="meta"><span>{item.location}</span><span>{ago(item.date)}</span></p>
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
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="row between"><h2>{title}</h2><button className="btn ghost sm" onClick={onClose}>Close</button></div>
        {children}
      </div>
    </div>
  );
}
