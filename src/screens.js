import { useMemo, useState } from 'react';
import { Pressable, Share, Text, TextInput, View } from 'react-native';
import { Icon } from './icons.js';
import {
  categories, services, providers, slots, STATUS_FLOW, statusText,
  getCategory, getProvider, getService, priceFor, money, upcomingDates, formatDate, billFor, fmtTime, fmtNum,
} from './data.js';
import {
  C, T, Row, RowBetween, Wrap, Stack, Grow, Hr, Screen, Content, TopBar, PageHead, CloseRow, BottomBar, Card, Note,
  DemoBox, ConfirmBox, Btn, IconBtn, Chip, ChipRow, Option, Badge, Avatar, CatIcon, Rating, Meta, BillRow, Timeline,
  MapMock, Success, Empty, Segmented, ProofGrid, TextArea, SyncStatus,
} from './ui.js';

/* ---------- shared pieces ---------- */

const isActive = (b) => !['paid', 'cancelled'].includes(b.status);
const slotLabel = (start) => (slots.find((x) => x.start === start) || {}).label || '';
const time = (iso) => (iso ? fmtTime(new Date(iso)) : '');
const firstBookingOf = (store) => store.bookings.filter((b) => b.status !== 'cancelled').length === 0;

function Bold({ children }) { return <Text style={{ fontWeight: '700' }}>{children}</Text>; }

/* ---------- Home ---------- */

export function HomeScreen({ store, nav, actions }) {
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState(false);
  const active = store.bookings.find(isActive);
  const isNew = firstBookingOf(store);

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
    <Screen>
      <PageHead plain>
        <T v="label">Service address</T>
        <Row gap={6} style={{ minHeight: 32 }}>
          <Icon name="pin" size={18} color={C.blue} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{store.address.label} · {store.address.area || store.address.line}</Text>
        </Row>
      </PageHead>

      <Content>
        <T v="hero">Hi {store.name}, what needs fixing today?</T>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: focus ? C.blue : C.line, borderRadius: 14 }}>
          <Icon name="search" size={20} color={C.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search AC repair, plumber, cleaning…" placeholderTextColor="#8A94A6"
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} returnKeyType="search" accessibilityLabel="Search services"
            style={{ flex: 1, fontSize: 15, color: C.ink }} />
          {query ? <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search"><Icon name="close" size={18} color={C.muted} /></Pressable> : null}
        </View>

        {query.trim() ? (
          <Stack>
            {results.length === 0 && <T v="empty">No services match “{query}”. Try “AC”, “leak” or “cleaning”.</T>}
            {results.map(({ c, s }) => (
              <Card key={s.id} onPress={() => actions.startBooking(c.id, s.id)} style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14 }}>
                <Row>
                  <CatIcon name={c.icon} sm />
                  <Grow><T v="strong">{s.name}</T><T v="muted" style={{ fontSize: 12 }}>{c.name} · from {money(priceFor(s, null))}</T></Grow>
                  <Icon name="arrowRight" size={18} />
                </Row>
              </Card>
            ))}
          </Stack>
        ) : null}

        {active && (
          <View style={{ gap: 14, padding: 18, borderRadius: 20, backgroundColor: C.ink }}>
            <RowBetween>
              <Row gap={6} style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: C.navy2 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#5B8CFF' }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#B8CCFF' }}>Active booking</Text>
              </Row>
              <T v="faint">#{active.id}</T>
            </RowBetween>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{getCategory(active.categoryId).name} · {statusText[active.status]}</Text>
              <Text style={{ fontSize: 14, color: C.faint, marginTop: 4 }}>{getProvider(active.providerId).name} · {formatDate(active.dateIso)}, {slotLabel(active.slotStart)}</Text>
            </View>
            <Btn variant="light" iconRight="arrowRight" onPress={() => nav.go('tracking', { id: active.id })}>Track booking</Btn>
          </View>
        )}

        <Stack gap={14}>
          <T v="section">Services</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {categories.map((c) => (
              <Pressable key={c.id} onPress={() => actions.startBooking(c.id)} accessibilityRole="button"
                style={({ pressed }) => ({ width: '22.5%', flexGrow: 1, alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: pressed ? C.blueLine : C.line })}>
                <CatIcon name={c.icon} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.ink, textAlign: 'center' }}>{c.name}</Text>
              </Pressable>
            ))}
          </View>
        </Stack>

        {isNew && (
          <Row gap={14} style={{ padding: 16, borderRadius: 16, backgroundColor: C.warmSoft }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="tag" color="#B45309" />
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#5C2D06' }}>10% off your first booking</Text>
              <Text style={{ fontSize: 13, color: C.warmText }}>Applied automatically, up to ₹100</Text>
            </View>
          </Row>
        )}

        <Stack gap={14}>
          <T v="section">Why customers trust Servizato</T>
          <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16 }}>
            {[
              ['shield', 'Verified professionals', 'Every provider is background-checked'],
              ['lock', 'OTP-secured visits', 'Work starts only after you share your OTP'],
              ['wallet', 'Pay after the job', 'Clear invoice with photo proof'],
            ].map(([icon, title, sub], i) => (
              <Row key={title} gap={14} style={{ paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: i ? 1 : 0, borderColor: C.line3 }}>
                <Icon name={icon} color={C.green} />
                <View style={{ flex: 1 }}><T v="strong">{title}</T><T v="muted">{sub}</T></View>
              </Row>
            ))}
          </View>
        </Stack>
      </Content>
    </Screen>
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
    <Screen>
      <TopBar title={cat.title} sub="Step 1 of 3 · Choose services" onBack={nav.back} />
      <Content>
        <Wrap gap={6}>
          <Badge tone="good">Pay after service</Badge>
          <Badge>OTP-secured visit</Badge>
          <Badge>Verified pros</Badge>
        </Wrap>
        <T v="section">Select what you need</T>
        <Stack>
          {list.map((s) => {
            const on = draft.serviceIds.includes(s.id);
            return (
              <Card key={s.id} on={on}>
                <Row gap={14} align="stretch">
                  <Grow>
                    <T v="cardTitle">{s.name}</T>
                    <T v="cardDesc">{s.desc}</T>
                    <Meta icon="clock">{s.time}</Meta>
                  </Grow>
                  <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: C.ink }}>{money(priceFor(s, null))}</Text>
                    <Pressable onPress={() => toggle(s.id)} accessibilityRole="button" accessibilityState={{ selected: on }}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 88, height: 40, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: C.blue, backgroundColor: on ? C.blue : '#fff' }}>
                      {on && <Icon name="check" size={16} color="#fff" />}
                      <Text style={{ fontSize: 14, fontWeight: '700', color: on ? '#fff' : C.blue }}>{on ? 'Added' : 'Add'}</Text>
                    </Pressable>
                  </View>
                </Row>
              </Card>
            );
          })}
        </Stack>
        <Note>Prices shown are starting prices. Spare parts, if needed, are added to your bill only after you approve them.</Note>
      </Content>
      <BottomBar>
        <Btn lg disabled={count === 0} onPress={() => nav.go('providers')} style={{ minHeight: 58, justifyContent: count ? 'space-between' : 'center' }}>
          {count === 0 ? <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Add a service to continue</Text> : (
            <>
              <View>
                <Text style={{ color: '#DCE5FF', fontSize: 12, fontWeight: '600' }}>{count} {count === 1 ? 'service' : 'services'}</Text>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>from {money(total)}</Text>
              </View>
              <Row gap={6}><Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Choose provider</Text><Icon name="arrowRight" size={18} color="#fff" /></Row>
            </>
          )}
        </Btn>
      </BottomBar>
    </Screen>
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
  const firstBooking = firstBookingOf(store);

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
  const earliest = (h) => (h > 12 ? h - 12 + ' PM' : h === 12 ? '12 PM' : h + ' AM');

  return (
    <Screen>
      <TopBar title="Providers near you" sub={'Step 2 of 3 · ' + chosen.map((s) => s.name).join(', ')} onBack={nav.back} />
      <ChipRow>
        {SORTS.map((s) => <Chip key={s.id} on={sort === s.id} onPress={() => setSort(s.id)}>{s.label}</Chip>)}
      </ChipRow>
      <Content>
        <T v="muted">{list.length} verified providers serve your area</T>
        {list.map((p, i) => (
          <Card key={p.id} gap={14}>
            <Row align="flex-start">
              <Avatar text={p.initials} round={false} />
              <Grow>
                <Row gap={6}><T v="cardTitle">{p.name}</T><Icon name="shield" size={16} color={C.green} /></Row>
                <Wrap gap={12} style={{ alignItems: 'center' }}>
                  <Rating value={p.rating} />
                  <T v="muted" style={{ color: C.ink2 }}>{fmtNum(p.reviews)} reviews</T>
                  <T v="muted" style={{ color: C.ink2 }}>{p.km} km away</T>
                </Wrap>
              </Grow>
              <View style={{ alignItems: 'flex-end' }}>
                <T v="muted" style={{ fontSize: 12 }}>From</T>
                <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink }}>{money(p.total)}</Text>
              </View>
            </Row>
            <Wrap gap={6}>
              <Badge icon="clock">Earliest {earliest(p.earliest)}</Badge>
              <Badge>{p.jobs} jobs done</Badge>
              {firstBooking && <Badge tone="warm" icon="tag">10% off first booking</Badge>}
              {p.offer ? <Badge tone="warm" icon="tag">{p.offer}</Badge> : null}
            </Wrap>
            <Btn variant={i === 0 ? 'primary' : 'outline'} onPress={() => pick(p)}>Select {p.name.split(' ')[0]}</Btn>
          </Card>
        ))}
      </Content>
    </Screen>
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
  const discount = firstBookingOf(store) ? Math.min(Math.round(subtotal * 0.1), 100) : 0;
  const slotValid = draft.slotStart != null && !unavailable(slots.find((s) => s.start === draft.slotStart));

  const setDate = (iso) => setDraft((d) => ({ ...d, dateIso: iso, slotStart: null }));

  return (
    <Screen>
      <TopBar title="Schedule your visit" sub={'Step 3 of 3 · ' + provider.name} onBack={nav.back} />
      <Content>
        <Stack>
          <T v="sectionSm">Pick a date</T>
          <Row gap={8}>
            {dates.map((d) => {
              const on = d.iso === dateIso;
              return (
                <Pressable key={d.iso} onPress={() => setDate(d.iso)} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: on ? C.blue : C.line, backgroundColor: on ? C.blue : '#fff' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: on ? '#fff' : C.ink }}>{d.day}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: on ? '#fff' : C.ink }}>{d.num}</Text>
                </Pressable>
              );
            })}
          </Row>
        </Stack>

        <Stack>
          <T v="sectionSm">Pick a time</T>
          {noneToday && <T v="empty">No slots left today. Pick another date.</T>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {slots.map((s) => {
              const off = unavailable(s);
              const on = draft.slotStart === s.start && !off;
              return (
                <Pressable key={s.start} disabled={off} onPress={() => setDraft((d) => ({ ...d, slotStart: s.start }))} accessibilityRole="button" accessibilityState={{ selected: on, disabled: off }}
                  style={{
                    width: '48%', flexGrow: 1, minHeight: 50, padding: 6, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
                    borderColor: off ? C.line3 : on ? C.blue : C.line, backgroundColor: off ? C.line3 : on ? C.blueSoft : '#fff',
                  }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: off ? '#6B7585' : on ? C.blueDark : C.ink }}>{s.label}</Text>
                  {off && <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7585' }}>Unavailable</Text>}
                </Pressable>
              );
            })}
          </View>
        </Stack>

        <Stack>
          <T v="sectionSm">Service address</T>
          <Card>
            <Row><Icon name="pin" color={C.blue} /><Grow><T v="strong">{store.address.label}</T><T v="muted">{store.address.line}</T></Grow></Row>
          </Card>
        </Stack>

        <Stack>
          <T v="sectionSm">Describe the problem <T v="muted" style={{ fontWeight: '500' }}>(optional)</T></T>
          <TextArea value={draft.note} onChangeText={(v) => setDraft((d) => ({ ...d, note: v }))}
            placeholder="e.g. AC is running but not cooling, water dripping from indoor unit" />
        </Stack>

        <Card gap={10}>
          <T v="sectionSm">Price estimate</T>
          {lines.map((l) => <BillRow key={l.name} label={l.name} value={money(l.amount)} />)}
          <BillRow label="Visiting charge" value="Free" good />
          {discount > 0 && <BillRow label="First booking offer" value={'−' + money(discount)} good />}
          <Hr />
          <BillRow total label="Estimated total" value={money(subtotal - discount)} />
          <Meta icon="lock">Nothing to pay now. GST is added on the final invoice.</Meta>
        </Card>
      </Content>
      <BottomBar>
        <T v="muted" style={{ textAlign: 'center', color: C.ink2 }}>{slotValid ? `${dateObj.long} · ${slotLabel(draft.slotStart)}` : 'Choose a time slot to continue'}</T>
        <Btn lg disabled={!slotValid} onPress={() => actions.createBooking({ dateIso })}>Confirm booking</Btn>
      </BottomBar>
    </Screen>
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
  ].map((s, i) => ({
    ...s,
    time: time(booking.history?.[s.id]),
    state: done || i < idx || (i === idx && s.id === 'completed') ? 'done' : i === idx ? 'current' : 'todo',
  }));

  return (
    <Screen>
      <TopBar title={'Booking #' + booking.id} sub={`${cat.name} · ${formatDate(booking.dateIso)}, ${slotLabel(booking.slotStart)}`} onBack={nav.back} />
      <Content>
        {booking.status === 'onway' && <MapMock chip="Arriving in about 12 min" />}

        {cancelled && <Note tone="danger">{booking.declined ? `${provider.name} couldn't take this booking. Please book again with another provider.` : 'This booking was cancelled.'}</Note>}

        {idx >= 1 && !cancelled && (
          <Card>
            <Row>
              <Avatar text={tech.initials} />
              <Grow><T v="strong">{tech.name}</T><Row gap={6}><Rating value={tech.rating} size={13} /><T v="meta">{provider.name}</T></Row></Grow>
              <IconBtn name="chat" variant="outline" label={'Message ' + tech.name} onPress={demoContact} />
              <IconBtn name="phone" variant="solid" label={'Call ' + tech.name} onPress={demoContact} />
            </Row>
          </Card>
        )}

        {idx >= 0 && idx < 3 && !cancelled && (
          <View style={{ gap: 12, padding: 16, borderRadius: 18, backgroundColor: C.ink }}>
            <Row gap={8}><Icon name="lock" size={18} color="#fff" /><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Your start OTP</Text></Row>
            <Row gap={10}>
              {booking.otp.split('').map((d, i) => (
                <View key={i} style={{ flex: 1, height: 56, borderRadius: 12, backgroundColor: C.navy2, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{d}</Text>
                </View>
              ))}
            </Row>
            <Text style={{ fontSize: 13, lineHeight: 19, color: C.faint }}>Share this only when the technician is at your door. Work cannot start without it.</Text>
          </View>
        )}

        <Card>
          <T v="sectionSm">Booking progress</T>
          <Timeline steps={steps} />
        </Card>

        {!done && !cancelled && booking.status !== 'completed' && booking.live && (
          <Note icon="refresh">Live: {provider.name} and your technician update this booking. It refreshes on its own.</Note>
        )}

        {!done && !cancelled && booking.status !== 'completed' && !booking.live && (
          <DemoBox>
            <T v="body" style={{ fontSize: 13, color: C.ink2, lineHeight: 19 }}><Bold>Demo mode. </Bold>Open the Servizato Partner app to accept this booking, or tap below to simulate the next update.</T>
            <Btn variant="outline" icon="refresh" onPress={() => actions.advance(booking)}>Simulate next update</Btn>
          </DemoBox>
        )}

        {booking.status === 'completed' && <Btn lg onPress={() => nav.go('invoice', { id: booking.id })}>View invoice and pay</Btn>}
        {done && <Btn variant="outline" onPress={() => nav.go('invoice', { id: booking.id })}>View invoice</Btn>}

        {idx >= 0 && idx < 3 && !cancelled && (
          confirmCancel ? (
            <ConfirmBox text="Cancel this booking? This can’t be undone." keepLabel="Keep booking" confirmLabel="Cancel booking"
              onKeep={() => setConfirmCancel(false)} onConfirm={() => actions.cancel(booking)} />
          ) : (
            <Btn variant="linkDanger" style={{ alignSelf: 'center' }} onPress={() => setConfirmCancel(true)}>Cancel booking</Btn>
          )
        )}
      </Content>
    </Screen>
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
  const invoiceNo = 'INV-' + booking.id.slice(3);

  const pay = () => {
    setPaying(true);
    setTimeout(() => actions.pay(booking, method), 900);
  };
  const share = () => {
    const rows = [
      ...bill.lines.map((l) => `${l.name}: ${money(l.amount)}`),
      ...bill.parts.map((p) => `${p.name} (part): ${money(p.price)}`),
      ...(bill.discount ? [`First booking offer: −${money(bill.discount)}`] : []),
      `GST (18%): ${money(bill.gst)}`,
      `${paid ? 'Total paid' : 'Total payable'}: ${money(bill.total)}`,
    ];
    Share.share({ title: 'Invoice ' + invoiceNo, message: `Servizato invoice ${invoiceNo}\n${provider.name} · ${formatDate(booking.dateIso)}\n\n${rows.join('\n')}` }).catch(() => {});
  };

  return (
    <Screen>
      <TopBar title={'Invoice #' + invoiceNo} sub={provider.name + ' · ' + formatDate(booking.dateIso)} onBack={nav.back}
        right={<IconBtn name="download" variant="outline" label="Share invoice" onPress={share} />} />
      <Content>
        <Note tone="good" icon="checkCircle">{paid ? 'Paid · ' + (METHODS.find((m) => m.id === booking.payMethod)?.label || '') : 'Job completed by ' + (booking.tech || provider.technician).name}</Note>

        <Stack>
          <T v="sectionSm">Proof of work</T>
          <ProofGrid photos={booking.photos} placeholders={['Before', 'After', bill.parts.length ? 'Part replaced' : 'Work area']} />
        </Stack>

        <Card gap={10}>
          <T v="sectionSm">Bill details</T>
          {bill.lines.map((l) => <BillRow key={l.name} label={l.name} value={money(l.amount)} />)}
          {bill.parts.map((p, i) => <BillRow key={p.name + i} label={p.name} sub="Part approved by you" value={money(p.price)} />)}
          {bill.discount > 0 && <BillRow label="First booking offer" value={'−' + money(bill.discount)} good />}
          <BillRow label="GST (18%)" value={money(bill.gst)} />
          <Hr />
          <BillRow total label={paid ? 'Total paid' : 'Total payable'} value={money(bill.total)} />
        </Card>

        {!paid && (
          <Stack>
            <T v="sectionSm">Pay with</T>
            {METHODS.map((m) => (
              <Option key={m.id} on={method === m.id} onPress={() => setMethod(m.id)} left={<Icon name={m.icon} color={C.blue} />} title={m.label} sub={m.sub} />
            ))}
          </Stack>
        )}
      </Content>
      {!paid && (
        <BottomBar>
          <Btn lg disabled={paying} onPress={pay}>
            {paying ? 'Processing…' : method === 'cash' ? 'Confirm cash payment' : 'Pay ' + money(bill.total)}
          </Btn>
        </BottomBar>
      )}
    </Screen>
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
    <Screen>
      <CloseRow onClose={() => (route.justPaid ? nav.tab('home') : nav.back())} />
      <Content>
        {route.justPaid
          ? <Success title="Payment successful" sub={`${money(bill.total)} paid to ${provider.name}${methodLabel ? ' via ' + methodLabel : ''}`} />
          : <T v="pageTitle">Rate your service</T>}

        <Card gap={14}>
          <Row>
            <Avatar text={tech.initials} />
            <Stack gap={3} style={{ flex: 1 }}>
              <T v="strong">How was {tech.name.split(' ')[0]}’s service?</T>
              <T v="muted">{getCategory(booking.categoryId).name} · {provider.name}</T>
            </Stack>
          </Row>
          <View style={{ alignItems: 'center', gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel="Rating">
            <Row gap={0}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="radio" accessibilityState={{ checked: rating === n }} accessibilityLabel={n + ' out of 5'}
                  style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="star" filled={n <= rating} size={36} color={n <= rating ? C.star : '#B9C0CB'} />
                </Pressable>
              ))}
            </Row>
            <T v={rating ? 'strong' : 'muted'}>{WORDS[rating]}</T>
          </View>
          <Stack>
            <T v="strong">What went well?</T>
            <Wrap>
              {TAGS.map((t) => {
                const on = tags.includes(t);
                return <Chip key={t} on={on} onPress={() => setTags((x) => (on ? x.filter((y) => y !== t) : [...x, t]))}>{t}</Chip>;
              })}
            </Wrap>
          </Stack>
          <Stack>
            <T v="strong">Add a comment <T v="muted" style={{ fontWeight: '500' }}>(optional)</T></T>
            <TextArea value={comment} onChangeText={setComment} placeholder="Tell others about your experience" />
          </Stack>
        </Card>
      </Content>
      <BottomBar>
        <Btn lg disabled={!rating} onPress={() => actions.review(booking, { rating, tags, comment })}>Submit review</Btn>
        <Btn variant="ghost" onPress={() => nav.tab('bookings', { view: 'past' })}>Skip for now</Btn>
      </BottomBar>
    </Screen>
  );
}

/* ---------- Bookings ---------- */

export function BookingsScreen({ store, nav, actions, route }) {
  const [tab, setTab] = useState(route.view === 'past' ? 'past' : 'up');
  const upcoming = store.bookings.filter(isActive);
  const past = store.bookings.filter((b) => !isActive(b));
  const list = tab === 'up' ? upcoming : past;

  return (
    <Screen>
      <PageHead>
        <T v="pageTitle">My bookings</T>
        <Segmented value={tab} onChange={setTab} options={[
          { id: 'up', label: `Upcoming (${upcoming.length})` },
          { id: 'past', label: `Past (${past.length})` },
        ]} />
      </PageHead>
      <Content>
        {list.length === 0 && (
          <Empty icon="calendar" title={tab === 'up' ? 'No upcoming bookings' : 'No past bookings yet'}
            sub="Book a service and you can track it here." action="Book a service" onAction={() => nav.tab('home')} />
        )}
        {list.map((b) => {
          const cat = getCategory(b.categoryId);
          const provider = getProvider(b.providerId);
          const bill = billFor(b);
          return (
            <Card key={b.id} on={isActive(b)} gap={10}>
              <RowBetween align="flex-start">
                <Row style={{ flex: 1 }}>
                  <CatIcon name={cat.icon} sm />
                  <Grow><T v="strong">{b.serviceIds.map((id) => getService(cat.id, id).name).join(', ')}</T><T v="muted">{provider.name} · #{b.id}</T></Grow>
                </Row>
                <Badge tone={b.status === 'paid' ? 'good' : b.status === 'cancelled' ? 'bad' : 'blue'}>{statusText[b.status]}</Badge>
              </RowBetween>
              <Wrap gap={12}>
                <Meta icon="calendar">{formatDate(b.dateIso)}</Meta>
                <Meta icon="clock">{slotLabel(b.slotStart)}</Meta>
                {b.status === 'paid' && <T v="meta" style={{ fontWeight: '700' }}>{money(bill.total)}</T>}
              </Wrap>
              {b.review && (
                <Row gap={6}><Icon name="star" filled size={14} color={C.star} /><T v="meta">You rated {b.review.rating} of 5</T></Row>
              )}
              <Wrap>
                {isActive(b) && <Btn onPress={() => nav.go('tracking', { id: b.id })}>Track booking</Btn>}
                {b.status === 'paid' && <Btn variant="outline" onPress={() => nav.go('invoice', { id: b.id })}>Invoice</Btn>}
                {!isActive(b) && <Btn variant="soft" onPress={() => actions.startBooking(b.categoryId)}>Book again</Btn>}
                {b.status === 'paid' && !b.review && <Btn variant="soft" onPress={() => nav.go('review', { id: b.id })}>Rate</Btn>}
              </Wrap>
            </Card>
          );
        })}
      </Content>
    </Screen>
  );
}

/* ---------- Account ---------- */

export function AccountScreen({ store, actions }) {
  const total = store.bookings.length;
  return (
    <Screen>
      <PageHead><T v="pageTitle">Account</T></PageHead>
      <Content>
        <Card>
          <Row>
            <Avatar text={store.name.slice(0, 1)} lg />
            <Grow><T v="cardTitle">{store.name}</T><T v="muted">{total} {total === 1 ? 'booking' : 'bookings'}</T></Grow>
          </Row>
        </Card>
        <Card gap={10}>
          <T v="sectionSm">Saved address</T>
          <Row><Icon name="pin" color={C.blue} /><Grow><T v="strong">{store.address.label}</T><T v="muted">{store.address.line}</T></Grow></Row>
        </Card>
        <SyncStatus />
        <DemoBox>
          <T v="body" style={{ fontSize: 13, color: C.ink2, lineHeight: 19 }}>
            <Bold>Prototype. </Bold>Providers, prices and technicians are sample data. With cloud sync on, your bookings reach the provider and technician on their own phones; otherwise they stay on this phone.
          </T>
          <Btn variant="outline" onPress={actions.reset}>Clear demo data</Btn>
        </DemoBox>
      </Content>
    </Screen>
  );
}
