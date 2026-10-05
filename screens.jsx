import { useMemo, useState } from 'react';
import { Icon } from './icons.jsx';
import { syncLabel } from './shared.js';
import {
  categories, services, providers, slots, STATUS_FLOW, statusText,
  getCategory, getProvider, getService, priceFor, money, upcomingDates, formatDate, billFor,
} from './data.js';

/* ---------- shared pieces ---------- */

function TopBar({ title, sub, onBack, backLabel = 'Back', right }) {
  return (
    <header className="topbar">
      {onBack && (
        <button type="button" className="icon-btn" aria-label={backLabel} onClick={onBack}>
          <Icon name="back" size={20} />
        </button>
      )}
      <div className="topbar-text">
        <h1 className="topbar-title">{title}</h1>
        {sub && <p className="topbar-sub">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

function Stars({ value, size = 14 }) {
  return (
    <span className="rating">
      <Icon name="star" filled size={size} className="star-on" />
      {value.toFixed(1)}
    </span>
  );
}

const isActive = (b) => !['paid', 'cancelled'].includes(b.status);

function slotLabel(start) {
  const s = slots.find((x) => x.start === start);
  return s ? s.label : '';
}

/* ---------- Home ---------- */

export function HomeScreen({ store, nav, actions }) {
  const [query, setQuery] = useState('');
  const active = store.bookings.find(isActive);
  const isNew = store.bookings.filter((b) => b.status !== 'cancelled').length === 0;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    categories.forEach((c) => {
      services[c.id].forEach((s) => {
        if (s.name.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) out.push({ c, s });
      });
    });
    return out.slice(0, 8);
  }, [query]);

  return (
    <div className="screen">
      <header className="home-head">
        <div>
          <p className="muted-label">Service address</p>
          <p className="address-line"><Icon name="pin" size={18} className="accent" />{store.address.label} · {store.address.area || store.address.line}</p>
        </div>
      </header>

      <div className="content">
        <h1 className="hero">Hi {store.name}, what needs fixing today?</h1>

        <label className="search">
          <Icon name="search" size={20} />
          <span className="sr-only">Search services</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AC repair, plumber, cleaning…"
          />
        </label>

        {query.trim() && (
          <section className="stack-sm" aria-label="Search results">
            {results.length === 0 && <p className="empty-note">No services match “{query}”. Try “AC”, “leak” or “cleaning”.</p>}
            {results.map(({ c, s }) => (
              <button key={s.id} type="button" className="result-row" onClick={() => actions.startBooking(c.id, s.id)}>
                <span className="cat-icon sm"><Icon name={c.icon} size={18} /></span>
                <span className="grow"><strong>{s.name}</strong><small>{c.name} · from {money(priceFor(s, null))}</small></span>
                <Icon name="arrowRight" size={18} />
              </button>
            ))}
          </section>
        )}

        {active && (
          <section className="active-card">
            <div className="row-between">
              <span className="live-pill"><span className="dot" />Active booking</span>
              <span className="faint">#{active.id}</span>
            </div>
            <div>
              <p className="active-title">{getCategory(active.categoryId).name} · {statusText[active.status]}</p>
              <p className="active-sub">{getProvider(active.providerId).name} · {formatDate(active.dateIso)}, {slotLabel(active.slotStart)}</p>
            </div>
            <button type="button" className="btn btn-light" onClick={() => nav.go('tracking', { id: active.id })}>
              Track booking <Icon name="arrowRight" size={18} />
            </button>
          </section>
        )}

        <section className="stack-md">
          <h2 className="section-title">Services</h2>
          <div className="cat-grid">
            {categories.map((c) => (
              <button key={c.id} type="button" className="cat-tile" onClick={() => actions.startBooking(c.id)}>
                <span className="cat-icon"><Icon name={c.icon} /></span>
                {c.name}
              </button>
            ))}
          </div>
        </section>

        {isNew && (
          <section className="offer">
            <span className="offer-icon"><Icon name="tag" /></span>
            <div>
              <p className="offer-title">10% off your first booking</p>
              <p className="offer-sub">Applied automatically, up to ₹100</p>
            </div>
          </section>
        )}

        <section className="stack-md">
          <h2 className="section-title">Why customers trust Servizato</h2>
          <ul className="trust-list">
            <li><Icon name="shield" className="ok" /><span><strong>Verified professionals</strong><small>Every provider is background-checked</small></span></li>
            <li><Icon name="lock" className="ok" /><span><strong>OTP-secured visits</strong><small>Work starts only after you share your OTP</small></span></li>
            <li><Icon name="wallet" className="ok" /><span><strong>Pay after the job</strong><small>Clear invoice with photo proof</small></span></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ---------- Services ---------- */

export function ServicesScreen({ nav, draft, setDraft }) {
  if (!draft) return null;
  const cat = getCategory(draft.categoryId);
  const list = services[cat.id];
  const toggle = (id) =>
    setDraft((d) => ({
      ...d,
      serviceIds: d.serviceIds.includes(id) ? d.serviceIds.filter((x) => x !== id) : [...d.serviceIds, id],
    }));
  const total = draft.serviceIds.reduce((a, id) => a + priceFor(getService(cat.id, id), null), 0);
  const count = draft.serviceIds.length;

  return (
    <div className="screen">
      <TopBar title={cat.title} sub="Step 1 of 3 · Choose services" onBack={nav.back} />
      <div className="content">
        <div className="badges">
          <span className="badge good">Pay after service</span>
          <span className="badge">OTP-secured visit</span>
          <span className="badge">Verified pros</span>
        </div>
        <h2 className="section-title">Select what you need</h2>
        <div className="stack-sm">
          {list.map((s) => {
            const on = draft.serviceIds.includes(s.id);
            return (
              <div key={s.id} className={'card service' + (on ? ' is-on' : '')}>
                <div className="grow stack-xs">
                  <strong className="card-title">{s.name}</strong>
                  <p className="card-desc">{s.desc}</p>
                  <span className="meta"><Icon name="clock" size={14} />{s.time}</span>
                </div>
                <div className="service-side">
                  <span className="price">{money(priceFor(s, null))}</span>
                  <button type="button" aria-pressed={on} className={'btn-toggle' + (on ? ' is-on' : '')} onClick={() => toggle(s.id)}>
                    {on ? <><Icon name="check" size={16} />Added</> : 'Add'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="note"><Icon name="info" size={18} />Prices shown are starting prices. Spare parts, if needed, are added to your bill only after you approve them.</p>
      </div>
      <footer className="bottombar">
        <button type="button" className="btn btn-primary btn-split" disabled={count === 0} onClick={() => nav.go('providers')}>
          {count === 0 ? <span className="center-text">Add a service to continue</span> : (
            <>
              <span className="split-left"><small>{count} {count === 1 ? 'service' : 'services'}</small><strong>from {money(total)}</strong></span>
              <span className="split-right">Choose provider <Icon name="arrowRight" size={18} /></span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
}

/* ---------- Providers ---------- */

const SORTS = [
  { id: 'rec', label: 'Recommended' },
  { id: 'rating', label: 'Top rated' },
  { id: 'price', label: 'Lowest price' },
  { id: 'near', label: 'Nearest' },
];

export function ProvidersScreen({ store, nav, draft, setDraft }) {
  const [sort, setSort] = useState('rec');
  if (!draft) return null;
  const cat = getCategory(draft.categoryId);
  const chosen = draft.serviceIds.map((id) => getService(cat.id, id));
  const totalFor = (p) => chosen.reduce((a, s) => a + priceFor(s, p), 0);
  const firstBooking = store.bookings.filter((b) => b.status !== 'cancelled').length === 0;

  const list = providers
    .filter((p) => p.categories.includes(cat.id))
    .map((p, i) => ({ ...p, total: totalFor(p), rec: i }))
    .sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'price') return a.total - b.total;
      if (sort === 'near') return a.km - b.km;
      return a.rec - b.rec;
    });

  const pick = (p) => {
    setDraft((d) => ({ ...d, providerId: p.id }));
    nav.go('schedule');
  };

  return (
    <div className="screen">
      <TopBar title="Providers near you" sub={'Step 2 of 3 · ' + chosen.map((s) => s.name).join(', ')} onBack={nav.back} />
      <div className="chip-row" role="group" aria-label="Sort providers">
        {SORTS.map((s) => (
          <button key={s.id} type="button" aria-pressed={sort === s.id} className={'chip' + (sort === s.id ? ' is-on' : '')} onClick={() => setSort(s.id)}>{s.label}</button>
        ))}
      </div>
      <div className="content">
        <p className="muted">{list.length} verified providers serve your area</p>
        {list.map((p, i) => (
          <article key={p.id} className="card provider">
            <div className="provider-top">
              <span className="avatar sq">{p.initials}</span>
              <div className="grow stack-xs">
                <strong className="card-title with-icon">{p.name}<Icon name="shield" size={16} className="ok" /></strong>
                <span className="meta-row"><Stars value={p.rating} /><span>{p.reviews.toLocaleString('en-IN')} reviews</span><span>{p.km} km away</span></span>
              </div>
              <div className="provider-price"><small>From</small><strong>{money(p.total)}</strong></div>
            </div>
            <div className="badges">
              <span className="badge"><Icon name="clock" size={13} />Earliest {p.earliest > 12 ? p.earliest - 12 + ' PM' : p.earliest === 12 ? '12 PM' : p.earliest + ' AM'}</span>
              <span className="badge">{p.jobs} jobs done</span>
              {firstBooking && <span className="badge warm"><Icon name="tag" size={13} />10% off first booking</span>}
              {p.offer && <span className="badge warm"><Icon name="tag" size={13} />{p.offer}</span>}
            </div>
            <button type="button" className={'btn ' + (i === 0 ? 'btn-primary' : 'btn-outline')} onClick={() => pick(p)}>
              Select {p.name.split(' ')[0]}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------- Schedule ---------- */

export function ScheduleScreen({ store, nav, draft, setDraft, actions }) {
  const dates = useMemo(() => upcomingDates(5), []);
  if (!draft) return null;
  const provider = getProvider(draft.providerId);
  const cat = getCategory(draft.categoryId);
  const nowHour = new Date().getHours();
  const isOff = (d, s) => d.isToday && (s.start <= nowHour + 1 || s.start < provider.earliest);
  // Default to the first day that still has a free slot (late evening → tomorrow).
  const firstOpen = dates.find((d) => slots.some((s) => !isOff(d, s))) || dates[0];
  const dateIso = draft.dateIso || firstOpen.iso;
  const dateObj = dates.find((d) => d.iso === dateIso) || firstOpen;
  const unavailable = (s) => isOff(dateObj, s);
  const noneToday = dateObj.isToday && slots.every(unavailable);

  const lines = draft.serviceIds.map((id) => {
    const s = getService(cat.id, id);
    return { name: s.name, amount: priceFor(s, provider) };
  });
  const subtotal = lines.reduce((a, l) => a + l.amount, 0);
  const first = store.bookings.filter((b) => b.status !== 'cancelled').length === 0;
  const discount = first ? Math.min(Math.round(subtotal * 0.1), 100) : 0;
  const slotValid = draft.slotStart != null && !unavailable(slots.find((s) => s.start === draft.slotStart));

  const setDate = (iso) => setDraft((d) => ({ ...d, dateIso: iso, slotStart: null }));

  const confirm = () => actions.createBooking({ dateIso });

  return (
    <div className="screen">
      <TopBar title="Schedule your visit" sub={'Step 3 of 3 · ' + provider.name} onBack={nav.back} />
      <div className="content">
        <section className="stack-sm">
          <h2 className="section-title sm">Pick a date</h2>
          <div className="date-grid">
            {dates.map((d) => (
              <button key={d.iso} type="button" aria-pressed={d.iso === dateIso} className={'date-btn' + (d.iso === dateIso ? ' is-on' : '')} onClick={() => setDate(d.iso)}>
                <small>{d.day}</small><strong>{d.num}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="stack-sm">
          <h2 className="section-title sm">Pick a time</h2>
          {noneToday && <p className="empty-note">No slots left today. Pick another date.</p>}
          <div className="slot-grid">
            {slots.map((s) => {
              const off = unavailable(s);
              const on = draft.slotStart === s.start && !off;
              return (
                <button key={s.start} type="button" disabled={off} aria-pressed={on} className={'slot-btn' + (on ? ' is-on' : '')} onClick={() => setDraft((d) => ({ ...d, slotStart: s.start }))}>
                  {s.label}{off && <small>Unavailable</small>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="stack-sm">
          <h2 className="section-title sm">Service address</h2>
          <div className="card row">
            <Icon name="pin" className="accent" />
            <div className="grow stack-xs"><strong>{store.address.label}</strong><span className="muted">{store.address.line}</span></div>
          </div>
        </section>

        <label className="stack-sm">
          <span className="section-title sm">Describe the problem <span className="muted normal">(optional)</span></span>
          <textarea
            rows={3}
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
            placeholder="e.g. AC is running but not cooling, water dripping from indoor unit"
          />
        </label>

        <section className="card stack-sm">
          <h2 className="section-title sm">Price estimate</h2>
          {lines.map((l) => <div key={l.name} className="bill-row"><span>{l.name}</span><span>{money(l.amount)}</span></div>)}
          <div className="bill-row"><span>Visiting charge</span><span className="good-text">Free</span></div>
          {discount > 0 && <div className="bill-row"><span>First booking offer</span><span className="good-text">−{money(discount)}</span></div>}
          <hr />
          <div className="bill-row total"><span>Estimated total</span><span>{money(subtotal - discount)}</span></div>
          <p className="meta"><Icon name="lock" size={14} />Nothing to pay now. GST is added on the final invoice.</p>
        </section>
      </div>
      <footer className="bottombar stack-xs">
        <p className="bar-hint">{slotValid ? `${dateObj.long} · ${slotLabel(draft.slotStart)}` : 'Choose a time slot to continue'}</p>
        <button type="button" className="btn btn-primary btn-lg" disabled={!slotValid} onClick={confirm}>Confirm booking</button>
      </footer>
    </div>
  );
}

/* ---------- Tracking ---------- */

export function TrackingScreen({ nav, booking, actions }) {
  const demoContact = () => actions.notify('Calls and chat open in the live app');
  const provider = getProvider(booking.providerId);
  const tech = booking.tech || provider.technician;
  const cat = getCategory(booking.categoryId);
  const idx = STATUS_FLOW.indexOf(booking.status);
  const done = booking.status === 'paid';
  const cancelled = booking.status === 'cancelled';
  const [confirmCancel, setConfirmCancel] = useState(false);

  const steps = [
    { id: 'confirmed', title: 'Booking confirmed', sub: provider.name + ' accepted your request' },
    { id: 'assigned', title: 'Technician assigned', sub: tech.name },
    { id: 'onway', title: 'On the way', sub: 'Technician is heading to you' },
    { id: 'started', title: 'Job started', sub: 'After you shared the OTP' },
    { id: 'completed', title: 'Completed & invoiced', sub: 'Photo proof and bill ready' },
  ];
  const time = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '');

  return (
    <div className="screen">
      <TopBar title={'Booking #' + booking.id} sub={`${cat.name} · ${formatDate(booking.dateIso)}, ${slotLabel(booking.slotStart)}`} onBack={nav.back} />
      <div className="content">
        {booking.status === 'onway' && (
          <div className="map" aria-label="Technician location">
            <span className="map-route" />
            <span className="map-pin tech"><Icon name="wrench" size={18} /></span>
            <span className="map-pin home"><Icon name="home" size={18} /></span>
            <span className="map-chip"><span className="dot" />Arriving in about 12 min</span>
          </div>
        )}

        {cancelled && <p className="note danger"><Icon name="info" size={18} />{booking.declined ? `${provider.name} couldn't take this booking. Please book again with another provider.` : 'This booking was cancelled.'}</p>}

        {idx >= 1 && !cancelled && (
          <div className="card row">
            <span className="avatar round">{tech.initials}</span>
            <div className="grow stack-xs"><strong>{tech.name}</strong><span className="meta"><Stars value={tech.rating} size={13} />{provider.name}</span></div>
            <button type="button" className="icon-btn outline" aria-label={'Message ' + tech.name} onClick={demoContact}><Icon name="chat" size={20} /></button>
            <button type="button" className="icon-btn solid" aria-label={'Call ' + tech.name} onClick={demoContact}><Icon name="phone" size={20} /></button>
          </div>
        )}

        {idx >= 0 && idx < 3 && !cancelled && (
          <section className="otp-card">
            <p className="otp-head"><Icon name="lock" size={18} />Your start OTP</p>
            <div className="otp-digits">{booking.otp.split('').map((d, i) => <span key={i}>{d}</span>)}</div>
            <p className="otp-sub">Share this only when the technician is at your door. Work cannot start without it.</p>
          </section>
        )}

        <section className="card">
          <h2 className="section-title sm">Booking progress</h2>
          <ol className="timeline">
            {steps.map((s, i) => {
              const state = done || i < idx || (i === idx && s.id === 'completed') ? 'done' : i === idx ? 'current' : 'todo';
              return (
                <li key={s.id} className={'tl-item ' + state}>
                  <span className="tl-dot">{state === 'done' && <Icon name="check" size={12} />}</span>
                  <div className="grow"><strong>{s.title}</strong><small>{s.sub}</small></div>
                  <span className="tl-time">{time(booking.history?.[s.id])}</span>
                </li>
              );
            })}
          </ol>
        </section>

        {!done && !cancelled && booking.status !== 'completed' && booking.live && (
          <p className="note"><Icon name="refresh" size={18} />Live: {provider.name} and your technician update this booking. It refreshes on its own.</p>
        )}

        {!done && !cancelled && booking.status !== 'completed' && !booking.live && (
          <div className="demo-box">
            <p><strong>Demo mode.</strong> Open the Servizato Partner app to accept this booking, or tap below to simulate the next update.</p>
            <button type="button" className="btn btn-outline" onClick={() => actions.advance(booking)}>
              <Icon name="refresh" size={18} />Simulate next update
            </button>
          </div>
        )}

        {booking.status === 'completed' && (
          <button type="button" className="btn btn-primary btn-lg" onClick={() => nav.go('invoice', { id: booking.id })}>View invoice and pay</button>
        )}
        {done && (
          <button type="button" className="btn btn-outline" onClick={() => nav.go('invoice', { id: booking.id })}>View invoice</button>
        )}

        {idx >= 0 && idx < 3 && !cancelled && (
          confirmCancel ? (
            <div className="confirm-box">
              <p>Cancel this booking? This can’t be undone.</p>
              <div className="row-gap">
                <button type="button" className="btn btn-outline" onClick={() => setConfirmCancel(false)}>Keep booking</button>
                <button type="button" className="btn btn-danger" onClick={() => actions.cancel(booking)}>Cancel booking</button>
              </div>
            </div>
          ) : (
            <button type="button" className="link-danger" onClick={() => setConfirmCancel(true)}>Cancel booking</button>
          )
        )}
      </div>
    </div>
  );
}

/* ---------- Invoice ---------- */

const METHODS = [
  { id: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm or any UPI app', icon: 'mobile' },
  { id: 'card', label: 'Credit or debit card', sub: 'Visa, Mastercard, RuPay', icon: 'card' },
  { id: 'netbanking', label: 'Net banking', sub: 'All major banks', icon: 'bank' },
  { id: 'cash', label: 'Cash to technician', sub: 'Technician confirms receipt in the app', icon: 'cash' },
];

export function InvoiceScreen({ nav, booking, actions }) {
  const [method, setMethod] = useState('upi');
  const [paying, setPaying] = useState(false);
  const bill = billFor(booking);
  const provider = getProvider(booking.providerId);
  const paid = booking.status === 'paid';

  const pay = () => {
    setPaying(true);
    setTimeout(() => actions.pay(booking, method), 900);
  };

  return (
    <div className="screen">
      <TopBar title={'Invoice #INV-' + booking.id.slice(3)} sub={provider.name + ' · ' + formatDate(booking.dateIso)} onBack={nav.back}
        right={<button type="button" className="icon-btn outline" aria-label="Download invoice" onClick={() => window.print()}><Icon name="download" size={20} /></button>} />
      <div className="content">
        <p className="note good"><Icon name="checkCircle" size={20} />{paid ? 'Paid · ' + METHODS.find((m) => m.id === booking.payMethod)?.label : 'Job completed by ' + (booking.tech || provider.technician).name}</p>

        <section className="stack-sm">
          <h2 className="section-title sm">Proof of work</h2>
          <div className="proof-grid">
            {booking.photos?.length
              ? booking.photos.map((p) => <div key={p.label} className="proof"><img src={p.src} alt={p.label + ' photo'} /></div>)
              : ['Before', 'After', bill.parts.length ? 'Part replaced' : 'Work area'].map((l) => (
                <div key={l} className="proof"><Icon name="image" />{l}</div>
              ))}
          </div>
        </section>

        <section className="card stack-sm">
          <h2 className="section-title sm">Bill details</h2>
          {bill.lines.map((l) => <div key={l.name} className="bill-row"><span>{l.name}</span><span>{money(l.amount)}</span></div>)}
          {bill.parts.map((p) => <div key={p.name} className="bill-row"><span className="stack-xs">{p.name}<small className="muted">Part approved by you</small></span><span>{money(p.price)}</span></div>)}
          {bill.discount > 0 && <div className="bill-row"><span>First booking offer</span><span className="good-text">−{money(bill.discount)}</span></div>}
          <div className="bill-row"><span>GST (18%)</span><span>{money(bill.gst)}</span></div>
          <hr />
          <div className="bill-row total"><span>{paid ? 'Total paid' : 'Total payable'}</span><span>{money(bill.total)}</span></div>
        </section>

        {!paid && (
          <fieldset className="stack-sm methods">
            <legend className="section-title sm">Pay with</legend>
            {METHODS.map((m) => (
              <label key={m.id} className={'method' + (method === m.id ? ' is-on' : '')}>
                <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                <Icon name={m.icon} className="accent" />
                <span className="grow stack-xs"><strong>{m.label}</strong><small className="muted">{m.sub}</small></span>
                <span className="radio" aria-hidden="true" />
              </label>
            ))}
          </fieldset>
        )}
      </div>
      {!paid && (
        <footer className="bottombar">
          <button type="button" className="btn btn-primary btn-lg" disabled={paying} onClick={pay}>
            {paying ? 'Processing…' : method === 'cash' ? 'Confirm cash payment' : 'Pay ' + money(bill.total)}
          </button>
        </footer>
      )}
    </div>
  );
}

/* ---------- Review ---------- */

const WORDS = ['Tap a star to rate', 'Poor', 'Below average', 'Okay', 'Good', 'Excellent'];
const TAGS = ['On time', 'Polite', 'Clean work', 'Fair price', 'Expert', 'Explained the problem'];

export function ReviewScreen({ nav, booking, actions, route }) {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const provider = getProvider(booking.providerId);
  const bill = billFor(booking);
  const tech = booking.tech || provider.technician;
  const methodLabel = METHODS.find((m) => m.id === booking.payMethod)?.label || '';

  return (
    <div className="screen">
      <div className="close-row">
        <button type="button" className="icon-btn outline" aria-label="Close" onClick={() => (route.justPaid ? nav.tab('home') : nav.back())}><Icon name="close" size={20} /></button>
      </div>
      <div className="content">
        {route.justPaid ? (
          <div className="success">
            <span className="success-icon"><Icon name="check" size={34} /></span>
            <h1>Payment successful</h1>
            <p className="muted">{money(bill.total)} paid to {provider.name}{methodLabel && ' via ' + methodLabel}</p>
          </div>
        ) : (
          <h1 className="page-title">Rate your service</h1>
        )}

        <section className="card stack-md">
          <div className="row">
            <span className="avatar round">{tech.initials}</span>
            <div className="stack-xs"><strong>How was {tech.name.split(' ')[0]}’s service?</strong><span className="muted">{getCategory(booking.categoryId).name} · {provider.name}</span></div>
          </div>
          <div className="stars-input" role="radiogroup" aria-label="Rating">
            <div className="row-gap">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={n + ' out of 5'} className={'star-btn' + (n <= rating ? ' is-on' : '')} onClick={() => setRating(n)}>
                  <Icon name="star" filled={n <= rating} size={36} />
                </button>
              ))}
            </div>
            <p className={rating ? 'strong' : 'muted'}>{WORDS[rating]}</p>
          </div>
          <div className="stack-sm">
            <strong>What went well?</strong>
            <div className="tag-wrap">
              {TAGS.map((t) => {
                const on = tags.includes(t);
                return <button key={t} type="button" aria-pressed={on} className={'chip' + (on ? ' is-on' : '')} onClick={() => setTags((x) => (on ? x.filter((y) => y !== t) : [...x, t]))}>{t}</button>;
              })}
            </div>
          </div>
          <label className="stack-sm">
            <strong>Add a comment <span className="muted normal">(optional)</span></strong>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell others about your experience" />
          </label>
        </section>
      </div>
      <footer className="bottombar stack-xs">
        <button type="button" className="btn btn-primary btn-lg" disabled={!rating} onClick={() => actions.review(booking, { rating, tags, comment })}>Submit review</button>
        <button type="button" className="btn btn-ghost" onClick={() => nav.tab('bookings', { view: 'past' })}>Skip for now</button>
      </footer>
    </div>
  );
}

/* ---------- Bookings ---------- */

export function BookingsScreen({ store, nav, actions, route }) {
  const [tab, setTab] = useState(route.view === 'past' ? 'past' : 'up');
  const upcoming = store.bookings.filter(isActive);
  const past = store.bookings.filter((b) => !isActive(b));
  const list = tab === 'up' ? upcoming : past;

  return (
    <div className="screen">
      <header className="page-head">
        <h1 className="page-title">My bookings</h1>
        <div className="segmented" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'up'} className={tab === 'up' ? 'is-on' : ''} onClick={() => setTab('up')}>Upcoming ({upcoming.length})</button>
          <button type="button" role="tab" aria-selected={tab === 'past'} className={tab === 'past' ? 'is-on' : ''} onClick={() => setTab('past')}>Past ({past.length})</button>
        </div>
      </header>
      <div className="content">
        {list.length === 0 && (
          <div className="empty">
            <Icon name="calendar" size={32} />
            <p><strong>{tab === 'up' ? 'No upcoming bookings' : 'No past bookings yet'}</strong></p>
            <p className="muted">Book a service and you can track it here.</p>
            <button type="button" className="btn btn-primary" onClick={() => nav.tab('home')}>Book a service</button>
          </div>
        )}
        {list.map((b) => {
          const cat = getCategory(b.categoryId);
          const provider = getProvider(b.providerId);
          const bill = billFor(b);
          return (
            <article key={b.id} className={'card stack-sm' + (isActive(b) ? ' is-on' : '')}>
              <div className="row-between top">
                <div className="row">
                  <span className="cat-icon sm"><Icon name={cat.icon} size={18} /></span>
                  <div className="stack-xs"><strong>{b.serviceIds.map((id) => getService(cat.id, id).name).join(', ')}</strong><span className="muted">{provider.name} · #{b.id}</span></div>
                </div>
                <span className={'badge ' + (b.status === 'paid' ? 'good' : b.status === 'cancelled' ? 'bad' : 'blue')}>{statusText[b.status]}</span>
              </div>
              <div className="meta-row">
                <span className="meta"><Icon name="calendar" size={14} />{formatDate(b.dateIso)}</span>
                <span className="meta"><Icon name="clock" size={14} />{slotLabel(b.slotStart)}</span>
                {b.status === 'paid' && <span className="meta strong">{money(bill.total)}</span>}
              </div>
              {b.review && <p className="meta"><Icon name="star" filled size={14} className="star-on" />You rated {b.review.rating} of 5</p>}
              <div className="row-gap">
                {isActive(b) && <button type="button" className="btn btn-primary" onClick={() => nav.go('tracking', { id: b.id })}>Track booking</button>}
                {b.status === 'paid' && <button type="button" className="btn btn-outline" onClick={() => nav.go('invoice', { id: b.id })}>Invoice</button>}
                {!isActive(b) && <button type="button" className="btn btn-soft" onClick={() => actions.startBooking(b.categoryId)}>Book again</button>}
                {b.status === 'paid' && !b.review && <button type="button" className="btn btn-soft" onClick={() => nav.go('review', { id: b.id })}>Rate</button>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Account ---------- */

export function AccountScreen({ store, actions, install }) {
  const total = store.bookings.length;
  return (
    <div className="screen">
      <header className="page-head"><h1 className="page-title">Account</h1></header>
      <div className="content">
        <section className="card row">
          <span className="avatar round lg">{store.name.slice(0, 1)}</span>
          <div className="stack-xs"><strong className="card-title">{store.name}</strong><span className="muted">{total} {total === 1 ? 'booking' : 'bookings'}</span></div>
        </section>
        <section className="card stack-sm">
          <h2 className="section-title sm">Saved address</h2>
          <div className="row"><Icon name="pin" className="accent" /><div className="stack-xs"><strong>{store.address.label}</strong><span className="muted">{store.address.line}</span></div></div>
        </section>
        {!install.installed && (
          <section className="card stack-sm">
            <h2 className="section-title sm">Install the app</h2>
            {install.canPrompt ? (
              <>
                <p className="muted">Add Servizato to your home screen. It opens full screen and works offline.</p>
                <button type="button" className="btn btn-primary" onClick={install.prompt}><Icon name="download" size={18} />Install app</button>
              </>
            ) : install.isIos ? (
              <p className="muted">In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</p>
            ) : (
              <p className="muted">Open your browser menu (⋮) and tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
            )}
          </section>
        )}
        <SyncStatus />
        <section className="demo-box">
          <p><strong>Prototype.</strong> Providers, prices and technicians are sample data. With cloud sync on, your bookings reach the provider and technician on their own phones; otherwise they stay on this device.</p>
          <button type="button" className="btn btn-outline" onClick={actions.reset}>Clear demo data</button>
        </section>
      </div>
    </div>
  );
}

/* ---------- Cloud sync status ---------- */
function SyncStatus() {
  const s = syncLabel();
  return <p className={'sync-status ' + s.tone} role="status"><span className="sync-dot" aria-hidden="true" />{s.text}</p>;
}
