import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import { STATUS_FLOW, demoParts, getCategory, getProvider } from './data.js';
import {
  HomeScreen, ServicesScreen, ProvidersScreen, ScheduleScreen,
  TrackingScreen, InvoiceScreen, ReviewScreen, BookingsScreen, AccountScreen,
} from './screens.jsx';

// Bump the version whenever sample data IDs change, so old saved bookings are dropped.
const STORAGE_KEY = 'servizato-customer-v2';

const initialStore = {
  name: 'Priya',
  address: { label: 'Home', area: 'Sector 62, Noida', line: 'Flat 402, Tower B, Sector 62, Noida' },
  bookings: [],
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialStore;
    const saved = JSON.parse(raw);
    // Skip any saved booking that points at a provider or category that no longer exists.
    const bookings = (saved.bookings || []).filter((b) => getProvider(b.providerId) && getCategory(b.categoryId));
    return { ...initialStore, ...saved, bookings };
  } catch {
    return initialStore;
  }
}

const TABS = ['home', 'bookings', 'account'];

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [stack, setStack] = useState([{ name: 'home' }]);
  const [draft, setDraft] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* storage unavailable */ }
  }, [store]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // "Install app": Android/desktop Chrome hands us a prompt we can show from a button.
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); setToast('Servizato installed'); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const install = {
    installed,
    canPrompt: !!installPrompt,
    isIos: /iphone|ipad|ipod/i.test(window.navigator.userAgent),
    prompt: async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice.catch(() => null);
      setInstallPrompt(null);
    },
  };

  const current = stack[stack.length - 1];

  // Keep the browser/phone back button in sync with in-app navigation.
  const depth = useRef(1);
  useEffect(() => { depth.current = stack.length; }, [stack]);
  useEffect(() => {
    const onPop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const nav = useMemo(() => ({
    go: (name, params = {}) => {
      setStack((s) => [...s, { name, ...params }]);
      window.history.pushState({ servizato: true }, '');
      window.scrollTo(0, 0);
    },
    back: () => {
      if (depth.current > 1) window.history.back();
    },
    tab: (name, params = {}) => setStack([{ name, ...params }]),
    replace: (entries) => setStack(entries),
  }), []);

  const updateBooking = (id, patch) =>
    setStore((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));

  const actions = {
    startBooking: (categoryId, serviceId) => {
      setDraft({ categoryId, serviceIds: serviceId ? [serviceId] : [], providerId: null, dateIso: null, slotStart: null, note: '' });
      nav.go('services');
    },
    createBooking: (extra = {}) => {
      const id = 'SZ-' + Math.floor(10000 + Math.random() * 89999);
      const booking = {
        ...draft,
        ...extra,
        id,
        status: 'confirmed',
        otp: String(Math.floor(1000 + Math.random() * 9000)),
        createdAt: new Date().toISOString(),
        firstBooking: store.bookings.filter((b) => b.status !== 'cancelled').length === 0,
        address: store.address,
        history: { confirmed: new Date().toISOString() },
        parts: [],
      };
      setStore((s) => ({ ...s, bookings: [booking, ...s.bookings] }));
      setDraft(null);
      setToast('Booking confirmed');
      nav.replace([{ name: 'home' }, { name: 'tracking', id }]);
    },
    advance: (booking) => {
      const i = STATUS_FLOW.indexOf(booking.status);
      if (i < 0 || i >= STATUS_FLOW.length - 1) return;
      const next = STATUS_FLOW[i + 1];
      const patch = { status: next, history: { ...booking.history, [next]: new Date().toISOString() } };
      if (next === 'completed' && demoParts[booking.categoryId]) patch.parts = [demoParts[booking.categoryId]];
      updateBooking(booking.id, patch);
      const tech = getProvider(booking.providerId).technician.name;
      const msgs = {
        assigned: tech + ' is assigned to your job',
        onway: tech + ' is on the way',
        started: 'Job started with your OTP',
        completed: 'Job completed. Your invoice is ready',
      };
      setToast(msgs[next]);
    },
    cancel: (booking) => {
      updateBooking(booking.id, { status: 'cancelled' });
      setToast('Booking cancelled');
      nav.tab('bookings');
    },
    pay: (booking, method) => {
      updateBooking(booking.id, { status: 'paid', payMethod: method, paidAt: new Date().toISOString() });
      nav.replace([{ name: 'home' }, { name: 'review', id: booking.id, justPaid: true }]);
    },
    review: (booking, review) => {
      updateBooking(booking.id, { review });
      setToast('Thanks for your review');
      nav.tab('bookings', { view: 'past' });
    },
    notify: (msg) => setToast(msg),
    reset: () => {
      setStore(initialStore);
      setDraft(null);
      setToast('Demo data cleared');
      nav.tab('home');
    },
  };

  const booking = current.id ? store.bookings.find((b) => b.id === current.id) : null;
  const props = { store, nav, draft, setDraft, actions, booking, route: current, install };

  let screen;
  switch (current.name) {
    case 'services': screen = <ServicesScreen {...props} />; break;
    case 'providers': screen = <ProvidersScreen {...props} />; break;
    case 'schedule': screen = <ScheduleScreen {...props} />; break;
    case 'tracking': screen = booking ? <TrackingScreen {...props} /> : <HomeScreen {...props} />; break;
    case 'invoice': screen = booking ? <InvoiceScreen {...props} /> : <HomeScreen {...props} />; break;
    case 'review': screen = booking ? <ReviewScreen {...props} /> : <HomeScreen {...props} />; break;
    case 'bookings': screen = <BookingsScreen {...props} />; break;
    case 'account': screen = <AccountScreen {...props} />; break;
    default: screen = <HomeScreen {...props} />;
  }

  const showTabs = TABS.includes(current.name);

  return (
    <div className="app">
      <main className="app-main" key={stack.length + current.name + (current.view || '')}>{screen}</main>
      {showTabs && (
        <nav className="tabbar" aria-label="Main">
          {[
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'bookings', label: 'Bookings', icon: 'calendar' },
            { id: 'account', label: 'Account', icon: 'user' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={'tab' + (current.name === t.id ? ' is-active' : '')}
              aria-current={current.name === t.id ? 'page' : undefined}
              onClick={() => nav.tab(t.id)}
            >
              <Icon name={t.icon} />
              {t.label}
            </button>
          ))}
        </nav>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
