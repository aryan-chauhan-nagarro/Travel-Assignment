import { Injectable } from '@angular/core';
import { Destination, Hotel, Room, PropertyType, BookedDateRange, RoomReview } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SeedService {
  private inMemoryRooms: Room[] | null = null;
  private readonly CACHE_DESTINATIONS = 'travel_cached_destinations_v2';
  private readonly CACHE_HOTELS = 'travel_cached_hotels_v2';

  // 8 World Destinations
  readonly defaultDestinations: Destination[] = [
    {
      id: 'dest-tokyo',
      name: 'Tokyo',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=70',
      propertyCount: 240,
      distanceText: '105 miles away',
      description: 'A vibrant metropolis blending ultramodern skyscrapers with historic temples and world-class culinary traditions.',
      visible: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'dest-paris',
      name: 'Paris',
      country: 'France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=70',
      propertyCount: 185,
      distanceText: '3,620 miles away',
      description: 'The City of Light, famed for haute couture, neoclassical architecture, the Eiffel Tower, and romantic street cafes.',
      visible: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'dest-newyork',
      name: 'New York',
      country: 'United States',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format&fit=crop&q=70',
      propertyCount: 310,
      distanceText: '2,450 miles away',
      description: 'An iconic metropolis with bustling avenues, Central Park, Broadway theaters, and world-renowned skyline views.',
      visible: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'dest-maldives',
      name: 'Maldives',
      country: 'Maldives',
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&auto=format&fit=crop&q=70',
      propertyCount: 120,
      distanceText: '8,200 miles away',
      description: 'Crystal-clear turquoise waters, overwater villas, untouched coral reefs, and tranquil tropical island luxury.',
      visible: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'dest-amsterdam',
      name: 'Amsterdam',
      country: 'Netherlands',
      image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&auto=format&fit=crop&q=70',
      propertyCount: 145,
      distanceText: '3,800 miles away',
      description: 'Charming canal networks, artistic heritage, historic gabled houses, and relaxed cycling culture.',
      visible: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'dest-bali',
      name: 'Bali',
      country: 'Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=70',
      propertyCount: 220,
      distanceText: '9,100 miles away',
      description: 'Lush terraced rice paddies, serene beaches, ancient spiritual temples, and soothing yoga retreats.',
      visible: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'dest-london',
      name: 'London',
      country: 'United Kingdom',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=70',
      propertyCount: 280,
      distanceText: '3,450 miles away',
      description: 'A cosmopolitan capital steeped in royalty, historic landmarks, West End theater, and picturesque royal parks.',
      visible: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'dest-rome',
      name: 'Rome',
      country: 'Italy',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=70',
      propertyCount: 175,
      distanceText: '4,100 miles away',
      description: 'The Eternal City with thousands of years of ancient Roman ruins, the Colosseum, Vatican treasures, and exquisite cuisine.',
      visible: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  // 32 Hotels
  readonly defaultHotels: Hotel[] = [
    {
      id: 'hotel-tokyo-1',
      destinationId: 'dest-tokyo',
      name: 'Park Hyatt Shinjuku',
      address: '3-7-1-2 Nishi-Shinjuku, Shinjuku City, Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=70',
      rating: 4.88,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Elevated luxury hotel with panoramic views of Mount Fuji and Tokyo skyline.',
    },
    {
      id: 'hotel-tokyo-2',
      destinationId: 'dest-tokyo',
      name: 'Solitude Pointe Ryokan',
      address: '2-14-5 Ueno, Taito City, Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop&q=70',
      rating: 4.86,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '10AM',
      description: 'Traditional Japanese ryokan with cedar onsen baths and authentic kaiseki dining.',
    },
    {
      id: 'hotel-tokyo-3',
      destinationId: 'dest-tokyo',
      name: 'Rainbow Plantation Ginza',
      address: '6-10-1 Ginza, Chuo City, Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=70',
      rating: 4.77,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Modern boutique hotel situated just steps away from high-end fashion boutiques.',
    },
    {
      id: 'hotel-tokyo-4',
      destinationId: 'dest-tokyo',
      name: 'Harley Connection Shibuya',
      address: '1-12 Shibuya, Shibuya City, Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=70',
      rating: 4.84,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Stylish urban loft hotel designed for modern digital travelers by Shibuya crossing.',
    },
    // Paris Hotels
    {
      id: 'hotel-paris-1',
      destinationId: 'dest-paris',
      name: 'Le Grand Marais Suite',
      address: '18 Rue de Turenne, 75004 Paris, France',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&auto=format&fit=crop&q=70',
      rating: 4.82,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Charming 18th-century Parisian residence featuring classic Haussmann balconies.',
    },
    {
      id: 'hotel-paris-2',
      destinationId: 'dest-paris',
      name: 'Saint-Germain Renaissance',
      address: '29 Boulevard Saint-Germain, 75005 Paris, France',
      image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&auto=format&fit=crop&q=70',
      rating: 4.79,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '12PM',
      description: 'Sophisticated literary hotel near the Sorbonne with quiet reading salons.',
    },
    {
      id: 'hotel-paris-3',
      destinationId: 'dest-paris',
      name: 'Montmartre Vista Hotel',
      address: '12 Rue des Abbesses, 75018 Paris, France',
      image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&auto=format&fit=crop&q=70',
      rating: 4.75,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Bohemian hotel nestled on the slopes of Montmartre with vistas of Sacré-Cœur.',
    },
    {
      id: 'hotel-paris-4',
      destinationId: 'dest-paris',
      name: 'Eiffel Lumière Luxury Inn',
      address: '5 Avenue Anatole France, 75007 Paris, France',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=70',
      rating: 4.91,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '11AM',
      description: 'Premier riverfront hotel offering private balcony views of the Eiffel Tower.',
    },
    // New York Hotels
    {
      id: 'hotel-ny-1',
      destinationId: 'dest-newyork',
      name: 'The Manhattanite Soho',
      address: '138 Spring Street, New York, NY 10012, USA',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=70',
      rating: 4.85,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '11AM',
      description: 'Cast-iron architecture meets chic minimalist lofts in Soho.',
    },
    {
      id: 'hotel-ny-2',
      destinationId: 'dest-newyork',
      name: 'Central Park Horizon',
      address: '160 Central Park South, New York, NY 10019, USA',
      image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&auto=format&fit=crop&q=70',
      rating: 4.92,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '12PM',
      description: 'Prestigious tower overlooking Central Park foliage.',
    },
    {
      id: 'hotel-ny-3',
      destinationId: 'dest-newyork',
      name: 'Brooklyn Bridge Haven',
      address: '60 Furman Street, Brooklyn, NY 11201, USA',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format&fit=crop&q=70',
      rating: 4.80,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '11AM',
      description: 'Eco-conscious waterfront sanctuary with sweeping vistas of Lower Manhattan.',
    },
    {
      id: 'hotel-ny-4',
      destinationId: 'dest-newyork',
      name: 'Tribeca Grand Lofts',
      address: '85 Franklin Street, New York, NY 10013, USA',
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&auto=format&fit=crop&q=70',
      rating: 4.78,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '11AM',
      description: 'Spacious industrial lofts with exposed brick and high ceilings.',
    },
    // Maldives Hotels
    {
      id: 'hotel-maldives-1',
      destinationId: 'dest-maldives',
      name: 'Azure Lagoon Overwater Resort',
      address: 'North Malé Atoll, Republic of Maldives',
      image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600&auto=format&fit=crop&q=70',
      rating: 4.96,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '12PM',
      description: 'Overwater bungalows with glass floor panels and direct ocean access.',
    },
    {
      id: 'hotel-maldives-2',
      destinationId: 'dest-maldives',
      name: 'Coral Reef Sanctuary',
      address: 'Baa Atoll UNESCO Biosphere, Maldives',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=70',
      rating: 4.93,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Secluded marine paradise where manta rays swim beneath your sundeck.',
    },
    {
      id: 'hotel-maldives-3',
      destinationId: 'dest-maldives',
      name: 'Velassaru Turquoise Palms',
      address: 'South Malé Atoll, Maldives',
      image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&auto=format&fit=crop&q=70',
      rating: 4.89,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'White sandy beaches fringed with coconut palms.',
    },
    {
      id: 'hotel-maldives-4',
      destinationId: 'dest-maldives',
      name: 'Sunset Atoll Villas',
      address: 'Dhaalu Atoll, Maldives',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=70',
      rating: 4.87,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '11AM',
      description: 'Private island sanctuary with holistic wellness spas.',
    },
    // Amsterdam Hotels
    {
      id: 'hotel-ams-1',
      destinationId: 'dest-amsterdam',
      name: 'Prinsengracht Heritage House',
      address: 'Prinsengracht 263, 1016 GV Amsterdam, Netherlands',
      image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&auto=format&fit=crop&q=70',
      rating: 4.81,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Restored 17th-century canal house with historic canal views.',
    },
    {
      id: 'hotel-ams-2',
      destinationId: 'dest-amsterdam',
      name: 'The Jordaan Boutique Hotel',
      address: 'Westerstraat 48, 1015 ML Amsterdam, Netherlands',
      image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&auto=format&fit=crop&q=70',
      rating: 4.79,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '11AM',
      description: 'Cozy boutique hotel located among artisan cheese shops and courtyards.',
    },
    {
      id: 'hotel-ams-3',
      destinationId: 'dest-amsterdam',
      name: 'Museum Quarter Grand',
      address: 'Van Baerlestraat 27, 1071 AN Amsterdam, Netherlands',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=70',
      rating: 4.86,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '12PM',
      description: 'Architectural gem right opposite the Rijksmuseum.',
    },
    {
      id: 'hotel-ams-4',
      destinationId: 'dest-amsterdam',
      name: 'De Pijp Modern Studios',
      address: 'Gerard Doustraat 112, 1072 VX Amsterdam, Netherlands',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=70',
      rating: 4.74,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Trendy loft studios surrounded by international street food markets.',
    },
    // Bali Hotels
    {
      id: 'hotel-bali-1',
      destinationId: 'dest-bali',
      name: 'Ubud Rice Terrace Eco-Villa',
      address: 'Jalan Raya Tegallalang, Gianyar, Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&auto=format&fit=crop&q=70',
      rating: 4.92,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Bamboo architect-designed sanctuary overlooking emerald rice terraces.',
    },
    {
      id: 'hotel-bali-2',
      destinationId: 'dest-bali',
      name: 'Seminyak Beachfront Haven',
      address: 'Jalan Petitenget No. 51B, Seminyak, Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop&q=70',
      rating: 4.83,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '12PM',
      description: 'Vibrant tropical resort with direct golden sand beach access.',
    },
    {
      id: 'hotel-bali-3',
      destinationId: 'dest-bali',
      name: 'Uluwatu Cliffside Retreat',
      address: 'Jalan Labuan Sait, Pecatu, Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=70',
      rating: 4.95,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Dramatic limestone cliff villas with panoramic Indian Ocean views.',
    },
    {
      id: 'hotel-bali-4',
      destinationId: 'dest-bali',
      name: 'Canggu Bohemian Surf Lofts',
      address: 'Jalan Pantai Batu Bolong, Canggu, Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&auto=format&fit=crop&q=70',
      rating: 4.76,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Relaxed surf-inspired lofts with co-working hubs.',
    },
    // London Hotels
    {
      id: 'hotel-london-1',
      destinationId: 'dest-london',
      name: 'The Kensington Court Hotel',
      address: '35 Queens Gate Gardens, Kensington, London SW7 5RR, UK',
      image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&auto=format&fit=crop&q=70',
      rating: 4.84,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Victorian townhouse elegance within walking distance of Hyde Park.',
    },
    {
      id: 'hotel-london-2',
      destinationId: 'dest-london',
      name: 'Covent Garden Theater Lofts',
      address: '14 Floral Street, Covent Garden, London WC2E 9DH, UK',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=70',
      rating: 4.81,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '11AM',
      description: 'Contemporary design lofts situated inside the West End theater district.',
    },
    {
      id: 'hotel-london-3',
      destinationId: 'dest-london',
      name: 'Tower Bridge Riverside Suites',
      address: '47 Bermondsey Street, London SE1 3XF, UK',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=70',
      rating: 4.79,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Modern luxury apartments overlooking the River Thames.',
    },
    {
      id: 'hotel-london-4',
      destinationId: 'dest-london',
      name: 'Mayfair Heritage Residence',
      address: '12 Mount Street, Mayfair, London W1K 2RH, UK',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=70',
      rating: 4.90,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '12PM',
      description: 'Five-star Georgian residence featuring bespoke concierge services.',
    },
    // Rome Hotels
    {
      id: 'hotel-rome-1',
      destinationId: 'dest-rome',
      name: 'Trastevere Piazza Suites',
      address: 'Piazza di Santa Maria in Trastevere, 00153 Rome, Italy',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&auto=format&fit=crop&q=70',
      rating: 4.83,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '10:30AM',
      description: 'Atmospheric palazzo apartments surrounded by ivy-draped trattorias.',
    },
    {
      id: 'hotel-rome-2',
      destinationId: 'dest-rome',
      name: 'Pantheon Historic Palazzo',
      address: 'Via della Rotonda 14, 00186 Rome, Italy',
      image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&auto=format&fit=crop&q=70',
      rating: 4.88,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '11AM',
      description: 'Step directly outside your door to behold the Pantheon.',
    },
    {
      id: 'hotel-rome-3',
      destinationId: 'dest-rome',
      name: 'Colosseum View Residencies',
      address: 'Via dei Fori Imperiali 8, 00184 Rome, Italy',
      image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&auto=format&fit=crop&q=70',
      rating: 4.91,
      visible: true,
      checkInTime: 'after 2PM',
      checkOutTime: '11AM',
      description: 'Rooftop terrace views overlooking the Colosseum arches.',
    },
    {
      id: 'hotel-rome-4',
      destinationId: 'dest-rome',
      name: 'Spanish Steps Luxury Grand',
      address: 'Via dei Condotti 24, 00187 Rome, Italy',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=70',
      rating: 4.85,
      visible: true,
      checkInTime: 'after 3PM',
      checkOutTime: '11AM',
      description: 'Sophisticated Roman townhouse at the foot of the Spanish Steps.',
    },
  ];

  /**
   * Generates ~1,000 rooms lazily in-memory on demand without blocking initial app startup
   */
  generateRooms(): Room[] {
    if (this.inMemoryRooms) {
      return this.inMemoryRooms;
    }

    const propertyTypes: PropertyType[] = ['Hotel', 'Apartment', 'House', 'Guesthouse'];
    const titleAdjectives = [
      'Superior Family', 'Deluxe Panoramic', 'Executive Penthouse', 'Cozy Sunlit',
      'Artisan Heritage', 'Minimalist Zen', 'Grand Royal', 'Quiet Boutique',
      'Sunny Garden', 'Scenic Waterfront', 'Modern Loft', 'Skyline Luxury'
    ];
    const titleNouns = ['Room', 'Suite', 'Apartment', 'Studio', 'Villa', 'Loft', 'Residence'];

    const roomImagePool = [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=700&auto=format&fit=crop&q=75',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&auto=format&fit=crop&q=75',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=700&auto=format&fit=crop&q=75',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=700&auto=format&fit=crop&q=75',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=700&auto=format&fit=crop&q=75',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=700&auto=format&fit=crop&q=75',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=700&auto=format&fit=crop&q=75',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=700&auto=format&fit=crop&q=75',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=700&auto=format&fit=crop&q=75',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=700&auto=format&fit=crop&q=75',
    ];

    const amenityList = [
      'Kitchen', 'Wifi', 'Air conditioning', 'Washer', 'Free parking',
      'TV', 'Dedicated workspace', 'Pool', 'Hot tub', 'Gym', 'Balcony'
    ];

    const sampleReviews: RoomReview[] = [
      {
        author: 'Selena Kye',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=70',
        date: 'March 2026',
        rating: 5,
        text: 'Absolute perfection. Sparkling clean, exceptionally comfortable, and wonderful host recommendations!',
      },
      {
        author: 'Jerry Holland',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=70',
        date: 'February 2026',
        rating: 5,
        text: 'A true 5-star experience in the heart of the city. Waking up to these views was unforgettable.',
      },
    ];

    const rooms: Room[] = [];
    let roomCounter = 1;

    for (const hotel of this.defaultHotels) {
      const dest = this.defaultDestinations.find((d) => d.id === hotel.destinationId);
      const destName = dest ? `${dest.name}, ${dest.country}` : 'Destination';

      for (let i = 1; i <= 32; i++) {
        const id = `room-${roomCounter}`;
        const pType = propertyTypes[(roomCounter + i) % propertyTypes.length];
        const adj = titleAdjectives[(roomCounter + i) % titleAdjectives.length];
        const noun = titleNouns[(roomCounter + i * 2) % titleNouns.length];

        const imgStart = (roomCounter + i) % roomImagePool.length;
        const images: string[] = [];
        for (let j = 0; j < 4; j++) {
          images.push(roomImagePool[(imgStart + j) % roomImagePool.length]);
        }

        const bedrooms = (i % 4) + 1;
        const beds = bedrooms * 2;
        const bathrooms = Math.max(1, Math.floor(bedrooms / 1.5));
        const maxGuests = Math.min(16, beds * 2);

        let pricePerNight: number;
        if (i % 3 === 0) pricePerNight = 45 + ((roomCounter * 7) % 45);
        else if (i % 3 === 1) pricePerNight = 95 + ((roomCounter * 11) % 100);
        else pricePerNight = 205 + ((roomCounter * 13) % 250);

        const bookedRanges: BookedDateRange[] = [];
        if (i % 2 === 0) bookedRanges.push({ start: '2026-12-20', end: '2026-12-28' });

        rooms.push({
          id,
          hotelId: hotel.id,
          destinationId: hotel.destinationId,
          title: `${adj} ${noun}`,
          propertyType: pType,
          images,
          maxGuests,
          beds,
          bedrooms,
          bathrooms,
          pricePerNight,
          amenities: amenityList.slice(0, 6 + (i % 5)),
          rating: 4.7 + (((roomCounter * 7) % 28) / 100),
          reviewCount: 50 + ((roomCounter * 13) % 350),
          freeCancellationHours: 48,
          description: `Enjoy exceptional comfort, spacious living, high-speed WiFi, and effortless access to ${destName}’s finest attractions.`,
          reviews: sampleReviews,
          bookedRanges,
          hotelName: hotel.name,
          destinationName: destName,
          address: hotel.address,
        });

        roomCounter++;
      }
    }

    this.inMemoryRooms = rooms;
    return rooms;
  }

  async seedIfEmpty(): Promise<{ destinations: Destination[]; hotels: Hotel[]; rooms: Room[] }> {
    return {
      destinations: this.defaultDestinations,
      hotels: this.defaultHotels,
      rooms: this.generateRooms(),
    };
  }
}
