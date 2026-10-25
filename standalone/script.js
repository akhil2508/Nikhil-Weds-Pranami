// script.js - Nikhil & Pranami Wedding Website

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const bgAudio = document.getElementById('bg-music');
  const floatingMusicBtn = document.getElementById('floating-music-btn');
  const musicBtnIcon = document.getElementById('music-btn-icon');
  const downloadIcsBtn = document.getElementById('download-ics-btn');

  let isPlaying = false;

  // Start with music on: attempt autoplay immediately, and trigger on first gesture if browser blocked
  playMusic();

  const handleFirstInteraction = () => {
    playMusic();
    window.removeEventListener('click', handleFirstInteraction);
    window.removeEventListener('touchstart', handleFirstInteraction);
    window.removeEventListener('scroll', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
  };

  window.addEventListener('click', handleFirstInteraction, { passive: true });
  window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
  window.addEventListener('scroll', handleFirstInteraction, { passive: true });
  window.addEventListener('keydown', handleFirstInteraction, { passive: true });

  function playMusic() {
    bgAudio.play()
      .then(() => {
        isPlaying = true;
        musicBtnIcon.textContent = '🔊';
      })
      .catch((err) => {
        console.warn('Audio auto-play policy or missing audio file:', err);
      });
  }

  function pauseMusic() {
    bgAudio.pause();
    isPlaying = false;
    musicBtnIcon.textContent = '🔇';
  }

  floatingMusicBtn.addEventListener('click', () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  });

  // ==============================================================
  // Calendar (.ics) Download
  // ==============================================================
  if (downloadIcsBtn) {
    downloadIcsBtn.addEventListener('click', () => {
      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Nikhil & Pranami//Wedding Celebration//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:nikhil-pranami-wedding-2026@celebration',
        'DTSTART:20261211T113000Z',
        'DTEND:20261212T023000Z',
        'SUMMARY:Nikhil & Pranami Wedding Celebration',
        'DESCRIPTION:Join us for the grand wedding celebration of Nikhil and Pranami at Royal Anand Resort & Club. Contact Akhil Shukla: +91 9919892622.',
        'LOCATION:Royal Anand Resort & Club, Kanpur, Uttar Pradesh',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ];
      const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Nikhil_and_Pranami_Wedding.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // ==============================================================
  // 3.C: Sequential IntersectionObserver for Fade In & Slide Up
  // ==============================================================
  const revealElements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));

  // ==============================================================
  // 3.C: Mobile Cinematic Blur on Scroll Past
  // ==============================================================
  const eventSlides = document.querySelectorAll('.event-slide');

  window.addEventListener('scroll', () => {
    // Only execute on mobile <= 900px
    if (window.innerWidth > 900) return;

    const windowHeight = window.innerHeight;

    eventSlides.forEach(slide => {
      const bg = slide.querySelector('.event-bg');
      if (!bg) return;

      const rect = slide.getBoundingClientRect();
      if (rect.top < 0) {
        const scrolledPast = Math.abs(rect.top);
        const ratio = Math.min(scrolledPast / windowHeight, 1);
        const blurPx = Math.round(ratio * 12);
        const opacity = Math.max(0.3, 1 - (ratio * 0.7));

        bg.style.filter = `blur(${blurPx}px)`;
        bg.style.opacity = opacity;
      } else {
        bg.style.filter = 'blur(0px)';
        bg.style.opacity = '1';
      }
    });
  }, { passive: true });

  // ==============================================================
  // 3.E: FAQ Accordion Style (Click to Expand)
  // ==============================================================
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');
  accordionTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      const isAlreadyActive = parent.classList.contains('active');

      document.querySelectorAll('.accordion-item').forEach(item => item.classList.remove('active'));

      if (!isAlreadyActive) {
        parent.classList.add('active');
      }
    });
  });

  // ==============================================================
  // 3.E: RSVP Form with Conditional Dance Options & LocalStorage
  // ==============================================================
  const danceSelect = document.getElementById('rsvp-dance');
  const danceExtra = document.getElementById('dance-extra');
  const songChips = document.querySelectorAll('.song-chips .chip');
  const customSongInput = document.getElementById('rsvp-custom-song');
  const rsvpForm = document.getElementById('rsvp-form');
  const blessingsGrid = document.getElementById('blessings-grid');

  let selectedSongChip = '';

  danceSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Yes') {
      danceExtra.classList.remove('hidden');
    } else {
      danceExtra.classList.add('hidden');
      selectedSongChip = '';
      customSongInput.value = '';
      songChips.forEach(chip => chip.classList.remove('active'));
    }
  });

  songChips.forEach(chip => {
    chip.addEventListener('click', () => {
      songChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedSongChip = chip.getAttribute('data-song');
      customSongInput.value = '';
    });
  });

  const INITIAL_BLESSINGS = [
    {
      id: '1',
      name: 'Dadaji & Dadi',
      song: '',
      message: 'May God bless Nikhil and Pranami with lifelong happiness, patience, and boundless prosperity. Always stay each other\'s strength!',
      time: '2 hours ago'
    },
    {
      id: '2',
      name: 'Aman & Riya (Team Groom)',
      song: 'Gallan Goodiyaan',
      message: 'Can\'t wait to set the stage on fire! Nikhil bhai, party abhi shuru hui hai! Super excited!',
      time: 'Yesterday'
    },
    {
      id: '3',
      name: 'Shweta Bhabhi & Rohit Bhaiya',
      song: 'Bole Chudiyan',
      message: 'Welcome to the family, dear Pranami! Wishing both of you eternal happiness and blessings.',
      time: '2 days ago'
    }
  ];

  function getSavedBlessings() {
    try {
      const stored = localStorage.getItem('nikhil_pranami_blessings');
      return stored ? JSON.parse(stored) : INITIAL_BLESSINGS;
    } catch {
      return INITIAL_BLESSINGS;
    }
  }

  function saveBlessing(entry) {
    const list = getSavedBlessings();
    list.unshift(entry);
    try {
      localStorage.setItem('nikhil_pranami_blessings', JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    renderBlessings();
  }

  function renderBlessings() {
    if (!blessingsGrid) return;
    const list = getSavedBlessings();
    blessingsGrid.innerHTML = '';

    list.forEach(b => {
      const card = document.createElement('div');
      card.className = 'blessing-card';
      card.innerHTML = `
        <h4>${escapeHTML(b.name)}</h4>
        <span style="font-size:0.75rem; color:#A34A3A; font-family:var(--font-sans); display:block; margin-bottom:0.4rem;">${escapeHTML(b.time || 'Recently')}</span>
        ${b.song ? `<div style="font-size:0.85rem; color:#A34A3A; font-family:var(--font-sans); margin-bottom:0.5rem; font-weight:600;">🎶 Track: ${escapeHTML(b.song)}</div>` : ''}
        <p style="font-style: italic; color:#1B3A2F;">"${escapeHTML(b.message)}"</p>
      `;
      blessingsGrid.appendChild(card);
    });
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  renderBlessings();

  // Handle RSVP Submit
  rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameVal = document.getElementById('rsvp-name').value.trim();
    const attendingVal = document.getElementById('rsvp-attending').value;
    const danceVal = document.getElementById('rsvp-dance').value;
    const finalSong = customSongInput.value.trim() || selectedSongChip || (danceVal === 'Yes' ? 'Bollywood Hits' : '');
    const messageVal = document.getElementById('rsvp-message').value.trim() || (attendingVal === 'Yes' ? 'Looking forward to celebrating with you both!' : 'Warmest wishes and blessings for your wedding!');

    saveBlessing({
      id: String(Date.now()),
      name: nameVal,
      song: finalSong,
      message: messageVal,
      time: 'Just now'
    });

    alert('Dhanyavaad! Your RSVP and Blessing have been recorded.');
    rsvpForm.reset();
    danceExtra.classList.add('hidden');
    selectedSongChip = '';
    songChips.forEach(chip => chip.classList.remove('active'));

    const blessingsSection = document.getElementById('blessings');
    if (blessingsSection) {
      blessingsSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
