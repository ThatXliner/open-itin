import type { JsonItinerary } from '../../agent-format/src/types.js';

export const pchExample: JsonItinerary = {
  $schema: 'https://raw.githubusercontent.com/ThatXliner/open-itin/main/open-itin.schema.json',
  version: '0.2',
  name: 'SF to LA Road Trip',
  summary: 'A 3-day coastal road trip from San Francisco to Los Angeles via Highway 1.',
  tags: ['road-trip', 'coastal', 'california'],
  tz: 'America/Los_Angeles',
  cur: 'USD',
  stops: [
    { id: 'sf', name: 'San Francisco', goal: 'Start the trip — fuel up and hit the coast', cat: 'other', addr: 'San Francisco, CA 94102' },
    { id: 'monterey', name: 'Monterey Bay Aquarium', goal: 'See the sea otters and kelp forest', cat: 'attraction', addr: '886 Cannery Row, Monterey, CA 93940', dur: { min: 1.5, max: 2.5 }, cost: { amt: 65 }, alts: [{ name: 'Monterey State Beach', goal: 'Free alternative — walk the beach instead', cat: 'nature' }] },
    { id: 'half-moon-bay', name: 'Half Moon Bay State Beach', goal: 'Walk the beach and decompress — first coastal stop', cat: 'nature', addr: 'Half Moon Bay, CA 94019', dur: { min: 0.5, max: 1.5 } },
    { id: 'santa-cruz', name: 'Santa Cruz Boardwalk', goal: 'Stretch, grab a snack, catch the sunset over the boardwalk', cat: 'attraction', addr: '400 Beach St, Santa Cruz, CA 95060', dur: { min: 1, max: 2 } },
    { id: 'big-sur-inn', name: 'Big Sur River Inn', goal: 'Overnight stay — creekside rooms in the heart of Big Sur', cat: 'accommodation', addr: '46800 CA-1, Big Sur, CA 93920', cost: { amt: 280 } },
    { id: 'bixby-bridge', name: 'Bixby Creek Bridge', goal: 'The iconic Big Sur viewpoint — pull over, full stop', cat: 'viewpoint', addr: 'Bixby Creek Bridge, CA-1, Big Sur, CA 93920', dur: { min: 0.25, max: 0.5 } },
    { id: 'hearst-castle', name: 'Hearst Castle', goal: 'Tour the most absurd private home in American history', cat: 'attraction', addr: '750 Hearst Castle Rd, San Simeon, CA 93452', dur: { min: 2, max: 4 }, cost: { amt: 30 } },
    { id: 'santa-barbara', name: 'Santa Barbara Inn', goal: 'Overnight stay with ocean views', cat: 'accommodation', addr: '901 E Cabrillo Blvd, Santa Barbara, CA 93103', cost: { amt: 350 } },
    { id: 'santa-monica', name: 'Santa Monica Pier', goal: 'End of the road — touch the Route 66 sign, get the photo', cat: 'attraction', addr: '200 Santa Monica Pier, Santa Monica, CA 90401', dur: { min: 0.5, max: 2 } }
  ],
  routes: [
    { id: 'sf-to-halfmoon', from: 'sf', to: 'half-moon-bay', mode: 'drive', dur: { min: 0.5, max: 0.75 }, dist: 45 },
    { id: 'halfmoon-to-santacruz', from: 'half-moon-bay', to: 'santa-cruz', mode: 'drive', dur: { min: 0.75, max: 1.25 }, dist: 75 },
    { id: 'santacruz-to-bigsur', from: 'santa-cruz', to: 'big-sur-inn', mode: 'drive', dur: { min: 1.25, max: 2 }, dist: 110 },
    { id: 'bigsur-to-hearst', from: 'big-sur-inn', to: 'hearst-castle', mode: 'drive', dur: { min: 1.5, max: 2.5 }, dist: 100 },
    { id: 'hearst-to-sb', from: 'hearst-castle', to: 'santa-barbara', mode: 'drive', dur: { min: 2, max: 3 }, dist: 170 },
    { id: 'sb-to-sm', from: 'santa-barbara', to: 'santa-monica', mode: 'drive', dur: { min: 1.5, max: 3 }, dist: 150 }
  ],
  days: [
    { date: '2026-06-15', note: 'SF to Big Sur', items: [
      { type: 'stop', ref: 'sf' }, { type: 'route', ref: 'sf-to-halfmoon' }, { type: 'stop', ref: 'half-moon-bay' },
      { type: 'route', ref: 'halfmoon-to-santacruz' }, { type: 'stop', ref: 'santa-cruz' },
      { type: 'route', ref: 'santacruz-to-bigsur' }, { type: 'stop', ref: 'big-sur-inn' }
    ]},
    { date: '2026-06-16', note: 'Big Sur to Santa Barbara', items: [
      { type: 'stop', ref: 'bixby-bridge' }, { type: 'route', ref: 'bigsur-to-hearst' }, { type: 'stop', ref: 'hearst-castle' },
      { type: 'route', ref: 'hearst-to-sb' }, { type: 'stop', ref: 'santa-barbara' },
      { type: 'flex', pick: 1, opts: [{ type: 'note', txt: 'Wine tasting in the Funk Zone' }, { type: 'note', txt: 'Walk State Street for shopping' }] }
    ]},
    { date: '2026-06-17', note: 'Santa Barbara to LA', items: [
      { type: 'route', ref: 'sb-to-sm' }, { type: 'stop', ref: 'santa-monica' }
    ]}
  ],
  generated_by: 'claude-sonnet-4',
  created_at: '2026-05-11T10:00:00Z'
};

export const tokyoExample: JsonItinerary = {
  $schema: 'https://raw.githubusercontent.com/ThatXliner/open-itin/main/open-itin.schema.json',
  version: '0.2',
  name: 'Tokyo Weekend',
  summary: 'A 2-day sprint through Tokyo — Shibuya, Shinjuku, Asakusa, and Akihabara.',
  tags: ['city-break', 'tokyo', 'japan', 'food'],
  tz: 'Asia/Tokyo',
  cur: 'JPY',
  stops: [
    { id: 'hotel-shibuya', name: 'Shibuya Excel Hotel Tokyu', goal: 'Overnight — connected to Shibuya Station', cat: 'accommodation', addr: '1-12-2 Dogenzaka, Shibuya City, Tokyo 150-0043', cost: { amt: 25000 } },
    { id: 'shibuya-crossing', name: 'Shibuya Scramble Crossing', goal: 'Stand at the world\'s busiest pedestrian crossing', cat: 'viewpoint', addr: 'Shibuya City, Tokyo 150-0043', dur: { min: 0.25, max: 0.5 } },
    { id: 'meiji-jingu', name: 'Meiji Jingu', goal: 'Walk through massive torii gates into a forest in the middle of Tokyo', cat: 'attraction', addr: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557', dur: { min: 1, max: 2 } },
    { id: 'harajuku', name: 'Takeshita Street (Harajuku)', goal: 'Crepes, vintage shops, and peak Tokyo people-watching', cat: 'shopping', addr: '1-chome Jingumae, Shibuya City, Tokyo 150-0001', dur: { min: 1, max: 2 } },
    { id: 'shinjuku-gyoen', name: 'Shinjuku Gyoen National Garden', goal: 'Escape the concrete — three gardens in one park', cat: 'nature', addr: '11 Naitomachi, Shinjuku City, Tokyo 160-0014', dur: { min: 1, max: 2 }, cost: { amt: 500 } },
    { id: 'omoide-yokocho', name: 'Omoide Yokocho (Piss Alley)', goal: 'Dinner in a post-war alleyway of yakitori stalls', cat: 'food', addr: '1-2 Nishishinjuku, Shinjuku City, Tokyo 160-0023', dur: { min: 1.5, max: 3 } },
    { id: 'golden-gai', name: 'Golden Gai', goal: 'Bar hop through 200+ micro-bars in six narrow alleys', cat: 'drink', addr: '1-1-6 Kabukicho, Shinjuku City, Tokyo 160-0021' },
    { id: 'senso-ji', name: 'Sensō-ji', goal: 'Tokyo\'s oldest temple — get there before the crowds', cat: 'attraction', addr: '2-3-1 Asakusa, Taito City, Tokyo 111-0032', dur: { min: 0.75, max: 1.5 } },
    { id: 'akihabara', name: 'Akihabara Electric Town', goal: 'Retro games, arcades, anime — Tokyo\'s tech district', cat: 'attraction', addr: '1-chome Sotokanda, Chiyoda City, Tokyo 101-0021', dur: { min: 2, max: 4 } }
  ],
  routes: [
    { id: 'shibuya-to-meiji', from: 'hotel-shibuya', to: 'meiji-jingu', mode: 'walk', dur: { min: 0.25, max: 0.5 } },
    { id: 'meiji-to-harajuku', from: 'meiji-jingu', to: 'harajuku', mode: 'walk', dur: { min: 0.1, max: 0.25 } },
    { id: 'harajuku-to-shinjuku', from: 'harajuku', to: 'shinjuku-gyoen', mode: 'transit', dur: { min: 0.25, max: 0.5 } },
    { id: 'gyoen-to-omoide', from: 'shinjuku-gyoen', to: 'omoide-yokocho', mode: 'walk', dur: { min: 0.15, max: 0.3 } },
    { id: 'shibuya-to-asakusa', from: 'hotel-shibuya', to: 'senso-ji', mode: 'transit', dur: { min: 0.5, max: 0.75 } },
    { id: 'asakusa-to-akihabara', from: 'senso-ji', to: 'akihabara', mode: 'transit', dur: { min: 0.2, max: 0.4 } }
  ],
  days: [
    { date: '2026-06-13', note: 'West Tokyo — Shibuya, Harajuku, Shinjuku', items: [
      { type: 'note', txt: 'Grab breakfast at a konbini — onigiri + Boss coffee' },
      { type: 'stop', ref: 'shibuya-crossing' }, { type: 'route', ref: 'shibuya-to-meiji' },
      { type: 'stop', ref: 'meiji-jingu' }, { type: 'route', ref: 'meiji-to-harajuku' },
      { type: 'stop', ref: 'harajuku' }, { type: 'route', ref: 'harajuku-to-shinjuku' },
      { type: 'stop', ref: 'shinjuku-gyoen' }, { type: 'route', ref: 'gyoen-to-omoide' },
      { type: 'stop', ref: 'omoide-yokocho' },
      { type: 'flex', pick: 1, opts: [{ type: 'note', txt: 'Karaoke in Shinjuku — try Kan Kan' }, { type: 'stop', ref: 'golden-gai' }] }
    ]},
    { date: '2026-06-14', note: 'East Tokyo — Asakusa, Akihabara', items: [
      { type: 'route', ref: 'shibuya-to-asakusa' }, { type: 'stop', ref: 'senso-ji' },
      { type: 'route', ref: 'asakusa-to-akihabara' }, { type: 'stop', ref: 'akihabara' }
    ]}
  ],
  generated_by: 'claude-sonnet-4',
  created_at: '2026-05-11T10:00:00Z'
};

export const examples: Record<string, JsonItinerary> = {
  pch: pchExample,
  tokyo: tokyoExample
};
