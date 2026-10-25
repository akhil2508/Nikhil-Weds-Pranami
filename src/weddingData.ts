/**
 * Wedding events and calendar data for Nikhil & Pranami's Wedding
 */

export interface WeddingEvent {
  id: string;
  title: string;
  hasDate: boolean;
  date: string;
  time: string;
  venue: string;
  description: string;
  image: string;
  align: 'left' | 'right';
}

export const WEDDING_EVENTS: WeddingEvent[] = [
  {
    id: 'welcome',
    title: 'Warm Welcome',
    hasDate: false,
    date: '',
    time: '',
    venue: 'Royal Anand Resort & Club, Kanpur',
    description:
      'With the blessings of our elders and the grace of the Almighty, we invite you to celebrate the union of Nikhil & Pranami. Join us as two souls, two families, and countless memories come together in a sacred celebration of love, laughter, and timeless traditions.',
    image: '/images/warm-welcome.jpg',
    align: 'left',
  },
  {
    id: 'haldi',
    title: 'Haldi',
    hasDate: true,
    date: 'Dec 09, 2026',
    time: '5:00 PM onwards',
    venue: '335/2 Shastri Nagar, Kanpur',
    description:
      'A splash of sunshine, fragrant turmeric paste, and joyful music as we bathe the bride and groom in love, blessings, and bright yellow vibes.',
    image: '/images/haldi.jpg',
    align: 'right',
  },
  {
    id: 'mehndi',
    title: 'Mehndi',
    hasDate: true,
    date: 'Dec 10, 2026',
    time: '5:00 PM onwards',
    venue: '335/2 Shastri Nagar, Kanpur',
    description:
      'Henna whispers heartfelt love stories on delicate palms. Join the rhythmic dholak beats, festive folk dance, and celebratory twilight hues.',
    image: '/images/mehndi.jpg',
    align: 'left',
  },
  {
    id: 'tilak',
    title: 'Tilak Ceremony',
    hasDate: true,
    date: 'Dec 11, 2026',
    time: '5:00 PM onwards',
    venue: 'Royal Anand Resort & Club, Kanpur',
    description:
      'The sacred auspicious start, holy Vedic chants, vermilion tilak, and honored traditions welcoming the groom and sealing eternal family bonds.',
    image: '/images/tilak.jpg',
    align: 'right',
  },
  {
    id: 'shaadi',
    title: 'Shaadi',
    hasDate: true,
    date: 'Dec 11, 2026',
    time: '7:00 PM onwards',
    venue: 'Royal Anand Resort & Club, Kanpur',
    description:
      'The Seven Sacred Vows around the holy Agni under starlit skies. As Nikhil and Pranami promise a lifetime of companionship, grace us with your warm presence.',
    image: '/images/shaadi.jpg',
    align: 'left',
  },
  {
    id: 'vidai',
    title: 'Vidai',
    hasDate: true,
    date: 'Dec 12, 2026',
    time: '7:00 AM',
    venue: 'Royal Anand Resort & Club, Kanpur',
    description:
      'A bittersweet dawn filled with emotional smiles, tender embraces, and heartfelt blessings as our beloved Pranami embarks on her new forever journey.',
    image: '/images/vidai.jpg',
    align: 'right',
  },
];

/**
 * Creates Google Calendar URL for the wedding
 */
export function getGoogleCalendarUrl(): string {
  const title = encodeURIComponent('Nikhil & Pranami Wedding Celebration');
  // Dec 11, 2026, 5:00 PM IST (11:30 UTC) to Dec 12, 2026, 8:00 AM IST (02:30 UTC)
  const dates = '20261211T113000Z/20261212T023000Z';
  const details = encodeURIComponent(
    'You are cordially invited to celebrate the grand wedding of Nikhil and Pranami at Royal Anand Resort & Club, Kanpur.\n\nKey Events:\n- Tilak: Dec 11, 5:00 PM\n- Shaadi: Dec 11, 7:00 PM\n- Vidai: Dec 12, 7:00 AM\n\nFor venue navigation or assistance, contact Akhil Shukla at +91 9919892622.'
  );
  const location = encodeURIComponent('Royal Anand Resort & Club, Kanpur, Uttar Pradesh');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

/**
 * Generates and downloads .ics file for Apple Calendar, Outlook, and native mobile calendars
 */
export function downloadIcsFile(): void {
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nikhil & Pranami//Wedding Celebration//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:nikhil-pranami-wedding-2026@celebration',
    'DTSTAMP:20261025T000000Z',
    'DTSTART:20261211T113000Z',
    'DTEND:20261212T023000Z',
    'SUMMARY:Nikhil & Pranami Wedding Celebration',
    'DESCRIPTION:You are cordially invited to celebrate the grand wedding of Nikhil and Pranami at Royal Anand Resort & Club, Kanpur. For navigation or questions, contact Akhil Shukla: +91 9919892622.',
    'LOCATION:Royal Anand Resort & Club, Kanpur, Uttar Pradesh',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Nikhil & Pranami Wedding Tomorrow!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', 'Nikhil_and_Pranami_Wedding.ics');
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
