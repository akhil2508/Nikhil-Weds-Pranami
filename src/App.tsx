/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import weddingStoryPoster from '../standalone/assets/wedding-story-poster.jpg';
import weddingStoryVideo from '../standalone/assets/wedding-story.mp4';
import {
  Volume2,
  VolumeX,
  Music,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  Heart,
  Sparkles,
  Send,
  CheckCircle,
  Menu,
  X,
  Code,
  Phone,
  MessageCircle,
  CalendarPlus,
  Download,
  ExternalLink,
  Film,
  Play,
  Pause
} from 'lucide-react';
import { weddingAudio } from './audioHelper';
import { getAssetUrl } from './assetHelper';
import {
  WEDDING_EVENTS,
  getGoogleCalendarUrl,
  downloadIcsFile,
  type WeddingEvent
} from './weddingData';

interface Blessing {
  id: string;
  name: string;
  attending: string;
  dancing: string;
  song?: string;
  message: string;
  timestamp: string;
  likes: number;
}

const SONG_CHIPS = [
  'Bole Chudiyan',
  'Kajra Re',
  'London Thumakda',
  'Gallan Goodiyaan',
  'Maahi Ve',
  'Sauda Khara Khara',
  'Sweetheart (Kedarnath)'
];

export default function App() {
  // Audio state - start with music on
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasPlayingMusic, setWasPlayingMusic] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [codeTab, setCodeTab] = useState<'html' | 'css' | 'js'>('html');

  // Direct Save Date handler (strictly for 1-tap mobile action & calendar icon clicks)
  const handleDirectSaveDate = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const isIOS =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    if (isIOS) {
      downloadIcsFile();
    } else {
      const gUrl = getGoogleCalendarUrl();
      const newWin = window.open(gUrl, '_blank');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        window.location.href = gUrl;
      }
    }
  };

  // RSVP Form States
  const [name, setName] = useState('');
  const [attending, setAttending] = useState<'Yes' | 'No'>('Yes');
  const [dancing, setDancing] = useState<'Yes' | 'No'>('No');
  const [selectedSong, setSelectedSong] = useState('');
  const [customSong, setCustomSong] = useState('');
  const [blessingMessage, setBlessingMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Blessings Wall - empty by default, only populated when a guest gives a blessing
  const [blessings, setBlessings] = useState<Blessing[]>([]);

  // FAQ Accordion active states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Mobile scroll blur listener state
  const [scrollProgress, setScrollProgress] = useState<{ [key: string]: { blur: number; opacity: number } }>({});

  const eventSectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Initialize blessings from localStorage, stripping any legacy seed examples
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wedding_blessings_nikhil_pranami');
      if (stored) {
        const parsed: Blessing[] = JSON.parse(stored);
        // Exclude legacy mock seed examples
        const realBlessings = parsed.filter((b) => !b.id.startsWith('seed-'));
        setBlessings(realBlessings);
        localStorage.setItem('wedding_blessings_nikhil_pranami', JSON.stringify(realBlessings));
      } else {
        setBlessings([]);
      }
    } catch {
      setBlessings([]);
    }
  }, []);

  // IntersectionObserver for reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll('.reveal-item');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  // Mobile Cinematic Scroll Blur Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth > 900) return;

      const windowHeight = window.innerHeight;
      const newProgress: { [key: string]: { blur: number; opacity: number } } = {};

      WEDDING_EVENTS.forEach((ev) => {
        const el = eventSectionRefs.current[ev.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 0) {
            const distancePast = Math.abs(rect.top);
            const ratio = Math.min(distancePast / windowHeight, 1);
            newProgress[ev.id] = {
              blur: Math.round(ratio * 12),
              opacity: Math.max(0.3, 1 - ratio * 0.7),
            };
          } else {
            newProgress[ev.id] = { blur: 0, opacity: 1 };
          }
        }
      });

      setScrollProgress(newProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Try autoplay, then retry once on the first interaction if the browser blocks it.
  useEffect(() => {
    let unmounted = false;
    let userInteracted = false;

    const startPlaying = async (fromUserGesture = false) => {
      const started = await weddingAudio.startAudio();
      if (!unmounted && (fromUserGesture || !userInteracted)) {
        setIsPlaying(started);
      }
    };

    const handleFirstGesture = (event: Event) => {
      if (userInteracted) return;
      userInteracted = true;
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      if (
        event.target instanceof Element &&
        event.target.closest('button[aria-label="Pause wedding music"], button[aria-label="Play wedding music"]')
      ) {
        return;
      }
      void startPlaying(true);
    };

    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
    void startPlaying();

    return () => {
      unmounted = true;
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  const handleToggleMusic = async () => {
    const nextState = await weddingAudio.toggleAudio();
    setIsPlaying(nextState);
  };

  // RSVP Submit Handler
  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const chosenSong = customSong.trim() || selectedSong || (dancing === 'Yes' ? 'Bollywood Mashup' : undefined);
    const newBlessing: Blessing = {
      id: 'blessing-' + Date.now(),
      name: name.trim(),
      attending,
      dancing,
      song: chosenSong,
      message: blessingMessage.trim() || (attending === 'Yes' ? 'Extremely thrilled to be part of the celebrations! Wishing you endless bliss.' : 'Sending our heartfelt blessings and warm wishes to Nikhil & Pranami!'),
      timestamp: 'Just now',
      likes: 1,
    };

    const updated = [newBlessing, ...blessings];
    setBlessings(updated);
    try {
      localStorage.setItem('wedding_blessings_nikhil_pranami', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setFormSubmitted(true);
    setName('');
    setCustomSong('');
    setSelectedSong('');
    setBlessingMessage('');

    setTimeout(() => {
      setFormSubmitted(false);
      const wallEl = document.getElementById('blessings');
      if (wallEl) {
        wallEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 1800);
  };

  const handleLikeBlessing = (id: string) => {
    const updated = blessings.map((b) => (b.id === id ? { ...b, likes: b.likes + 1 } : b));
    setBlessings(updated);
    try {
      localStorage.setItem('wedding_blessings_nikhil_pranami', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // FAQ entries
  const faqs = [
    {
      q: 'What is the Dress Code for the wedding festivities?',
      a: (
        <div className="space-y-2">
          <p><strong>Haldi:</strong> Sunshine Yellow, Mustard & vibrant florals.</p>
          <p><strong>Mehndi:</strong> Refreshing Jade Green, Mint, and playful festive silhouettes.</p>
          <p><strong>Tilak & Shaadi:</strong> Regal Indian Traditional or Whatever suits you.</p>
          <div className="mt-3 p-3 bg-[#A34A3A]/10 border-l-2 border-[#A34A3A] text-sm text-[#1B3A2F] italic rounded-r">
            <strong>Friendly Note:</strong> Shaadi में 💎 जैसा बनकर आना लेकिन दूल्हे से थोड़ा कम...और लड़कियों में,<em> जिसने पहनी दुल्हन जैसी dress वो निकल ले अपने घर के address</em> 😉
          </div>
        </div>
      ),
    },
    {
      q: 'Whom can I contact for venue navigation or emergency queries?',
      a: (
        <div className="space-y-3">
          <p>
            Seniors can call:
          </p>
          <div className="p-3.5 bg-[#1B3A2F]/5 border border-[#D4A373]/50 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-[#1B3A2F] text-base">Sudhir Shukla</p>
              <p className="font-mono text-sm text-[#A34A3A] font-semibold">+91 7905000272</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:7905000272"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#1B3A2F]/90 transition-all shadow-sm"
              >
                <Phone className="h-3.5 w-3.5 text-[#D4A373]" />
                <span>Call Now</span>
              </a>
              <a
                href="https://wa.me/917905000272?text=Hi%20Bhaiya,%20I%20have%20a%20query%20regarding%20Nikhil%20%26%20Pranami's%20wedding"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg hover:bg-[#20ba5a] transition-all shadow-sm"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
          <p>
            Others can call:
          </p>
          <div className="p-3.5 bg-[#1B3A2F]/5 border border-[#D4A373]/50 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-[#1B3A2F] text-base">Akhil Shukla</p>
              <p className="font-mono text-sm text-[#A34A3A] font-semibold">+91 9919892622</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:9919892622"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#1B3A2F]/90 transition-all shadow-sm"
              >
                <Phone className="h-3.5 w-3.5 text-[#D4A373]" />
                <span>Call Now</span>
              </a>
              <a
                href="https://wa.me/919919892622?text=Hi%20Akhil,%20I%20have%20a%20query%20regarding%20Nikhil%20%26%20Pranami's%20wedding"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg hover:bg-[#20ba5a] transition-all shadow-sm"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      ),
    },
    {
      q: 'Is parking available at Royal Anand Resort & Club?',
      a: 'Yes, complimentary dedicated parking is arranged for all wedding guests at the main entrance gate of Royal Anand Resort & Club.',
    },
    {
      q: 'Can I bring children or additional family members?',
      a: 'Wholeheartedly yes! Our wedding is a family reunion and little ones bring the utmost charm, joy, and laughter to the festivities.',
    },
    {
      q: 'Are photography and social media posting encouraged?',
      a: 'Yes! Please snap all your candid smiles and tag your memories with our official hashtag #NikKiPranami so we can relive every moment.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#FCF8F5] text-[#1B3A2F] selection:bg-[#D4A373]/30 selection:text-[#1B3A2F]">
      {/* Hidden audio element */}
      <audio id="bg-music" src={getAssetUrl('music/thousand-years.mp3')} loop preload="auto" />



      {/* ============================================================== */}
      {/* 3.B: Fixed Top Navigation Bar */}
      {/* ============================================================== */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#FCF8F5]/90 backdrop-blur-md border-b border-[#D4A373]/30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <a
            href="#hero"
            className="font-script text-3xl sm:text-4xl text-[#1B3A2F] hover:text-[#A34A3A] transition-colors leading-none"
          >
            N & P
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 font-sans-jost text-sm font-medium tracking-wide text-[#1B3A2F]">
            <a href="#welcome" className="hover:text-[#A34A3A] transition-colors">
              Welcome
            </a>
            <a href="#events" className="hover:text-[#A34A3A] transition-colors">
              Events
            </a>
            <a href="#our-story" className="hover:text-[#A34A3A] transition-colors">
              Our Story
            </a>
            <a href="#venue" className="hover:text-[#A34A3A] transition-colors">
              Venue
            </a>
            <a href="#faq" className="hover:text-[#A34A3A] transition-colors">
              FAQ
            </a>
            <a href="#rsvp" className="hover:text-[#A34A3A] transition-colors">
              RSVP
            </a>
            <a href="#blessings" className="hover:text-[#A34A3A] transition-colors">
              Blessings
            </a>
          </nav>

          {/* Right Action: Add to Calendar & Code Viewer */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct 1-tap calendar button on mobile (no explicit text, directly opens calendar) */}
            <button
              type="button"
              onClick={handleDirectSaveDate}
              className="sm:hidden p-1.5 rounded-lg border border-[#D4A373]/50 bg-[#D4A373]/20 hover:bg-[#D4A373]/35 text-[#A34A3A] transition-colors cursor-pointer"
              title="Save wedding date to calendar"
              aria-label="Save wedding date to calendar"
            >
              <CalendarPlus className="h-4.5 w-4.5 text-[#A34A3A]" />
            </button>

            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans-jost font-semibold text-[#1B3A2F] bg-[#D4A373]/25 hover:bg-[#D4A373]/40 rounded-lg border border-[#D4A373]/50 transition-colors"
              title="Add 11 Dec 2026 to Google Calendar"
            >
              <CalendarPlus className="h-3.5 w-3.5 text-[#A34A3A]" />
              <span>Add to Calendar</span>
            </a>

            <a
              href="#rsvp"
              className="py-1.5 px-4 bg-[#A34A3A] text-white font-sans-jost text-xs font-semibold tracking-wider uppercase rounded-lg hover:bg-[#A34A3A]/90 transition-colors shadow-sm"
            >
              RSVP
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1B3A2F] hover:text-[#A34A3A] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FCF8F5] border-b border-[#D4A373]/30 px-6 py-4 space-y-3 font-sans-jost font-medium text-[#1B3A2F] shadow-lg animate-fadeIn">
            <a
              href="#welcome"
              onClick={() => setMobileMenuOpen(false)}
              className="block hover:text-[#A34A3A]"
            >
              Welcome
            </a>
            <a
              href="#events"
              onClick={() => setMobileMenuOpen(false)}
              className="block hover:text-[#A34A3A]"
            >
              Events Timeline
            </a>
            <a
              href="#our-story"
              onClick={() => setMobileMenuOpen(false)}
              className="block hover:text-[#A34A3A]"
            >
              Our Story
            </a>
            <a
              href="#venue"
              onClick={() => setMobileMenuOpen(false)}
              className="block hover:text-[#A34A3A]"
            >
              Venue & Map
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block hover:text-[#A34A3A]"
            >
              FAQ & Dress Code
            </a>
            <a
              href="#rsvp"
              onClick={() => setMobileMenuOpen(false)}
              className="block hover:text-[#A34A3A]"
            >
              RSVP Form
            </a>
            <a
              href="#blessings"
              onClick={() => setMobileMenuOpen(false)}
              className="block hover:text-[#A34A3A]"
            >
              Blessings Wall
            </a>
            <div className="pt-2 border-t border-[#D4A373]/30 flex flex-col gap-2">
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full text-left py-1 text-xs text-[#1B3A2F] font-semibold flex items-center gap-2"
              >
                <CalendarPlus className="h-4 w-4 text-[#A34A3A]" />
                <span>Add Wedding to Google Calendar</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 3.B: Full-Screen Hero Section */}
      {/* ============================================================== */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center text-center px-4 pt-18 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('${getAssetUrl('images/hero.jpg')}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35" />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 max-w-3xl mx-auto text-white flex flex-col items-center">

          <h1 className="font-script text-6xl sm:text-7xl md:text-9xl text-white hero-title-shadow leading-tight mb-2">
            Nikhil & Pranami
          </h1>

          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#D4A373] to-transparent mb-5" />

          {/* Date / Save the Date badge: Terracotta with white text shadow */}
          <div
            className="hero-date-shadow text-[#A34A3A] bg-white/95 hover:bg-white backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-[#D4A373] hover:border-[#A34A3A] shadow-xl hover:shadow-2xl inline-flex items-center gap-2.5 sm:gap-3 mb-4 transition-all duration-200 group focus:outline-none"
          >
            {/* Clickable Calendar Icon: directly saves wedding date in calendar */}
            <button
              type="button"
              onClick={handleDirectSaveDate}
              title="Click to save the wedding date in your calendar"
              aria-label="Save wedding date in calendar"
              className="p-1 -m-1 rounded-full text-[#A34A3A] hover:bg-[#A34A3A]/10 active:scale-90 transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-[#A34A3A]"
            >
              <Calendar className="h-5 w-5 text-[#A34A3A] group-hover:scale-115 transition-transform" />
            </button>

            {/* Date: Georgia font; on mobile clicking directly saves date to calendar, on desktop opens modal */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 640) {
                  handleDirectSaveDate();
                } else {
                  setShowCalendarModal(true);
                }
              }}
              title="11-12 December 2026"
              className="font-serif-cormorant text-2xl sm:text-3xl font-bold tracking-wider cursor-pointer hover:opacity-95 transition-opacity focus:outline-none"
              style={{ fontFamily: 'Georgia' }}
            >
              11 · 12 · 2026
            </button>

            {/* Explicit text: strictly HIDDEN on mobile (no "Save Date" wording on mobile), visible only on sm+ screens */}
            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className="hidden sm:inline-flex items-center text-xs font-sans-jost font-semibold text-[#1B3A2F]/80 bg-[#D4A373]/25 hover:bg-[#A34A3A] hover:text-white px-2.5 py-0.5 rounded-full transition-colors ml-0.5 cursor-pointer"
            >
              Save Date
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3.C & 3.D: Events Sections */}
      {/* DESKTOP (min-width: 901px): Fixed blurred background image. Glass cards. */}
      {/* MOBILE (max-width: 900px): Clean floating text adjusted to photo space, NO card icons, NO description overlay. */}
      {/* ============================================================== */}
      <div
        id="events"
        className="events-desktop-container relative"
        style={{
          backgroundImage: `url('${getAssetUrl('images/background-image.jpg')}'), url('${getAssetUrl('images/background image.jpg')}')`,
        }}
      >
        <div
          id="welcome"
          className="relative z-10 pt-16 pb-4 text-center bg-[#FCF8F5] md:bg-transparent"
          style={{ backgroundImage: 'none' }}
        >
          <h2 className="font-script text-5xl md:text-6xl text-[#1B3A2F] mt-1">
            The Wedding Story
          </h2>
          <div className="h-px w-24 mx-auto bg-[#D4A373] mt-3" />
        </div>

        {WEDDING_EVENTS.map((event, index) => {
          const isLeft = event.align === 'left';
          const blurData = scrollProgress[event.id] || { blur: 0, opacity: 1 };

          return (
            <section
              key={event.id}
              id={event.id}
              ref={(el) => {
                eventSectionRefs.current[event.id] = el;
              }}
              className="relative min-h-screen flex items-start sm:items-center justify-center p-4 sm:p-8 md:py-24"
            >
              {/* MOBILE ONLY (max-width: 900px): Background slide with cinematic scroll blur */}
              <div
                className="md:hidden absolute inset-0 bg-cover bg-center transition-all duration-300"
                style={{
                  backgroundImage: `url('${getAssetUrl(event.image)}')`,
                  filter: `blur(${blurData.blur}px)`,
                  opacity: blurData.opacity,
                }}
              >
                {/* Gentle top contrast gradient: lighter for Haldi to keep bright yellow photo shining; hidden on mobile for shaadi */}
                <div
                  className={`absolute inset-x-0 top-0 h-2/5 ${
                    event.id === 'haldi'
                      ? 'bg-gradient-to-b from-white/40 via-white/10 to-transparent'
                      : event.id === 'shaadi'
                      ? 'hidden md:block bg-gradient-to-b from-black/70 via-black/30 to-transparent'
                      : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
                  }`}
                />
              </div>

              {/* CONTENT WRAPPER - Shifted lower on mobile strictly adjusted per section; strictly removed on mobile for Shaadi */}
              <div
                className={`relative z-10 w-full max-w-6xl mx-auto flex-col md:flex-row ${
                  event.id === 'shaadi'
                    ? 'hidden md:flex'
                    : 'flex'
                } ${
                  event.id === 'mehndi'
                    ? 'pt-[11.5rem] sm:pt-44 md:pt-0'
                    : event.id === 'haldi'
                    ? 'pt-[7.5rem] sm:pt-32 md:pt-0'
                    : 'pt-16 sm:pt-0'
                }`}
              >
                <div
                  className={`w-full flex ${
                    isLeft ? 'md:justify-start' : 'md:justify-end'
                  } ${
                    event.id === 'vidai'
                      ? 'justify-center -translate-x-6 sm:-translate-x-8 md:translate-x-0'
                      : 'justify-center'
                  }`}
                >
                  <div
                    className="reveal-item w-full max-w-[340px] sm:max-w-sm md:max-w-xl
                               text-white md:text-[#1B3A2F]
                               p-2 md:p-10
                               md:glass-card md:rounded-3xl
                               bg-transparent md:bg-white/88 md:backdrop-blur-md
                               border-0 md:border md:border-[#D4A373]/40"
                  >
                    {/* Desktop-only kicker with sparkle icon */}
                    <div className="hidden md:flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-[#A34A3A]" />
                      <span className="font-sans-jost text-xs uppercase tracking-widest text-[#A34A3A] font-semibold">
                        {event.hasDate ? `Event 0${index}` : 'Ceremony Introduction'}
                      </span>
                    </div>

                    {/* Heading in cursive Great Vibes (for Haldi mobile: #1B3A2F) */}
                    <h3
                      className={`font-script text-5xl sm:text-6xl md:text-6xl leading-tight mb-2 text-center md:text-left ${
                        event.id === 'haldi'
                          ? 'text-[#1B3A2F] drop-shadow-sm md:drop-shadow-none'
                          : 'text-white md:text-[#1B3A2F] drop-shadow-md md:drop-shadow-none'
                      }`}
                    >
                      {event.title}
                    </h3>

                    {/* Event Date, Time & Venue */}
                    {event.hasDate ? (
                      <div className="space-y-1.5 my-2 text-center md:text-left font-sans-jost text-sm sm:text-base">
                        {/* Date: for Haldi mobile #1B3A2F, for Tilak mobile white */}
                        <div
                          className={`font-semibold text-base sm:text-lg ${
                            event.id === 'haldi'
                              ? 'text-[#1B3A2F]'
                              : event.id === 'tilak'
                              ? 'text-white md:text-[#A34A3A] drop-shadow-md'
                              : 'text-[#D4A373] md:text-[#A34A3A]'
                          }`}
                        >
                          <span className={`opacity-90 font-serif-cormorant italic text-lg sm:text-xl ${
                            event.id === 'tilak' ? 'text-white' : ''
                          }`}>
                            Date:{' '}
                          </span>
                          <span className={event.id === 'tilak' ? 'text-white' : ''}>{event.date}</span>
                        </div>

                        {/* Time: for Haldi mobile strictly #1B3A2F */}
                        <div
                          className={`font-medium text-sm sm:text-base ${
                            event.id === 'haldi'
                              ? 'text-[#1B3A2F]'
                              : 'text-white/95 md:text-[#1B3A2F]/90'
                          }`}
                        >
                          <span className="opacity-90 font-serif-cormorant italic text-base sm:text-lg">
                            Time:{' '}
                          </span>
                          <span>{event.time}</span>
                        </div>

                        {/* Venue: for Haldi mobile strictly #1B3A2F; hidden on mobile strictly for Vidai */}
                        <div
                          className={`text-xs sm:text-sm pt-1 ${
                            event.id === 'vidai'
                              ? 'hidden md:block text-white/95 md:text-[#1B3A2F]/90'
                              : event.id === 'haldi'
                              ? 'text-[#1B3A2F]'
                              : 'text-white/95 md:text-[#1B3A2F]/90'
                          }`}
                        >
                          <span className="opacity-90 font-serif-cormorant italic text-sm sm:text-base">
                            Venue:{' '}
                          </span>
                          <span className="font-medium">{event.venue}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center md:text-left text-xs sm:text-sm font-sans-jost text-white/90 md:text-[#1B3A2F]/80 mb-2">
                        <span className="font-serif-cormorant italic text-base">Venue: </span>
                        <span>{event.venue}</span>
                      </div>
                    )}

                    {/* Event Description: HIDDEN ON MOBILE to protect the image beauty */}
                    <p className="hidden md:block mt-4 pt-3 border-t border-[#D4A373]/30 font-serif-cormorant text-lg text-[#1B3A2F]/90 leading-relaxed italic">
                      "{event.description}"
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* Our Story Video Section */}
      {/* Placed between Events Timeline (Vidai) and Venue */}
      {/* ============================================================== */}
      <section
        id="our-story"
        className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FCF8F5] via-white to-[#FCF8F5] border-t border-[#D4A373]/30 overflow-hidden"
      >
        {/* Subtle decorative glow accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-25">
          <div className="absolute top-12 left-8 w-72 h-72 rounded-full bg-[#D4A373]/25 blur-3xl" />
          <div className="absolute bottom-12 right-8 w-80 h-80 rounded-full bg-[#A34A3A]/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4A373]/15 border border-[#D4A373]/40 text-[#A34A3A] font-sans-jost text-xs font-semibold tracking-[0.25em] uppercase mb-3 shadow-xs">
              <Heart className="w-3.5 h-3.5 fill-[#A34A3A] text-[#A34A3A]" />
              <span>A Journey of Love &amp; Togetherness</span>
              <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
            </div>

            <h2 className="font-script text-5xl sm:text-6xl md:text-7xl text-[#1B3A2F] mt-1 leading-tight">
              Our Story
            </h2>
            <div className="h-px w-28 mx-auto bg-gradient-to-r from-transparent via-[#D4A373] to-transparent my-3.5" />
            <p className="font-serif-cormorant text-lg sm:text-xl text-[#1B3A2F]/80 italic max-w-xl mx-auto">
              "Every love story is beautiful, but ours is our favorite. Celebrate the cherished moments and memories leading to forever."
            </p>
          </div>

          {/* Video Player Container */}
          <div className="relative mx-auto max-w-4xl bg-white/90 p-3 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl border border-[#D4A373]/40 shadow-2xl backdrop-blur-xs">
            <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-black/95 shadow-inner group">
              <video
                ref={videoRef}
                controls
                playsInline
                preload="metadata"
                poster={weddingStoryPoster}
                className="w-full h-auto max-h-[75vh] mx-auto block object-contain"
                onPlay={() => {
                  setIsVideoPlaying(true);
                  if (isPlaying) {
                    weddingAudio.pauseAudio();
                    setWasPlayingMusic(true);
                  }
                }}
                onPause={() => {
                  setIsVideoPlaying(false);
                  if (wasPlayingMusic) {
                    weddingAudio.startAudio();
                    setWasPlayingMusic(false);
                  }
                }}
                onEnded={() => {
                  setIsVideoPlaying(false);
                  if (wasPlayingMusic) {
                    weddingAudio.startAudio();
                    setWasPlayingMusic(false);
                  }
                }}
              >
                <source src={weddingStoryVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Big Play Overlay (shown when paused for guaranteed 1-tap playback on iOS and Android) */}
              {!isVideoPlaying && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!videoRef.current) return;
                    try {
                      if (isPlaying) {
                        weddingAudio.pauseAudio();
                        setWasPlayingMusic(true);
                      }
                      await videoRef.current.play();
                      setIsVideoPlaying(true);
                    } catch (e) {
                      console.warn('Video play triggered:', e);
                    }
                  }}
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/30 hover:bg-black/20 active:bg-black/45 transition-all cursor-pointer z-10"
                  aria-label="Play Nikhil & Pranami Wedding Story Video"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#A34A3A]/90 hover:bg-[#A34A3A] text-white flex items-center justify-center shadow-2xl border-2 border-white/90 transform hover:scale-110 active:scale-95 transition-all">
                    <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-white text-white translate-x-0.5" />
                  </div>
                  <span className="mt-3 px-4 py-1.5 rounded-full bg-black/65 backdrop-blur-sm text-white font-sans-jost text-xs sm:text-sm font-medium tracking-wide border border-white/20 shadow-md">
                    Watch Our Story
                  </span>
                </button>
              )}
            </div>

            {/* Video Caption & Info */}
            <div className="mt-4 px-2 sm:px-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-sans-jost text-[#1B3A2F]/75">
              <div className="flex items-center gap-2 font-medium">
                <span className="p-1 rounded-md bg-[#A34A3A]/10 text-[#A34A3A]">
                  <Film className="w-4 h-4" />
                </span>
                <span className="font-semibold text-[#1B3A2F]">Nikhil &amp; Pranami</span>
                <span className="text-[#D4A373]">•</span>
                <span>The Journey to Forever</span>
              </div>
              <span className="text-center sm:text-right text-[#1B3A2F]/65 italic">
                Press play to watch our story
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3.E: Solid Sections (Below Events) */}
      {/* ============================================================== */}

      {/* 1. Venue Section (Exact Royal Anand Resort Google Maps Iframe) */}
      <section id="venue" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#FCF8F5] border-t border-[#D4A373]/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="font-sans-jost text-xs uppercase tracking-[0.25em] text-[#A34A3A] font-semibold">
              The Destination
            </p>
            <h2 className="font-script text-5xl md:text-6xl text-[#1B3A2F] mt-1">
              Royal Anand Resort & Club
            </h2>
            <div className="h-px w-24 mx-auto bg-[#D4A373] my-3" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Map Frame with exact user iframe */}
            <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-[#D4A373]/40 shadow-xl bg-white min-h-[420px] flex flex-col">
              <iframe
                title="Google Maps Location of Royal Anand Resort & Club"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3570.5315012706424!2d80.18297327542534!3d26.503025476893818!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399c358f7480c885%3A0xe877da1c61610887!2sRoyal%20Anand%20Resort%20%26%20Club!5e0!3m2!1sen!2sin!4v1792960494423!5m2!1sen!2sin"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-full min-h-[400px] border-0"
              />
            </div>

            {/* Address & Travel Details */}
            <div className="lg:col-span-5 p-8 bg-white/90 border border-[#D4A373]/30 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="font-serif-cormorant text-2xl font-bold text-[#1B3A2F] mb-4">
                  Directions & Accommodations
                </h3>

                <div className="space-y-4 text-sm font-sans-jost text-[#1B3A2F]/85">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#A34A3A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#1B3A2F]">Address:</strong>
                      <span>Royal Anand Resort & Club, Tikra Kanpur, Anandpuram, Uttar Pradesh - 209101</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#A34A3A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#1B3A2F]">Key Dates:</strong>
                      <span>11th December 2026</span>
                    </div>
                  </div>

                  {/* Navigation Help Contact: Akhil Shukla */}
                  <div className="p-4 bg-[#1B3A2F]/5 rounded-xl border border-[#D4A373]/40">
                    <p className="font-semibold text-[#A34A3A] mb-1">Venue Navigation & Help:</p>
                    <p className="text-xs text-[#1B3A2F]/80 mb-2">
                      Need route guidance or any help? Contact Akhil:
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href="tel:9919892622"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3A2F] text-white text-xs font-semibold rounded-lg hover:bg-[#1B3A2F]/90 transition-colors"
                      >
                        <Phone className="h-3 w-3 text-[#D4A373]" />
                        <span>9919892622</span>
                      </a>
                      <a
                        href="https://wa.me/919919892622?text=Hello%20Akhil,%20can%20you%20help%20with%20directions%20to%20Royal%20Anand%20Resort?"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg hover:bg-[#20ba5a] transition-colors"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Traveler Tips: Hidden on mobile as not required */}
                  <div className="hidden md:block p-4 bg-[#FCF8F5] rounded-xl border border-[#D4A373]/30">
                    <p className="font-semibold text-[#A34A3A] mb-1">Traveler Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-[#1B3A2F]/75">
                      <li>Kanpur Central Railway Station: ~25 mins drive.</li>
                      <li>Kanpur Airport (Chakeri): ~40 mins drive.</li>
                      <li>Lucknow Airport (LKO): ~90 mins drive via Expressway.</li>
                      <li>Valet parking is active throughout all events.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href="https://maps.google.com/?q=Royal+Anand+Resort+Kanpur"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 px-4 bg-[#1B3A2F] text-white text-center font-sans-jost text-sm font-semibold rounded-xl hover:bg-[#1B3A2F]/90 active:scale-95 transition-all shadow"
                >
                  Open in Google Maps
                </a>
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-4 bg-[#A34A3A] text-white text-center font-sans-jost text-sm font-semibold rounded-xl hover:bg-[#8e3c2e] active:scale-95 transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <CalendarPlus className="h-4 w-4" />
                  <span>Add to Calendar</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FAQ Section (Accordion Style with Humor & Akhil Shukla Contact) */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#D4A373]/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-sans-jost text-xs uppercase tracking-[0.25em] text-[#A34A3A] font-semibold">
              Good To Know
            </p>
            <h2 className="font-script text-5xl md:text-6xl text-[#1B3A2F] mt-1">
              Frequently Asked Questions
            </h2>
            <div className="h-px w-24 mx-auto bg-[#D4A373] my-3" />
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-[#D4A373]/35 rounded-2xl overflow-hidden transition-all bg-[#FCF8F5]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-serif-cormorant text-xl font-bold text-[#1B3A2F] hover:text-[#A34A3A] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-[#A34A3A] transition-transform duration-300 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-base font-sans-jost text-[#1B3A2F]/85 border-t border-[#D4A373]/20 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. RSVP Section */}
      <section id="rsvp" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FCF8F5] border-t border-[#D4A373]/30">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-sans-jost text-xs uppercase tracking-[0.25em] text-[#A34A3A] font-semibold">
              Please Respond
            </p>
            <h2 className="font-script text-5xl md:text-6xl text-[#1B3A2F] mt-1">
              Will You Join Us?
            </h2>
            <div className="h-px w-24 mx-auto bg-[#D4A373] my-3" />
            <p className="font-serif-cormorant text-lg text-[#1B3A2F]/80">
              Your gracious presence and blessings mean the world to Nikhil & Pranami.
            </p>
          </div>

          <div className="p-8 sm:p-10 bg-white border border-[#D4A373]/40 rounded-3xl shadow-xl">
            {formSubmitted ? (
              <div className="text-center py-8 space-y-3 animate-fadeIn">
                <CheckCircle className="h-16 w-16 text-[#1B3A2F] mx-auto animate-bounce" />
                <h3 className="font-serif-cormorant text-3xl font-bold text-[#1B3A2F]">
                  Dhanyavaad! Thank You!
                </h3>
                <p className="font-sans-jost text-sm text-[#1B3A2F]/80">
                  Your response and blessing have been recorded and added to the Blessings Wall below.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-6">
                <div>
                  <label className="block font-serif-cormorant text-lg font-bold text-[#1B3A2F] mb-1">
                    Your Name(s) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Akhil Shukla & Family"
                    className="w-full py-2.5 px-4 rounded-xl border border-[#D4A373]/50 focus:outline-none focus:ring-2 focus:ring-[#A34A3A] font-sans-jost text-sm"
                  />
                </div>

                <div>
                  <label className="block font-serif-cormorant text-lg font-bold text-[#1B3A2F] mb-2">
                    Will You Be Attending? *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAttending('Yes')}
                      className={`py-3 px-4 rounded-xl font-sans-jost text-sm font-semibold border transition-all cursor-pointer ${
                        attending === 'Yes'
                          ? 'bg-[#1B3A2F] text-white border-[#1B3A2F] shadow-sm'
                          : 'bg-white text-[#1B3A2F] border-slate-200 hover:border-[#D4A373]'
                      }`}
                    >
                      Joyfully Accept (Yes)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttending('No')}
                      className={`py-3 px-4 rounded-xl font-sans-jost text-sm font-semibold border transition-all cursor-pointer ${
                        attending === 'No'
                          ? 'bg-[#A34A3A] text-white border-[#A34A3A] shadow-sm'
                          : 'bg-white text-[#1B3A2F] border-slate-200 hover:border-[#D4A373]'
                      }`}
                    >
                      Regretfully Decline (No)
                    </button>
                  </div>
                </div>

                {attending === 'Yes' && (
                  <div className="pt-2 border-t border-[#D4A373]/20 animate-fadeIn space-y-4">
                    <div>
                      <label className="block font-serif-cormorant text-lg font-bold text-[#1B3A2F] mb-2">
                        Are you planning a Dance Performance? 💃🕺
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setDancing('Yes')}
                          className={`py-2.5 px-4 rounded-xl font-sans-jost text-sm font-semibold border transition-all cursor-pointer ${
                            dancing === 'Yes'
                              ? 'bg-[#D4A373] text-[#1B3A2F] border-[#D4A373] shadow-sm font-bold'
                              : 'bg-white text-[#1B3A2F] border-slate-200 hover:border-[#D4A373]'
                          }`}
                        >
                          Yes, Ready to Dance!
                        </button>
                        <button
                          type="button"
                          onClick={() => setDancing('No')}
                          className={`py-2.5 px-4 rounded-xl font-sans-jost text-sm font-semibold border transition-all cursor-pointer ${
                            dancing === 'No'
                              ? 'bg-slate-200 text-[#1B3A2F] border-slate-300 shadow-sm'
                              : 'bg-white text-[#1B3A2F] border-slate-200 hover:border-[#D4A373]'
                          }`}
                        >
                          Will Cheer From Audience
                        </button>
                      </div>
                    </div>

                    {dancing === 'Yes' && (
                      <div className="p-4 bg-[#FCF8F5] border border-[#D4A373]/40 rounded-2xl space-y-3 animate-fadeIn">
                        <p className="font-serif-cormorant font-bold text-base text-[#1B3A2F]">
                          Select or Suggest Your Track:
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {SONG_CHIPS.map((chip) => {
                            const isSelected = selectedSong === chip;
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => {
                                  setSelectedSong(isSelected ? '' : chip);
                                  if (!isSelected) setCustomSong('');
                                }}
                                className={`px-3 py-1.5 text-xs font-sans-jost rounded-full transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#A34A3A] text-white shadow-sm'
                                    : 'bg-white text-[#1B3A2F] border border-[#D4A373]/40 hover:border-[#A34A3A]'
                                }`}
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>

                        <div>
                          <label className="block text-xs font-sans-jost text-[#1B3A2F]/70 mb-1">
                            Or enter any custom song / group names:
                          </label>
                          <input
                            type="text"
                            value={customSong}
                            onChange={(e) => {
                              setCustomSong(e.target.value);
                              if (e.target.value) setSelectedSong('');
                            }}
                            placeholder="e.g. Nachde Ne Saare / Cousins Group"
                            className="w-full py-2 px-3 text-sm rounded-lg border border-[#D4A373]/50 bg-white focus:outline-none focus:ring-1 focus:ring-[#A34A3A]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-serif-cormorant text-lg font-bold text-[#1B3A2F] mb-1">
                    Your Blessing or Message for Nikhil & Pranami
                  </label>
                  <textarea
                    rows={3}
                    value={blessingMessage}
                    onChange={(e) => setBlessingMessage(e.target.value)}
                    placeholder="Write a sweet message, blessing, or memory..."
                    className="w-full py-2.5 px-4 rounded-xl border border-[#D4A373]/50 focus:outline-none focus:ring-2 focus:ring-[#A34A3A] font-sans-jost text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 bg-[#A34A3A] text-white font-sans-jost font-semibold text-sm tracking-wider uppercase rounded-xl hover:bg-[#A34A3A]/90 active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Send RSVP & Blessings</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 4. Blessings Wall Section */}
      <section id="blessings" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#D4A373]/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-sans-jost text-xs uppercase tracking-[0.25em] text-[#A34A3A] font-semibold">
              Love & Warm Wishes
            </p>
            <h2 className="font-script text-5xl md:text-6xl text-[#1B3A2F] mt-1">
              The Blessings Wall
            </h2>
            <div className="h-px w-24 mx-auto bg-[#D4A373] my-3" />
            <p className="font-serif-cormorant text-lg text-[#1B3A2F]/80">
              Heartfelt messages from family, friends, and loved ones.
            </p>
          </div>

          {blessings.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-12 px-6 rounded-2xl bg-[#FCF8F5] border border-dashed border-[#D4A373]/60 shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#A34A3A]/10 flex items-center justify-center text-[#A34A3A]">
                <Heart className="h-6 w-6 fill-[#A34A3A]/20" />
              </div>
              <h3 className="font-serif-cormorant text-2xl font-bold text-[#1B3A2F] mb-2">
                Be the First to Send a Blessing!
              </h3>
              <p className="font-sans-jost text-sm text-[#1B3A2F]/70 mb-5">
                No wishes have been posted yet. Fill in the RSVP form above to send your love, congratulations, or dance track for Nikhil & Pranami.
              </p>
              <a
                href="#rsvp"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A34A3A] text-white text-xs font-sans-jost font-semibold uppercase tracking-wider rounded-xl hover:bg-[#A34A3A]/90 transition-all shadow-sm"
              >
                <span>Write a Blessing</span>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blessings.map((b) => (
                <div
                  key={b.id}
                  className="p-6 rounded-2xl bg-[#FCF8F5] border border-[#D4A373]/35 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-serif-cormorant text-2xl font-bold text-[#1B3A2F]">
                        {b.name}
                      </span>
                      <span className="text-[11px] font-sans-jost text-[#1B3A2F]/60">
                        {b.timestamp}
                      </span>
                    </div>

                    {b.dancing === 'Yes' && b.song && (
                      <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#D4A373]/20 rounded-md text-xs font-sans-jost text-[#A34A3A] font-medium">
                        <Music className="h-3 w-3" />
                        <span>Sangeet Track: {b.song}</span>
                      </div>
                    )}

                    <p className="font-serif-cormorant text-base text-[#1B3A2F]/85 italic leading-relaxed">
                      "{b.message}"
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#D4A373]/20 flex items-center justify-between">
                    <span className="text-xs font-sans-jost text-[#1B3A2F]/60">
                      Status: {b.attending === 'Yes' ? 'Attending with joy' : 'Well wisher'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLikeBlessing(b.id)}
                      className="flex items-center gap-1.5 text-xs font-sans-jost text-[#A34A3A] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Heart className="h-4 w-4 fill-[#A34A3A]/20 text-[#A34A3A]" />
                      <span>{b.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3.F: Footer (Using ❤️ in place of 'love' as requested) */}
      {/* ============================================================== */}
      <footer className="bg-[#1B3A2F] text-[#FCF8F5] py-14 px-4 border-t border-[#D4A373]/40 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center space-y-4">
          <div className="font-script text-5xl text-[#D4A373] tracking-wide">
            Nikhil & Pranami
          </div>
          <p className="font-sans-jost text-xs tracking-[0.2em] uppercase text-[#D4A373]/90">
            11 · 12 · 2026 · Royal Anand Resort & Club
          </p>

          <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#D4A373] to-transparent my-2" />

          {/* Specified phrase: "Made with ❤️ by Dulhan ka Devar" */}
          <p className="font-serif-cormorant text-2xl text-[#FCF8F5]/95 italic flex items-center justify-center gap-2">
            <span>Made with</span>
            <span className="text-red-500 inline-block animate-pulse">❤️</span>
            <span>by Dulhan ka Devar</span>
          </p>

          <div className="pt-4 text-xs font-sans-jost text-[#FCF8F5]/50 flex items-center gap-3">
            <span>#NikKiPranami</span>
            <span>·</span>
            <span>All Celebrations & Rituals Protected with Blessings</span>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* 3.A: Floating Music Toggle Button */}
      {/* ============================================================== */}
      <button
        type="button"
        onClick={handleToggleMusic}
        aria-label={isPlaying ? 'Pause wedding music' : 'Play wedding music'}
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-[#1B3A2F] text-[#D4A373] rounded-full shadow-2xl border-2 border-[#D4A373] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center cursor-pointer group"
      >
        {isPlaying ? (
          <div className="relative flex items-center justify-center">
            <Volume2 className="h-6 w-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A373] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4A373]"></span>
            </span>
          </div>
        ) : (
          <VolumeX className="h-6 w-6 text-white/70 group-hover:text-white" />
        )}
      </button>

      {/* ============================================================== */}
      {/* Standalone Code Modal (HTML, CSS, JS block inspector) */}
      {/* ============================================================== */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#1B3A2F] text-white rounded-2xl border border-[#D4A373]/50 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4A373]/30 bg-black/30">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-[#D4A373]" />
                <h3 className="font-serif-cormorant text-xl font-bold text-[#FCF8F5]">
                  Updated Standalone Code Blocks
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-2 px-6 pt-3 bg-black/20 border-b border-white/10">
              <button
                type="button"
                onClick={() => setCodeTab('html')}
                className={`py-2 px-4 text-xs font-mono rounded-t-lg transition-colors cursor-pointer ${
                  codeTab === 'html'
                    ? 'bg-[#1B3A2F] text-[#D4A373] border-t-2 border-[#D4A373] font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                index.html
              </button>
              <button
                type="button"
                onClick={() => setCodeTab('css')}
                className={`py-2 px-4 text-xs font-mono rounded-t-lg transition-colors cursor-pointer ${
                  codeTab === 'css'
                    ? 'bg-[#1B3A2F] text-[#D4A373] border-t-2 border-[#D4A373] font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                style.css
              </button>
              <button
                type="button"
                onClick={() => setCodeTab('js')}
                className={`py-2 px-4 text-xs font-mono rounded-t-lg transition-colors cursor-pointer ${
                  codeTab === 'js'
                    ? 'bg-[#1B3A2F] text-[#D4A373] border-t-2 border-[#D4A373] font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                script.js
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-[#0d1e18] text-[#e0ece6] leading-relaxed">
              <p className="text-[#D4A373] mb-2 font-sans-jost text-xs">
                Check the updated code blocks directly below in chat or from the /standalone directory!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* Save the Date to Calendar Modal */}
      {/* ============================================================== */}
      {showCalendarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowCalendarModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#FCF8F5] text-[#1B3A2F] rounded-2xl border-2 border-[#D4A373] shadow-2xl p-6 sm:p-7 overflow-hidden text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowCalendarModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#1B3A2F]/60 hover:text-[#A34A3A] hover:bg-[#D4A373]/20 transition-colors cursor-pointer"
              aria-label="Close calendar options"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon & Title */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#A34A3A]/10 text-[#A34A3A] mb-3">
              <CalendarPlus className="h-6 w-6 text-[#A34A3A]" />
            </div>

            <h3 className="font-serif-cormorant text-2xl sm:text-3xl font-bold text-[#1B3A2F] mb-1">
              Save the Date
            </h3>
            <p className="font-script text-xl text-[#A34A3A] mb-4">
              Nikhil & Pranami's Wedding
            </p>

            {/* Event Summary Card */}
            <div className="bg-white rounded-xl p-4 border border-[#D4A373]/40 shadow-sm text-left text-xs sm:text-sm space-y-2 mb-5">
              <div className="flex items-start gap-2 text-[#1B3A2F]">
                <Calendar className="h-4 w-4 text-[#A34A3A] mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Date:</span> December 11 – 12, 2026
                </div>
              </div>
              <div className="flex items-start gap-2 text-[#1B3A2F]">
                <Clock className="h-4 w-4 text-[#D4A373] mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Key Events:</span> Tilak (5:00 PM) · Shaadi (7:00 PM) · Vidai (Dec 12, 7:00 AM)
                </div>
              </div>
              <div className="flex items-start gap-2 text-[#1B3A2F]">
                <MapPin className="h-4 w-4 text-[#A34A3A] mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Venue:</span> Royal Anand Resort & Club, Kanpur
                </div>
              </div>
            </div>

            {/* Calendar Action Buttons */}
            <div className="space-y-2.5">
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowCalendarModal(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#A34A3A] hover:bg-[#8e3f31] text-white font-sans-jost text-sm font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <CalendarPlus className="h-4 w-4 text-white" />
                <span>Add to Google Calendar</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70 ml-auto" />
              </a>
            </div>

            <p className="mt-4 text-[11px] font-sans-jost text-[#1B3A2F]/60">
              Compatible with Google Calendar, Apple Calendar, iPhone, Android, and Outlook.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
