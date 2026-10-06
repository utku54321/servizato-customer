import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { STATUS_FLOW, demoParts, getCategory, getProvider, statusText } from './data.js';
import { readJobs, removeJobs, subscribe, mergeJob, syncBookings } from './shared.js';
import { storage } from './storage.js';
import { useNav, useToast } from './shell.js';
import { TabBar, Toast } from './ui.js';
import {
  HomeScreen, ServicesScreen, ProvidersScreen, ScheduleScreen,
  TrackingScreen, InvoiceScreen, ReviewScreen, BookingsScreen, AccountScreen,
} from './screens.js';

// Bump the version whenever sample data IDs change, so old saved bookings are dropped.
const STORAGE_KEY = 'servizato-customer-v2';

const initialStore = {
  name: 'Priya',
  address: { label: 'Home', area: 'Sector 62, Noida', line: 'Flat 402, Tower B, Sector 62, Noida' },
  bookings: [],
};

function loadStore() {
  try {
    const raw = storage.getItem(STORAGE_KEY);
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
  const [stack, nav] = useNav({ name: 'home' });
  const [draft, setDraft] = useState(null);
  const [toast, setToast] = useToast();

  useEffect(() => {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
    syncBookings(store); // publish bookings to the cloud so providers and technicians see them
  }, [store]);

  // Live updates from the provider + technician apps.
  const [sharedJobs, setSharedJobs] = useState(readJobs);
  useEffect(() => subscribe(() => setSharedJobs(readJobs())), []);
  const bookings = useMemo(
    () => store.bookings.map((b) => ({ ...mergeJob(b, sharedJobs[b.id]), live: !!sharedJobs[b.id] })),
    [store.bookings, sharedJobs]
  );
  const view = useMemo(() => ({ ...store, bookings }), [store, bookings]);

  // Toast when the provider or technician moves a booking forward.
  const lastStatus = useRef(null);
  useEffect(() => {
    const prev = lastStatus.current;
    lastStatus.current = Object.fromEntries(bookings.map((b) => [b.id, b.status]));
    if (!prev) return;
    const changed = bookings.find((b) => b.live && prev[b.id] && prev[b.id] !== b.status);
    if (!changed) return;
    const tech = changed.tech?.name || 'Your technician';
    const msgs = {
      confirmed: 'The technician could not make it. Finding another one',
      assigned: tech + ' is assigned to your job',
      onway: tech + ' is on the way',
      started: 'Job started with your OTP',
      completed: 'Job completed. Your invoice is ready',
      cancelled: changed.declined ? 'The provider could not take this booking' : statusText.cancelled,
    };
    if (msgs[changed.status]) setToast(msgs[changed.status]);
  }, [bookings, setToast]);

  const current = stack[stack.length - 1];

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
      if (next === 'completed' && demoParts[booking.categoryId] && !(booking.parts || []).length) patch.parts = [demoParts[booking.categoryId]];
      updateBooking(booking.id, patch);
      const tech = (booking.tech || getProvider(booking.providerId).technician).name;
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
      const paidAt = new Date().toISOString();
      // Keep the technician's parts on the paid booking so the invoice stays complete.
      updateBooking(booking.id, { status: 'paid', payMethod: method, paidAt, parts: booking.parts || [], history: { ...booking.history, paid: paidAt } });
      nav.replace([{ name: 'home' }, { name: 'review', id: booking.id, justPaid: true }]);
    },
    review: (booking, review) => {
      updateBooking(booking.id, { review });
      setToast('Thanks for your review');
      nav.tab('bookings', { view: 'past' });
    },
    notify: (msg) => setToast(msg),
    reset: () => {
      const ids = new Set(store.bookings.map((b) => b.id));
      removeJobs((id) => ids.has(id));
      setStore(initialStore);
      setDraft(null);
      setToast('Demo data cleared');
      nav.tab('home');
    },
  };

  const booking = current.id ? bookings.find((b) => b.id === current.id) : null;
  const props = { store: view, nav, draft, setDraft, actions, booking, route: current };

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

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }} key={stack.length + current.name + (current.view || '')}>{screen}</View>
      {TABS.includes(current.name) && (
        <TabBar current={current.name} onTab={nav.tab} tabs={[
          { id: 'home', label: 'Home', icon: 'home' },
          { id: 'bookings', label: 'Bookings', icon: 'calendar' },
          { id: 'account', label: 'Account', icon: 'user' },
        ]} />
      )}
      <Toast text={toast} />
    </View>
  );
}
