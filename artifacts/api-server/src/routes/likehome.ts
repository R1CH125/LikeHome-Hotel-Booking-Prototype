import { Router, type IRouter, type Request, type Response } from "express";
import {
  bookings,
  findHotel,
  findRoom,
  hotels,
  rewardTransactions,
  sessions,
  type BookingRecord,
  type User,
  users,
} from "./likehome-data";

const router: IRouter = Router();
const DAY = 86_400_000;
const freeNightPoints = 1_000;
const cancellationWindowHours = 48;

const today = () => new Date().toISOString().slice(0, 10);
const nightsBetween = (checkIn: string, checkOut: string) =>
  Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / DAY);
const money = (value: number) => Math.round(value * 100) / 100;
const queryString = (value: unknown) => (typeof value === "string" ? value : "");
const currentUser = (req: Request): User | undefined => {
  const sessionId = req.cookies?.likehome_session;
  const userId = sessionId ? sessions.get(sessionId) : undefined;
  return users.find((user) => user.id === userId);
};
const requireUser = (req: Request, res: Response) => {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Please log in to continue." });
    return undefined;
  }
  return user;
};
const toSummary = (hotel: ReturnType<typeof findHotel>) => {
  if (!hotel) return undefined;
  return {
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    location: hotel.location,
    imageUrl: hotel.imageUrl,
    rating: hotel.rating,
    startingPrice: Math.min(...hotel.rooms.map((room) => room.pricePerNight)),
    description: hotel.description,
    amenities: hotel.amenities,
  };
};
const roomIsAvailable = (hotelSlug: string, roomId: string, checkIn: string, checkOut: string, ignoreId?: string) =>
  bookings.filter((booking) =>
    booking.hotelSlug === hotelSlug &&
    booking.roomId === roomId &&
    booking.status !== "cancelled" &&
    booking.id !== ignoreId &&
    booking.checkIn < checkOut &&
    booking.checkOut > checkIn,
  ).length < (findRoom(findHotel(hotelSlug), roomId)?.inventory ?? 0);
const hasUserConflict = (userId: string, checkIn: string, checkOut: string, ignoreId?: string) =>
  bookings.some((booking) =>
    booking.userId === userId &&
    booking.status === "confirmed" &&
    booking.id !== ignoreId &&
    booking.checkIn < checkOut &&
    booking.checkOut > checkIn,
  );
const serializeBooking = (booking: BookingRecord) => {
  const hotel = findHotel(booking.hotelSlug);
  const room = findRoom(hotel, booking.roomId);
  return { ...booking, hotel: toSummary(hotel), room: room ? { ...room, available: true } : undefined };
};
const validDates = (checkIn: string, checkOut: string, guests: number, capacity: number) =>
  Boolean(checkIn && checkOut && checkIn >= today() && checkOut > checkIn && guests >= 1 && guests <= capacity);

router.get("/hotels", (req, res) => {
  const search = queryString(req.query.search).toLowerCase();
  const minPrice = Number(req.query.minPrice) || 0;
  const maxPrice = Number(req.query.maxPrice) || Number.POSITIVE_INFINITY;
  const minRating = Number(req.query.minRating) || 0;
  const roomType = queryString(req.query.roomType);
  const checkIn = queryString(req.query.checkIn);
  const checkOut = queryString(req.query.checkOut);
  const guests = Number(req.query.guests) || 1;
  const sort = queryString(req.query.sort);
  const result = hotels
    .filter((hotel) => {
      const startingPrice = Math.min(...hotel.rooms.map((room) => room.pricePerNight));
      return (!search || `${hotel.name} ${hotel.location}`.toLowerCase().includes(search)) &&
        startingPrice >= minPrice && startingPrice <= maxPrice && hotel.rating >= minRating &&
        hotel.rooms.some((room) => (!roomType || room.roomType === roomType) && room.guestCapacity >= guests &&
          (!checkIn || !checkOut || roomIsAvailable(hotel.slug, room.id, checkIn, checkOut)));
    })
    .map(toSummary)
    .filter((hotel): hotel is NonNullable<typeof hotel> => Boolean(hotel));
  result.sort((a, b) => sort === "price_high" ? b.startingPrice - a.startingPrice : sort === "rating" ? b.rating - a.rating : a.startingPrice - b.startingPrice);
  res.json(result);
});

router.get("/hotels/:slug", (req, res) => {
  const hotel = findHotel(req.params.slug);
  if (!hotel) return res.status(404).json({ error: "We couldn't find that stay." });
  const checkIn = queryString(req.query.checkIn);
  const checkOut = queryString(req.query.checkOut);
  const guests = Number(req.query.guests) || 1;
  const rooms = hotel.rooms
    .filter((room) => room.guestCapacity >= guests)
    .map((room) => ({ ...room, available: !checkIn || !checkOut || roomIsAvailable(hotel.slug, room.id, checkIn, checkOut) }));
  return res.json({ ...toSummary(hotel), images: hotel.images, rooms });
});

router.get("/auth/session", (req, res) => {
  const user = currentUser(req);
  res.json({ authenticated: Boolean(user), user: user ? { id: user.id, fullName: user.fullName, email: user.email, rewardPoints: user.rewardPoints } : null });
});

router.post("/auth/signup", (req, res) => {
  const fullName = queryString(req.body?.fullName).trim();
  const email = queryString(req.body?.email).trim().toLowerCase();
  const password = queryString(req.body?.password);
  if (fullName.length < 2 || !email.includes("@") || password.length < 6) return res.status(400).json({ error: "Enter a name, a valid email, and a password with at least 6 characters." });
  if (users.some((user) => user.email === email)) return res.status(400).json({ error: "An account with that email already exists." });
  const user: User = { id: `user-${users.length + 1}`, fullName, email, password, rewardPoints: 0 };
  users.push(user);
  const sessionId = `session-${Date.now()}-${users.length}`;
  sessions.set(sessionId, user.id);
  res.cookie("likehome_session", sessionId, { httpOnly: true, sameSite: "lax", maxAge: 86_400_000 * 30 });
  return res.status(201).json({ authenticated: true, user: { id: user.id, fullName, email, rewardPoints: 0 } });
});

router.post("/auth/login", (req, res) => {
  const email = queryString(req.body?.email).trim().toLowerCase();
  const password = queryString(req.body?.password);
  const user = users.find((candidate) => candidate.email === email && candidate.password === password);
  if (!user) return res.status(401).json({ error: "That email and password combination didn't work." });
  const sessionId = `session-${Date.now()}-${user.id}`;
  sessions.set(sessionId, user.id);
  res.cookie("likehome_session", sessionId, { httpOnly: true, sameSite: "lax", maxAge: 86_400_000 * 30 });
  return res.json({ authenticated: true, user: { id: user.id, fullName: user.fullName, email: user.email, rewardPoints: user.rewardPoints } });
});

router.post("/auth/logout", (req, res) => {
  const sessionId = req.cookies?.likehome_session;
  if (sessionId) sessions.delete(sessionId);
  res.clearCookie("likehome_session");
  return res.json({ authenticated: false, user: null });
});

router.get("/bookings", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  return res.json(bookings.filter((booking) => booking.userId === user.id).map(serializeBooking));
});

router.post("/bookings", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const hotelSlug = queryString(req.body?.hotelSlug);
  const roomId = queryString(req.body?.roomId);
  const checkIn = queryString(req.body?.checkIn);
  const checkOut = queryString(req.body?.checkOut);
  const guests = Number(req.body?.guests);
  const hotel = findHotel(hotelSlug);
  const room = findRoom(hotel, roomId);
  if (!hotel || !room || !validDates(checkIn, checkOut, guests, room.guestCapacity)) return res.status(400).json({ error: "Choose valid dates and a room that fits your guests." });
  if (!roomIsAvailable(hotelSlug, roomId, checkIn, checkOut)) return res.status(400).json({ error: "That room is no longer available for those dates." });
  if (hasUserConflict(user.id, checkIn, checkOut)) return res.status(400).json({ error: "You already have a stay during those dates. Back-to-back stays are okay." });
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = money(room.pricePerNight * nights);
  const useReward = Boolean(req.body?.useReward) && user.rewardPoints >= freeNightPoints;
  const rewardDiscount = useReward ? Math.min(room.pricePerNight, subtotal) : 0;
  if (useReward) user.rewardPoints -= freeNightPoints;
  const booking: BookingRecord = {
    id: `booking-${bookings.length + 1}`,
    confirmationNumber: `LH${String(100000 + bookings.length + 1)}`,
    userId: user.id, hotelSlug, roomId, checkIn, checkOut, guests, nights, subtotal, rewardDiscount,
    total: money(subtotal - rewardDiscount), status: "confirmed", paymentStatus: "paid", cancellationCharge: 0,
    pointsExpected: Math.floor(subtotal - rewardDiscount), createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  if (useReward) rewardTransactions.unshift({ id: `reward-${rewardTransactions.length + 1}`, userId: user.id, type: "redeemed", points: -freeNightPoints, description: "Free-night reward applied", createdAt: new Date().toISOString() });
  return res.status(201).json(serializeBooking(booking));
});

router.get("/bookings/:id", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const booking = bookings.find((candidate) => candidate.id === req.params.id && candidate.userId === user.id);
  if (!booking) return res.status(404).json({ error: "We couldn't find that reservation." });
  return res.json(serializeBooking(booking));
});

router.patch("/bookings/:id", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const booking = bookings.find((candidate) => candidate.id === req.params.id && candidate.userId === user.id);
  if (!booking || booking.status === "cancelled") return res.status(404).json({ error: "We couldn't find an active reservation to change." });
  const hotel = findHotel(booking.hotelSlug);
  const roomId = queryString(req.body?.roomId);
  const room = findRoom(hotel, roomId);
  const checkIn = queryString(req.body?.checkIn);
  const checkOut = queryString(req.body?.checkOut);
  const guests = Number(req.body?.guests);
  if (!room || !validDates(checkIn, checkOut, guests, room.guestCapacity)) return res.status(400).json({ error: "Choose valid dates and a room that fits your guests." });
  if (!roomIsAvailable(booking.hotelSlug, roomId, checkIn, checkOut, booking.id)) return res.status(400).json({ error: "That room is no longer available for those dates." });
  if (hasUserConflict(user.id, checkIn, checkOut, booking.id)) return res.status(400).json({ error: "You already have another stay during those dates." });
  booking.roomId = roomId; booking.checkIn = checkIn; booking.checkOut = checkOut; booking.guests = guests;
  booking.nights = nightsBetween(checkIn, checkOut); booking.subtotal = money(room.pricePerNight * booking.nights);
  booking.total = money(booking.subtotal - booking.rewardDiscount); booking.pointsExpected = Math.floor(booking.total);
  return res.json(serializeBooking(booking));
});

router.post("/bookings/:id/cancel", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const booking = bookings.find((candidate) => candidate.id === req.params.id && candidate.userId === user.id);
  if (!booking || booking.status === "cancelled") return res.status(404).json({ error: "We couldn't find an active reservation to cancel." });
  const hoursUntilCheckIn = (Date.parse(`${booking.checkIn}T12:00:00`) - Date.now()) / 3_600_000;
  if (hoursUntilCheckIn < 0) return res.status(400).json({ error: "This reservation can't be cancelled after check-in." });
  booking.cancellationCharge = hoursUntilCheckIn <= cancellationWindowHours ? money(booking.total * 0.2) : 0;
  booking.status = "cancelled";
  booking.paymentStatus = booking.cancellationCharge ? "partially_refunded" : "refunded";
  return res.json(serializeBooking(booking));
});

router.post("/bookings/:id/complete", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const booking = bookings.find((candidate) => candidate.id === req.params.id && candidate.userId === user.id);
  if (!booking || booking.status === "cancelled") return res.status(400).json({ error: "Only an active reservation can be completed." });
  if (booking.status === "completed") return res.json(serializeBooking(booking));
  booking.status = "completed";
  user.rewardPoints += booking.pointsExpected;
  rewardTransactions.unshift({
    id: `reward-${rewardTransactions.length + 1}`,
    userId: user.id,
    type: "earned",
    points: booking.pointsExpected,
    description: `Points from ${booking.confirmationNumber}`,
    createdAt: new Date().toISOString(),
  });
  return res.json(serializeBooking(booking));
});

router.get("/rewards", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  return res.json({ balance: user.rewardPoints, transactions: rewardTransactions.filter((transaction) => transaction.userId === user.id) });
});

export default router;