import { type FormEvent, type ReactNode, type SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, BedDouble, CalendarDays, Check, ChevronLeft, CircleAlert,
  CircleUserRound, Heart, Home as HomeIcon, LoaderCircle, LogOut, Menu, MapPin,
  Plus, Search, ShieldCheck, Sparkles, Star, Tag, Users, WalletCards, X,
} from 'lucide-react';
import {
  getGetBookingQueryKey, getGetHotelQueryKey, getGetSessionQueryKey,
  getListBookingsQueryKey, useCancelBooking, useCreateBooking,
  useGetBooking, useGetHotel, useGetRewards, useGetSession, useListBookings, useListHotels,
  useLogIn, useLogOut, useSignUp, useUpdateBooking,
} from '@workspace/api-client-react';
import type { Booking, HotelSummary, Room } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';

const queryClient = new QueryClient();
const today = new Date().toISOString().slice(0, 10);
const afterThreeNights = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23c9dcd6" width="800" height="600"/%3E%3Cpath fill="%23e9b261" d="M0 500 Q180 380 370 470 T800 410V600H0z"/%3E%3C/svg%3E';

function imageFallback(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.src = fallbackImage;
}

function formatDate(value?: string) {
  if (!value) return 'Select a date';
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function money(value = 0) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <div className="lh-empty" data-testid="status-error">
      <CircleAlert size={27} />
      <strong>We couldn't bring that up</strong>
      <p>There was a small hiccup reaching our stay collection.</p>
      {retry && <button className="lh-btn lh-btn-quiet" onClick={retry} data-testid="button-retry">Try again</button>}
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="lh-hotel-grid" aria-label="Loading stays" data-testid="status-loading">
      {[1, 2, 3].map((item) => <div className={`lh-hotel-card ${item === 1 ? 'featured' : ''}`} key={item}><div className="lh-skeleton lh-hotel-photo" /><div className="lh-skeleton" style={{ height: 47, marginTop: 13 }} /></div>)}
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { data: session } = useGetSession();
  const logOut = useLogOut();
  const nav = [
    { href: '/search', label: 'Find a stay' },
    { href: '/bookings', label: 'My trips' },
    { href: '/rewards', label: 'Rewards' },
  ];
  const handleLogout = () => logOut.mutate(undefined, { onSuccess: () => { queryClient.setQueryData(getGetSessionQueryKey(), { authenticated: false, user: null }); setLocation('/'); } });
  return (
    <header className="lh-header">
      <div className="lh-container lh-header-inner">
        <Link href="/" className="lh-logo" data-testid="link-logo" onClick={() => setOpen(false)}>
          <span className="lh-logo-mark"><HomeIcon size={17} strokeWidth={2.4} /></span>
          <span>likehome</span>
        </Link>
        <nav className={`lh-nav ${open ? 'open' : ''}`} aria-label="Main navigation">
          {nav.map((item) => <Link href={item.href} key={item.href} className={location === item.href ? 'active' : ''} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setOpen(false)}>{item.label}</Link>)}
        </nav>
        <div className="lh-header-actions">
          {session?.authenticated && session.user ? (
            <>
              <Link href="/rewards" className="lh-btn lh-btn-quiet" data-testid="link-account"><CircleUserRound size={16} /> {session.user.fullName.split(' ')[0]}</Link>
              <button className="lh-btn lh-btn-ghost" onClick={handleLogout} disabled={logOut.isPending} data-testid="button-logout"><LogOut size={15} /> <span className="hidden sm:inline">Sign out</span></button>
            </>
          ) : <Link href="/login" className="lh-btn lh-btn-quiet" data-testid="link-login">Sign in</Link>}
          <button className="lh-mobile-menu" aria-label="Open navigation" onClick={() => setOpen(!open)} data-testid="button-mobile-menu">{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return <footer className="lh-footer"><div className="lh-container lh-footer-inner"><p>© 2025 likehome · Stays with a little more soul.</p><p>Made for the way you want to travel.</p></div></footer>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="lh-shell"><Header />{children}<Footer /></div>;
}

type SearchValues = { search: string; checkIn: string; checkOut: string; guests: number };

function SearchBar({ initial = {}, compact = false, onSearch }: { initial?: Partial<SearchValues>; compact?: boolean; onSearch?: (values: SearchValues) => void }) {
  const [values, setValues] = useState<SearchValues>({ search: initial.search || '', checkIn: initial.checkIn || today, checkOut: initial.checkOut || afterThreeNights, guests: initial.guests || 2 });
  const [, setLocation] = useLocation();
  const update = (key: keyof SearchValues, value: string | number) => setValues((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const query = new URLSearchParams({ search: values.search, checkIn: values.checkIn, checkOut: values.checkOut, guests: String(values.guests) });
    setLocation(`/search?${query.toString()}`);
    onSearch?.(values);
  };
  return (
    <form className={`lh-search-card ${compact ? 'compact' : ''}`} onSubmit={submit} data-testid="form-search">
      <div className="lh-search-field"><MapPin size={18} /><div><label htmlFor="destination">Where to?</label><input id="destination" value={values.search} onChange={(e) => update('search', e.target.value)} placeholder="City, coast, or a feeling" data-testid="input-destination" /></div></div>
      <div className="lh-search-field"><CalendarDays size={18} /><div><label htmlFor="check-in">Check in</label><input id="check-in" type="date" value={values.checkIn} onChange={(e) => update('checkIn', e.target.value)} data-testid="input-check-in" /></div></div>
      <div className="lh-search-field"><CalendarDays size={18} /><div><label htmlFor="check-out">Check out</label><input id="check-out" type="date" value={values.checkOut} onChange={(e) => update('checkOut', e.target.value)} data-testid="input-check-out" /></div></div>
      <div className="lh-search-field"><Users size={18} /><div><label htmlFor="guests">Guests</label><select id="guests" value={values.guests} onChange={(e) => update('guests', Number(e.target.value))} data-testid="select-guests">{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}</select></div></div>
      <button className="lh-btn lh-btn-accent" type="submit" data-testid="button-search"><Search size={17} /> Search</button>
    </form>
  );
}

function HotelCard({ hotel, featured = false }: { hotel: HotelSummary; featured?: boolean }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className={`lh-hotel-card ${featured ? 'featured' : ''}`} data-testid={`card-hotel-${hotel.id}`}>
      <div className="lh-hotel-photo"><Link href={`/hotel/${hotel.slug}`} data-testid={`link-hotel-image-${hotel.id}`}><img src={hotel.imageUrl} alt={hotel.name} onError={imageFallback} /></Link><button className="lh-heart" aria-label={saved ? 'Remove saved stay' : 'Save stay'} onClick={() => setSaved(!saved)} data-testid={`button-save-hotel-${hotel.id}`}>{saved ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />}</button></div>
      <Link href={`/hotel/${hotel.slug}`} className="lh-hotel-meta" data-testid={`link-hotel-details-${hotel.id}`}><div><h3>{hotel.name}</h3><p>{hotel.location}</p><div className="lh-price"><b>{money(hotel.startingPrice)}</b> / night</div></div><span className="lh-rating"><Star size={11} fill="currentColor" /> {hotel.rating.toFixed(1)}</span></Link>
    </article>
  );
}

function Home() {
  const hotelsQuery = useListHotels({ sort: 'rating' });
  const hotels = hotelsQuery.data || [];
  return (
    <>
      <main>
        <section className="lh-hero"><div className="lh-container lh-hero-grid"><div className="lh-reveal"><div className="lh-kicker lh-mono">Stay somewhere that feels like yours</div><h1>Go far.<br /><em>Feel close.</em></h1><p className="lh-lead">Handpicked stays with warm hosts, good light, and the small comforts that make a trip linger.</p><SearchBar /></div><div className="lh-hero-art lh-reveal"><div className="lh-hero-image"><img src={hotels[0]?.imageUrl} alt="A welcoming coastal stay" onError={imageFallback} /><div className="lh-image-scrim" /></div><div className="lh-float-note"><Sparkles size={17} color="#b06d36" /><strong>Made for your kind of away</strong><span>Stays chosen with a human eye.</span></div></div></div></section>
        <section className="lh-section"><div className="lh-container"><div className="lh-section-head"><div><div className="lh-kicker lh-mono">A few good places</div><h2>Rooms with a point of view.</h2></div><p className="lh-section-intro">From salt-air mornings to city lights after dark, these are places you will want to tell someone about.</p></div>{hotelsQuery.isLoading ? <LoadingCards /> : hotelsQuery.isError ? <ErrorState retry={() => hotelsQuery.refetch()} /> : hotels.length === 0 ? <div className="lh-empty" data-testid="status-empty-hotels"><Sparkles size={27} /><p>No stays in the collection just yet. Try searching a different corner.</p><Link href="/search" className="lh-btn lh-btn-quiet" data-testid="link-empty-search">Explore the search</Link></div> : <div className="lh-hotel-grid">{hotels.slice(0, 3).map((hotel, index) => <HotelCard hotel={hotel} featured={index === 0} key={hotel.id} />)}</div>}</div></section>
        <section className="lh-story"><div className="lh-container lh-story-grid"><div><div className="lh-mono" style={{ color: '#e9b261', marginBottom: 17 }}>The likehome promise</div><h2>Travel, but make it <em>personal.</em></h2></div><div><p className="lh-story-copy">We believe a good stay is more than an address. It is the window you open first thing, the neighborhood bakery downstairs, and the host who leaves the light on. We look for those details so you can get on with the good part.</p><div className="lh-stat-row"><div className="lh-stat"><strong>1,240</strong><span>stays to discover</span></div><div className="lh-stat"><strong>4.8/5</strong><span>average guest feeling</span></div><div className="lh-stat"><strong>24/7</strong><span>human support</span></div></div></div></div></section>
      </main>
    </>
  );
}

function SearchPage() {
  const [location] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split('?')[1] || ''), [location]);
  const [search, setSearch] = useState(params.get('search') || '');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(450);
  const [roomType, setRoomType] = useState('');
  const [sort, setSort] = useState(params.get('sort') || 'rating');
  const apiParams = useMemo(() => ({ search: search || undefined, checkIn: params.get('checkIn') || undefined, checkOut: params.get('checkOut') || undefined, guests: params.get('guests') ? Number(params.get('guests')) : undefined, minRating: minRating || undefined, maxPrice, roomType: roomType || undefined, sort: sort as 'price_low' | 'price_high' | 'rating' }), [search, minRating, maxPrice, roomType, sort, params]);
  const hotelsQuery = useListHotels(apiParams);
  const hotels = hotelsQuery.data || [];
  return <main className="lh-page"><div className="lh-container"><div className="lh-kicker lh-mono">The stay finder</div><h1 className="lh-page-title">Somewhere good<br />is waiting.</h1><p className="lh-page-subtitle">Search the collection, then follow the feeling.</p><SearchBar compact initial={{ search, checkIn: params.get('checkIn') || today, checkOut: params.get('checkOut') || afterThreeNights, guests: Number(params.get('guests') || 2) }} onSearch={(values) => setSearch(values.search)} /><div className="lh-results-layout" style={{ marginTop: 42 }}><aside className="lh-filter"><h3>Refine your stay</h3><div className="lh-filter-group"><div className="lh-filter-label"><span>Max price</span><span>{money(maxPrice)}</span></div><input type="range" min="80" max="800" step="10" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} data-testid="input-max-price" /></div><div className="lh-filter-group"><div className="lh-filter-label"><span>Guest rating</span><span>{minRating ? `${minRating}+` : 'Any'}</span></div><input type="range" min="0" max="5" step=".5" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} data-testid="input-min-rating" /></div><div className="lh-filter-group"><div className="lh-filter-label"><span>Room mood</span></div><select value={roomType} onChange={(e) => setRoomType(e.target.value)} data-testid="select-room-type"><option value="">Any room type</option><option value="Suite">Suite</option><option value="King">King</option><option value="Cabin">Cabin</option></select></div></aside><section><div className="lh-sort-row"><span data-testid="text-results-count">{hotels.length} stays found</span><label>Sort by <select value={sort} onChange={(e) => setSort(e.target.value)} data-testid="select-sort"><option value="rating">Guest favorite</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option></select></label></div>{hotelsQuery.isLoading ? <div className="lh-results">{[1, 2, 3].map((n) => <div className="lh-result-card" key={n}><div className="lh-skeleton" /><div className="lh-skeleton" style={{ height: 100 }} /></div>)}</div> : hotelsQuery.isError ? <ErrorState retry={() => hotelsQuery.refetch()} /> : hotels.length === 0 ? <div className="lh-empty" data-testid="status-empty-results"><Search size={27} /><p>Nothing matched that particular feeling.</p><button className="lh-btn lh-btn-quiet" onClick={() => { setSearch(''); setMinRating(0); setMaxPrice(450); setRoomType(''); }} data-testid="button-clear-filters">Clear filters</button></div> : <div className="lh-results">{hotels.map((hotel) => <ResultCard hotel={hotel} key={hotel.id} />)}</div>}</section></div></div></main>;
}

function ResultCard({ hotel }: { hotel: HotelSummary }) {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const stayQuery = new URLSearchParams();
  ['checkIn', 'checkOut', 'guests'].forEach((key) => {
    const value = params.get(key);
    if (value) stayQuery.set(key, value);
  });
  const detailHref = `/hotel/${hotel.slug}${stayQuery.toString() ? `?${stayQuery.toString()}` : ''}`;
  return <article className="lh-result-card" data-testid={`card-search-result-${hotel.id}`}><img src={hotel.imageUrl} alt={hotel.name} onError={imageFallback} /><div className="lh-result-info"><span className="lh-rating"><Star size={11} fill="currentColor" /> {hotel.rating.toFixed(1)} guest rating</span><h3>{hotel.name}</h3><span style={{ color: '#718180', fontSize: 12 }}><MapPin size={12} /> {hotel.location}</span><p>{hotel.description}</p><div>{hotel.amenities.slice(0, 3).map((item) => <span className="lh-chip" key={item}>{item}</span>)}</div></div><div className="lh-result-price"><div><strong>{money(hotel.startingPrice)}</strong><span> / night</span></div><Link href={detailHref} className="lh-btn lh-btn-primary" data-testid={`link-view-hotel-${hotel.id}`}>View stay <ArrowRight size={14} /></Link></div></article>;
}

function HotelDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [location, setLocation] = useLocation();
  const stayParams = useMemo(() => new URLSearchParams(location.split('?')[1] || ''), [location]);
  const [checkIn, setCheckIn] = useState(stayParams.get('checkIn') || today);
  const [checkOut, setCheckOut] = useState(stayParams.get('checkOut') || afterThreeNights);
  const [guests, setGuests] = useState(Number(stayParams.get('guests') || 2));
  const hotelQuery = useGetHotel(slug, { checkIn, checkOut, guests }, { query: { enabled: !!slug, queryKey: getGetHotelQueryKey(slug, { checkIn, checkOut, guests }) } });
  const hotel = hotelQuery.data;
  const reserve = (room: Room) => setLocation(`/checkout?hotel=${slug}&room=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  if (hotelQuery.isLoading) return <main className="lh-page"><div className="lh-container"><div className="lh-skeleton" style={{ height: 400 }} /></div></main>;
  if (hotelQuery.isError || !hotel) return <main className="lh-page"><div className="lh-container"><ErrorState retry={() => hotelQuery.refetch()} /></div></main>;
  const galleryImages = [hotel.imageUrl, ...hotel.images.filter((image) => image !== hotel.imageUrl)].slice(0, 5);
  return <main className="lh-page"><div className="lh-container"><Link href="/search" className="lh-btn lh-btn-ghost" data-testid="link-back-search"><ChevronLeft size={15} /> Back to stays</Link><div className="lh-gallery" style={{ marginTop: 23 }}>{galleryImages.map((image, index) => <img src={image} alt={`${hotel.name} view ${index + 1}`} key={`${image}-${index}`} onError={imageFallback} />)}</div><div className="lh-detail-head"><div><div className="lh-rating"><Star size={12} fill="currentColor" /> {hotel.rating.toFixed(1)} · Guest favorite</div><h1 className="lh-display">{hotel.name}</h1><p><MapPin size={14} /> {hotel.location}</p></div><button className="lh-btn lh-btn-quiet" onClick={() => navigator.clipboard?.writeText(window.location.href)} data-testid="button-share-hotel">Share this stay</button></div><div className="lh-detail-main"><div><h2>A place to settle into</h2><p className="description">{hotel.description}</p><div className="lh-amenities">{hotel.amenities.map((item) => <span className="lh-amenity" key={item}>{item}</span>)}</div><h2>Choose your room</h2><div className="lh-room-list">{hotel.rooms.map((room) => <RoomCard key={room.id} room={room} onReserve={reserve} />)}</div></div><aside className="lh-booking-card"><h3>Plan your stay</h3><div className="lh-form-field"><label htmlFor="detail-checkin">CHECK IN</label><input className="lh-input" id="detail-checkin" type="date" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} data-testid="input-detail-checkin" /></div><div className="lh-form-field"><label htmlFor="detail-checkout">CHECK OUT</label><input className="lh-input" id="detail-checkout" type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} data-testid="input-detail-checkout" /></div><div className="lh-form-field"><label htmlFor="detail-guests">GUESTS</label><select className="lh-input" id="detail-guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))} data-testid="select-detail-guests">{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}</select></div><div className="lh-summary-line"><span>From</span><strong>{money(hotel.startingPrice)} / night</strong></div><p style={{ color: '#718180', fontSize: 11, lineHeight: 1.5, marginTop: 17 }}><ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Free cancellation on select rooms.</p></aside></div></div></main>;
}

function RoomCard({ room, onReserve }: { room: Room; onReserve: (room: Room) => void }) {
  return <article className="lh-room-card" data-testid={`card-room-${room.id}`}><img src={room.imageUrl} alt={room.name} onError={imageFallback} /><div><h3>{room.name}</h3><span className="lh-chip">{room.roomType}</span><p>{room.description}</p><span style={{ color: '#718180', fontSize: 11 }}><Users size={12} /> Sleeps {room.guestCapacity}</span></div><div className="lh-room-price"><div><strong>{money(room.pricePerNight)}</strong><small>per night</small></div><button className="lh-btn lh-btn-primary" disabled={!room.available} onClick={() => onReserve(room)} data-testid={`button-reserve-room-${room.id}`}>{room.available ? 'Reserve' : 'Sold out'}</button></div></article>;
}

function CheckoutPage() {
  const query = new URLSearchParams(window.location.search);
  const hotelSlug = query.get('hotel') || '';
  const roomId = query.get('room') || '';
  const checkIn = query.get('checkIn') || today;
  const checkOut = query.get('checkOut') || afterThreeNights;
  const guests = Number(query.get('guests') || 2);
  const [useReward, setUseReward] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();
  const { data: hotel } = useGetHotel(hotelSlug, undefined, { query: { enabled: !!hotelSlug, queryKey: getGetHotelQueryKey(hotelSlug) } });
  const create = useCreateBooking();
  const room = hotel?.rooms.find((item) => item.id === roomId) || hotel?.rooms[0];
  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  const subtotal = (room?.pricePerNight || 0) * nights;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!hotel || !room) return;
    if (!cardName || cardNumber.replace(/\s/g, '').length < 12 || !expiry || cvc.length < 3) { setError('Add the demo card details you would like to use for this reservation.'); return; }
    setError('');
    create.mutate({ data: { hotelSlug, roomId: room.id, checkIn, checkOut, guests, useReward } }, { onSuccess: (booking) => setLocation(`/confirmation/${booking.id}`), onError: () => setError('We could not hold that room. Please check the dates and try once more.') });
  };
  if (!hotel || !room) return <main className="lh-page"><div className="lh-container"><div className="lh-empty"><BedDouble size={27} /><p>Choose a room first and we will bring you back here.</p><Link href="/search" className="lh-btn lh-btn-primary" data-testid="link-checkout-search">Find a stay</Link></div></div></main>;
  return <main className="lh-page"><div className="lh-container"><div className="lh-kicker lh-mono">One calm last step</div><h1 className="lh-page-title">Make it yours.</h1><p className="lh-page-subtitle">Your room is held while you review the details.</p><form className="lh-checkout-layout" onSubmit={submit}><div><section className="lh-checkout-section"><h2>Your stay</h2><div className="lh-mini-hotel"><img src={hotel.imageUrl} alt={hotel.name} onError={imageFallback} /><div><h3>{hotel.name}</h3><p>{room.name} · {guests} guest{guests > 1 ? 's' : ''}</p><p>{formatDate(checkIn)} — {formatDate(checkOut)}</p></div></div></section><section className="lh-checkout-section"><h2>Payment details</h2><div className="lh-alert" data-testid="status-demo-payment"><ShieldCheck size={16} /> Demo Payment Mode — no real card is charged.</div>{error && <div className="lh-alert" data-testid="status-checkout-error">{error}</div>}<div className="lh-form-field"><label htmlFor="card-name">NAME ON CARD</label><input className="lh-input" id="card-name" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Your full name" data-testid="input-card-name" /></div><div className="lh-form-field"><label htmlFor="card-number">CARD NUMBER</label><input className="lh-input" id="card-number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} inputMode="numeric" placeholder="4242 4242 4242 4242" data-testid="input-card-number" /></div><div className="lh-form-row"><div className="lh-form-field"><label htmlFor="expiry">EXPIRY</label><input className="lh-input" id="expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM / YY" data-testid="input-card-expiry" /></div><div className="lh-form-field"><label htmlFor="cvc">CVC</label><input className="lh-input" id="cvc" value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" data-testid="input-card-cvc" /></div></div></section></div><aside className="lh-booking-card"><h3>Reservation summary</h3><div className="lh-summary-line"><span>{money(room.pricePerNight)} × {nights} nights</span><strong>{money(subtotal)}</strong></div><label className="lh-toggle" style={{ marginTop: 17 }}><input type="checkbox" checked={useReward} onChange={(e) => setUseReward(e.target.checked)} data-testid="input-use-rewards" /><span><b>Use reward points</b><br />Save on this stay when you have points to spare.</span></label><div className="lh-summary-total"><span>Total</span><span>{money(useReward ? Math.max(0, subtotal - 25) : subtotal)}</span></div><button className="lh-btn lh-btn-primary lh-btn-block" type="submit" disabled={create.isPending} data-testid="button-confirm-reservation">{create.isPending ? <><LoaderCircle size={15} className="animate-spin" /> Holding room…</> : <>Confirm reservation <ArrowRight size={15} /></>}</button><p style={{ color: '#718180', fontSize: 11, lineHeight: 1.5, textAlign: 'center', marginTop: 15 }}><ShieldCheck size={13} /> Secure checkout · no hidden fees</p></aside></form></div></main>;
}

function ConfirmationPage() {
  const { id = '' } = useParams<{ id: string }>();
  const bookingQuery = useGetBooking(id, { query: { enabled: !!id, queryKey: getGetBookingQueryKey(id) } });
  const booking = bookingQuery.data;
  if (bookingQuery.isLoading) return <main className="lh-page"><div className="lh-container lh-empty"><div className="lh-skeleton" style={{ height: 250 }} /></div></main>;
  if (!booking) return <main className="lh-page"><div className="lh-container"><ErrorState retry={() => bookingQuery.refetch()} /></div></main>;
  return <main className="lh-page"><div className="lh-container"><div className="lh-confirmation"><div className="lh-checkmark"><Check size={35} /></div><div className="lh-kicker lh-mono">It is official</div><h1 className="lh-display">Your next good<br />memory is booked.</h1><p>We sent the details to your inbox. Keep this confirmation close, and start looking forward.</p><div className="lh-confirm-box"><img src={booking.hotel.imageUrl} alt={booking.hotel.name} onError={imageFallback} /><div className="lh-confirm-details"><span className="lh-mono" style={{ color: '#b06d36' }}>Confirmation</span><div className="lh-code" data-testid="text-confirmation-number">{booking.confirmationNumber}</div><h2>{booking.hotel.name}</h2><p>{booking.room.name} · {booking.guests} guest{booking.guests > 1 ? 's' : ''}</p><div className="lh-summary-line"><span>Check in</span><strong>{formatDate(booking.checkIn)}</strong></div><div className="lh-summary-line"><span>Check out</span><strong>{formatDate(booking.checkOut)}</strong></div><div className="lh-summary-total"><span>Paid</span><span data-testid="text-confirmation-total">{money(booking.total)}</span></div><Link href="/bookings" className="lh-btn lh-btn-primary lh-btn-block" data-testid="link-view-bookings">View my trips <ArrowRight size={15} /></Link></div></div></div></div></main>;
}

function BookingsPage() {
  const bookingsQuery = useListBookings();
  const cancel = useCancelBooking();
  const queryClient = useQueryClient();
  const bookings = bookingsQuery.data || [];
  const handleCancel = (booking: Booking) => { if (window.confirm('Cancel this reservation?')) cancel.mutate({ id: booking.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(booking.id) }); } }); };
  return <main className="lh-page"><div className="lh-container"><div className="lh-bookings-head"><div><div className="lh-kicker lh-mono">Your little travel book</div><h1 className="lh-page-title">My trips.</h1><p className="lh-page-subtitle" style={{ marginBottom: 0 }}>Everything booked, right where you left it.</p></div><Link href="/search" className="lh-btn lh-btn-accent" data-testid="link-book-another">Find another stay <Plus size={15} /></Link></div>{bookingsQuery.isLoading ? <div className="lh-booking-list">{[1, 2].map((n) => <div className="lh-booking-row" key={n}><div className="lh-skeleton" style={{ height: 120 }} /><div className="lh-skeleton" style={{ height: 80 }} /></div>)}</div> : bookingsQuery.isError ? <ErrorState retry={() => bookingsQuery.refetch()} /> : bookings.length === 0 ? <div className="lh-empty" data-testid="status-empty-bookings"><CalendarDays size={28} /><p>Your next trip has not been written down yet.</p><Link href="/search" className="lh-btn lh-btn-primary" data-testid="link-empty-bookings">Start exploring</Link></div> : <div className="lh-booking-list">{bookings.map((booking) => <article className="lh-booking-row" key={booking.id} data-testid={`row-booking-${booking.id}`}><img src={booking.hotel.imageUrl} alt={booking.hotel.name} onError={imageFallback} /><div><span className={`lh-status ${booking.status === 'cancelled' ? 'cancelled' : ''}`} data-testid={`status-booking-${booking.id}`}>{booking.status}</span><h3>{booking.hotel.name}</h3><p>{booking.room.name} · {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</p><p>Confirmation <b>{booking.confirmationNumber}</b> · {money(booking.total)}</p></div><div className="lh-booking-actions">{booking.status !== 'cancelled' && <Link href={`/bookings/${booking.id}/change`} className="lh-btn lh-btn-quiet" data-testid={`link-change-booking-${booking.id}`}>Change</Link>}{booking.status !== 'cancelled' && <button className="lh-btn lh-btn-ghost" onClick={() => handleCancel(booking)} disabled={cancel.isPending} data-testid={`button-cancel-booking-${booking.id}`}>Cancel</button>}</div></article>)}</div>}</div></main>;
}

function ChangeBookingPage() {
  const { id = '' } = useParams<{ id: string }>();
  const bookingQuery = useGetBooking(id, { query: { enabled: !!id, queryKey: getGetBookingQueryKey(id) } });
  const booking = bookingQuery.data;
  const hotelQuery = useGetHotel(booking?.hotel.slug || '', undefined, { query: { enabled: !!booking?.hotel.slug, queryKey: getGetHotelQueryKey(booking?.hotel.slug || '') } });
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [roomId, setRoomId] = useState('');
  const [savedId, setSavedId] = useState('');
  const update = useUpdateBooking();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (booking && savedId !== booking.id) {
      setSavedId(booking.id);
      setCheckIn(booking.checkIn);
      setCheckOut(booking.checkOut);
      setGuests(booking.guests);
      setRoomId(booking.room.id);
    }
  }, [booking, savedId]);
  if (bookingQuery.isLoading) return <main className="lh-page"><div className="lh-container"><div className="lh-skeleton" style={{ height: 300 }} /></div></main>;
  if (!booking) return <main className="lh-page"><div className="lh-container"><ErrorState retry={() => bookingQuery.refetch()} /></div></main>;
  const submit = (event: FormEvent) => { event.preventDefault(); update.mutate({ id, data: { roomId, checkIn, checkOut, guests } }, { onSuccess: (updated) => { queryClient.setQueryData(getGetBookingQueryKey(id), updated); queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }); } }); };
  return <main className="lh-page"><div className="lh-container"><Link href="/bookings" className="lh-btn lh-btn-ghost" data-testid="link-back-bookings"><ChevronLeft size={15} /> My trips</Link><div className="lh-form-card" style={{ maxWidth: 700 }}><div className="lh-kicker lh-mono">A small course correction</div><h1 className="lh-display">Change your stay.</h1><p>Adjust the details below. We will keep your original reservation safe until you save.</p><form onSubmit={submit}><div className="lh-form-row"><div className="lh-form-field"><label htmlFor="change-checkin">CHECK IN</label><input className="lh-input" id="change-checkin" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} data-testid="input-change-checkin" /></div><div className="lh-form-field"><label htmlFor="change-checkout">CHECK OUT</label><input className="lh-input" id="change-checkout" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} data-testid="input-change-checkout" /></div></div><div className="lh-form-field"><label htmlFor="change-guests">GUESTS</label><select className="lh-input" id="change-guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))} data-testid="select-change-guests">{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}</select></div><div className="lh-form-field"><label htmlFor="change-room">ROOM</label><select className="lh-input" id="change-room" value={roomId} onChange={(e) => setRoomId(e.target.value)} data-testid="select-change-room">{(hotelQuery.data?.rooms || [booking.room]).filter((room) => room.available || room.id === booking.room.id).map((room) => <option value={room.id} key={room.id}>{room.name}{room.id === booking.room.id ? ' (current)' : ''}</option>)}</select></div><button className="lh-btn lh-btn-primary lh-btn-block" type="submit" disabled={update.isPending} data-testid="button-save-change">{update.isPending ? 'Saving change…' : 'Save changes'}</button></form></div></div></main>;
}

function RewardsPage() {
  const rewardsQuery = useGetRewards();
  const sessionQuery = useGetSession();
  const rewards = rewardsQuery.data;
  return <main className="lh-page"><div className="lh-container"><div className="lh-reward-hero"><div><div className="lh-kicker lh-mono" style={{ color: '#e9b261' }}>The good guest club</div><h1 className="lh-display">More trips.<br />More <span style={{ color: '#e9b261' }}>little wins.</span></h1><p>Your points are a thank-you for choosing places with heart. Use them whenever the next adventure calls.</p></div><div className="lh-points"><strong data-testid="text-reward-balance">{rewards?.balance?.toLocaleString() || '—'}</strong><span>points ready to use</span></div></div><div className="lh-rewards-grid"><section className="lh-panel"><h2>Member perks</h2><div className="lh-benefit"><Tag className="lh-benefit-icon" size={19} /><div><strong>Points on every stay</strong><span>Earn 1 point for every dollar you spend.</span></div></div><div className="lh-benefit"><ShieldCheck className="lh-benefit-icon" size={19} /><div><strong>Thoughtful support</strong><span>Real people, ready before and during your trip.</span></div></div><div className="lh-benefit"><Sparkles className="lh-benefit-icon" size={19} /><div><strong>Early access</strong><span>Hear about special stays before everyone else.</span></div></div></section><section className="lh-panel"><h2>Point history</h2>{rewardsQuery.isLoading ? <div className="lh-loading">Loading your point history…</div> : rewardsQuery.isError ? <ErrorState retry={() => rewardsQuery.refetch()} /> : !rewards?.transactions.length ? <div className="lh-empty" data-testid="status-empty-rewards"><WalletCards size={26} /><p>Your first stay will start the story.</p></div> : rewards.transactions.map((transaction) => <div className="lh-transaction" key={transaction.id} data-testid={`row-reward-${transaction.id}`}><div><strong>{transaction.description}</strong><span>{formatDate(transaction.createdAt)}</span></div><b className={transaction.type === 'redeemed' ? 'redeemed' : ''}>{transaction.type === 'redeemed' ? '' : '+'}{transaction.points}</b></div>)}</section></div>{sessionQuery.data?.user && <p style={{ textAlign: 'center', color: '#718180', fontSize: 12, marginTop: 22 }}>Signed in as {sessionQuery.data.user.email}</p>}</div></main>;
}

function LoginPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const login = useLogIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); login.mutate({ data: { email, password } }, { onSuccess: (session) => { queryClient.setQueryData(getGetSessionQueryKey(), session); setLocation('/'); }, onError: () => setError('That email and password did not match. Try again or create an account.') }); };
  return <main className="lh-page"><div className="lh-container"><div className="lh-form-card"><div className="lh-kicker lh-mono">Welcome back</div><h1 className="lh-display">Come on in.</h1><p>Your saved stays and next good trip are waiting.</p>{error && <div className="lh-alert" data-testid="status-login-error">{error}</div>}<form onSubmit={submit}><div className="lh-form-field"><label htmlFor="login-email">EMAIL</label><input className="lh-input" id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-login-email" /></div><div className="lh-form-field"><label htmlFor="login-password">PASSWORD</label><input className="lh-input" id="login-password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="input-login-password" /></div><button className="lh-btn lh-btn-primary lh-btn-block" type="submit" disabled={login.isPending} data-testid="button-login">{login.isPending ? 'Checking…' : 'Sign in'} <ArrowRight size={15} /></button></form><div className="lh-form-foot"><span>New to likehome?</span><Link href="/signup" data-testid="link-signup">Create an account</Link></div></div></div></main>;
}

function SignupPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const signup = useSignUp();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (password !== confirmPassword) { setError('Those passwords do not match.'); return; } signup.mutate({ data: { fullName, email, password } }, { onSuccess: (session) => { queryClient.setQueryData(getGetSessionQueryKey(), session); setLocation('/rewards'); }, onError: () => setError('We could not create that account yet. Please check your details and try again.') }); };
  return <main className="lh-page"><div className="lh-container"><div className="lh-form-card"><div className="lh-kicker lh-mono">A better way to wander</div><h1 className="lh-display">Make yourself<br />at home.</h1><p>Join likehome to keep your stays, earn rewards, and make the next trip easier.</p>{error && <div className="lh-alert" data-testid="status-signup-error">{error}</div>}<form onSubmit={submit}><div className="lh-form-field"><label htmlFor="signup-name">FULL NAME</label><input className="lh-input" id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} placeholder="What should we call you?" data-testid="input-signup-name" /></div><div className="lh-form-field"><label htmlFor="signup-email">EMAIL</label><input className="lh-input" id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-signup-email" /></div><div className="lh-form-field"><label htmlFor="signup-password">PASSWORD</label><input className="lh-input" id="signup-password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 6 characters" data-testid="input-signup-password" /></div><div className="lh-form-field"><label htmlFor="signup-confirm-password">CONFIRM PASSWORD</label><input className="lh-input" id="signup-confirm-password" type="password" minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Enter it again" data-testid="input-signup-confirm-password" /></div><button className="lh-btn lh-btn-accent lh-btn-block" type="submit" disabled={signup.isPending} data-testid="button-signup">{signup.isPending ? 'Creating your account…' : 'Create account'} <ArrowRight size={15} /></button></form><div className="lh-form-foot"><span>Already have an account?</span><Link href="/login" data-testid="link-login-from-signup">Sign in</Link></div></div></div></main>;
}

function NotFound() {
  return <main className="lh-page"><div className="lh-container"><div className="lh-confirmation"><div className="lh-kicker lh-mono">A wrong turn, perhaps</div><h1 className="lh-display">This place<br />isn't on the map.</h1><p>We looked around, but there is no stay or page here. The good news: there are plenty nearby.</p><Link href="/" className="lh-btn lh-btn-primary" data-testid="link-not-found-home">Back to likehome <ArrowRight size={15} /></Link></div></div></main>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Home} /><Route path="/search" component={SearchPage} /><Route path="/hotel/:slug" component={HotelDetailPage} /><Route path="/checkout" component={CheckoutPage} /><Route path="/confirmation/:id" component={ConfirmationPage} /><Route path="/bookings" component={BookingsPage} /><Route path="/bookings/:id/change" component={ChangeBookingPage} /><Route path="/rewards" component={RewardsPage} /><Route path="/login" component={LoginPage} /><Route path="/signup" component={SignupPage} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;