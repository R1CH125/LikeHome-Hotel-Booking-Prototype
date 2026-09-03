export type Hotel = {
  id: string;
  slug: string;
  name: string;
  location: string;
  imageUrl: string;
  images: string[];
  rating: number;
  description: string;
  amenities: string[];
  featured: boolean;
  rooms: Room[];
};

export type Room = {
  id: string;
  name: string;
  roomType: string;
  description: string;
  pricePerNight: number;
  guestCapacity: number;
  imageUrl: string;
  inventory: number;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  rewardPoints: number;
};

export type BookingRecord = {
  id: string;
  confirmationNumber: string;
  userId: string;
  hotelSlug: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  subtotal: number;
  rewardDiscount: number;
  total: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "partially_refunded" | "refunded" | "failed";
  cancellationCharge: number;
  pointsExpected: number;
  createdAt: string;
};

export type RewardTransaction = {
  id: string;
  userId: string;
  type: "earned" | "redeemed" | "reversed" | "adjusted";
  points: number;
  description: string;
  createdAt: string;
};

const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;

const room = (
  id: string,
  name: string,
  roomType: string,
  description: string,
  pricePerNight: number,
  guestCapacity: number,
  imageUrl: string,
): Room => ({
  id,
  name,
  roomType,
  description,
  pricePerNight,
  guestCapacity,
  imageUrl,
  inventory: 3,
});

const sharedRooms = (prefix: string, base: number, photo: string): Room[] => [
  room(`${prefix}-classic`, "Classic King", "King", "A bright, restful room with a king bed and a quiet work nook.", base, 2, photo),
  room(`${prefix}-view`, "View Suite", "Suite", "A generous suite with a separate sitting area and a view worth lingering over.", base + 95, 3, photo),
  room(`${prefix}-family`, "Family Loft", "Family", "Two sleeping zones and room to spread out for an easy family stay.", base + 145, 4, photo),
];

export const hotels: Hotel[] = [
  { id: "h1", slug: "sundial-house", name: "Sundial House", location: "Santa Barbara, California", imageUrl: image("photo-1531120364508-b7f85e1f96a0"), images: [image("photo-1531120364508-b7f85e1f96a0"), image("photo-1505691938895-1758d7feb511"), image("photo-1512917774080-9991f1c4c750")], rating: 4.9, description: "A sun-washed hideaway a few steps from the water, made for slow mornings and golden-hour walks.", amenities: ["Ocean view", "Breakfast included", "Pool", "Free Wi-Fi"], featured: true, rooms: sharedRooms("sundial", 248, image("photo-1505691938895-1758d7feb511")) },
  { id: "h2", slug: "copper-pine-lodge", name: "Copper Pine Lodge", location: "Bend, Oregon", imageUrl: image("photo-1510798831971-661eb04b3739"), images: [image("photo-1510798831971-661eb04b3739"), image("photo-1449158743715-0a90ebb6d2d8"), image("photo-1542718610-a1d656d1884c")], rating: 4.8, description: "A cozy mountain basecamp with fireside corners, crisp air, and trails just beyond the door.", amenities: ["Fireplace", "Sauna", "Pet friendly", "Mountain view"], featured: true, rooms: sharedRooms("copper", 189, image("photo-1542718610-a1d656d1884c")) },
  { id: "h3", slug: "the-juniper", name: "The Juniper", location: "Austin, Texas", imageUrl: image("photo-1601918774946-25832a4be0d6"), images: [image("photo-1601918774946-25832a4be0d6"), image("photo-1564501049412-61c2a3083791"), image("photo-1542314831-068cd1dbfeeb")], rating: 4.6, description: "A lively, design-forward stay close to the best of Austin's music, food, and neighborhoods.", amenities: ["Rooftop bar", "Gym", "Restaurant", "Free Wi-Fi"], featured: true, rooms: sharedRooms("juniper", 165, image("photo-1564501049412-61c2a3083791")) },
  { id: "h4", slug: "harborlight-inn", name: "Harborlight Inn", location: "Portland, Maine", imageUrl: image("photo-1506744038136-46273834b3fb"), images: [image("photo-1506744038136-46273834b3fb"), image("photo-1549294413-26f195200c16"), image("photo-1470770841072-f978cf4d019e")], rating: 4.7, description: "An intimate coastal inn with a warm welcome, local breakfasts, and harbor breezes.", amenities: ["Harbor view", "Breakfast included", "Bike rental", "Garden"], featured: false, rooms: sharedRooms("harbor", 174, image("photo-1470770841072-f978cf4d019e")) },
  { id: "h5", slug: "morrow-market-hotel", name: "Morrow Market Hotel", location: "Chicago, Illinois", imageUrl: image("photo-1449158743715-0a90ebb6d2d8"), images: [image("photo-1449158743715-0a90ebb6d2d8"), image("photo-1497366754035-f200968a6e72"), image("photo-1517248135467-4c7edcad34c4")], rating: 4.5, description: "A polished city stay in the middle of everything, with thoughtful rooms and an excellent lobby cafe.", amenities: ["Cafe", "Coworking lounge", "Gym", "Valet parking"], featured: false, rooms: sharedRooms("morrow", 154, image("photo-1497366754035-f200968a6e72")) },
  { id: "h6", slug: "meadow-and-moss", name: "Meadow & Moss", location: "Hudson Valley, New York", imageUrl: image("photo-1470214304380-aadaedcfff1b"), images: [image("photo-1470214304380-aadaedcfff1b"), image("photo-1505691938895-1758d7feb511"), image("photo-1494526585095-c41746248156")], rating: 4.9, description: "A restorative country retreat surrounded by meadows, local produce, and wide-open quiet.", amenities: ["Spa", "Organic breakfast", "Garden", "Fireplace"], featured: true, rooms: sharedRooms("meadow", 276, image("photo-1494526585095-c41746248156")) },
  { id: "h7", slug: "civic-garden-hotel", name: "Civic Garden Hotel", location: "Washington, D.C.", imageUrl: image("photo-1551882547-ff40c63fe5fa"), images: [image("photo-1551882547-ff40c63fe5fa"), image("photo-1501117716987-c8e1ecb2108a"), image("photo-1566073771259-6a8506099945")], rating: 4.4, description: "A calm, leafy home base for museum days, neighborhood dinners, and business trips.", amenities: ["Garden terrace", "Gym", "Restaurant", "Transit nearby"], featured: false, rooms: sharedRooms("civic", 142, image("photo-1501117716987-c8e1ecb2108a")) },
  { id: "h8", slug: "saltline-studios", name: "Saltline Studios", location: "San Diego, California", imageUrl: image("photo-1499793983690-e29da59ef1c2"), images: [image("photo-1499793983690-e29da59ef1c2"), image("photo-1507525428034-b723cf961d3e"), image("photo-1540541338287-41700207dee6")], rating: 4.6, description: "Easygoing studio rooms by the beach, with space to make the coast your own.", amenities: ["Beach access", "Kitchenette", "Bikes included", "Pool"], featured: false, rooms: sharedRooms("saltline", 218, image("photo-1540541338287-41700207dee6")) },
  { id: "h9", slug: "northstar-yards", name: "Northstar Yards", location: "Nashville, Tennessee", imageUrl: image("photo-1517457373958-b7bdd4587205"), images: [image("photo-1517457373958-b7bdd4587205"), image("photo-1497366811353-6870744d04b2"), image("photo-1566073771259-6a8506099945")], rating: 4.3, description: "A social stay for curious travelers, with live music, communal tables, and a great local guide.", amenities: ["Live music", "Bar", "Shared kitchen", "Free Wi-Fi"], featured: false, rooms: sharedRooms("northstar", 126, image("photo-1497366811353-6870744d04b2")) },
  { id: "h10", slug: "alpine-echo", name: "Alpine Echo", location: "Park City, Utah", imageUrl: image("photo-1510798831971-661eb04b3739"), images: [image("photo-1510798831971-661eb04b3739"), image("photo-1486911278844-a81c5267e227"), image("photo-1520250497591-112f2f40a3f4")], rating: 4.8, description: "A mountain lodge with warm timber interiors and the slopes within easy reach.", amenities: ["Ski storage", "Hot tub", "Fireplace", "Shuttle"], featured: true, rooms: sharedRooms("alpine", 242, image("photo-1520250497591-112f2f40a3f4")) },
  { id: "h11", slug: "casa-luna", name: "Casa Luna", location: "Santa Fe, New Mexico", imageUrl: image("photo-1500530855697-b586d89ba3ee"), images: [image("photo-1500530855697-b586d89ba3ee"), image("photo-1542314831-068cd1dbfeeb"), image("photo-1520250497591-112f2f40a3f4")], rating: 4.7, description: "An adobe-inspired escape filled with handmade details, desert light, and a slower pace.", amenities: ["Courtyard", "Art gallery", "Breakfast included", "Pool"], featured: false, rooms: sharedRooms("luna", 198, image("photo-1542314831-068cd1dbfeeb")) },
  { id: "h12", slug: "the-lark", name: "The Lark", location: "Charleston, South Carolina", imageUrl: image("photo-1520250497591-112f2f40a3f4"), images: [image("photo-1520250497591-112f2f40a3f4"), image("photo-1564501049412-61c2a3083791"), image("photo-1505691938895-1758d7feb511")], rating: 4.5, description: "A gracious historic stay where porch mornings lead naturally into long city walks.", amenities: ["Historic building", "Porch", "Breakfast included", "Bikes included"], featured: false, rooms: sharedRooms("lark", 181, image("photo-1564501049412-61c2a3083791")) },
];

export const users: User[] = [];
export const sessions = new Map<string, string>();
export const bookings: BookingRecord[] = [];
export const rewardTransactions: RewardTransaction[] = [];

export const findHotel = (slug: string) => hotels.find((hotel) => hotel.slug === slug);
export const findRoom = (hotel: Hotel | undefined, roomId: string) => hotel?.rooms.find((room) => room.id === roomId);