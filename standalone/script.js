// script.js - Nikhil & Pranami Wedding Website

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const bgAudio = document.getElementById('bg-music');
  const floatingMusicBtn = document.getElementById('floating-music-btn');
  const musicBtnIcon = document.getElementById('music-btn-icon');
  const downloadIcsBtn = document.getElementById('download-ics-btn');

  let isPlaying = false;

  // Try autoplay, then retry on the first interaction if the browser blocks it.
  playMusic();

  const handleFirstInteraction = (event) => {
    window.removeEventListener('click', handleFirstInteraction);
    window.removeEventListener('touchstart', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
    if (event.target instanceof Element && event.target.closest('#floating-music-btn')) {
      return;
    }
    playMusic();
  };

  window.addEventListener('click', handleFirstInteraction, { passive: true });
  window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
  window.addEventListener('keydown', handleFirstInteraction, { passive: true });

  function playMusic() {
    bgAudio.play()
      .then(() => {
        isPlaying = true;
        musicBtnIcon.textContent = '🔊';
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          isPlaying = false;
          musicBtnIcon.textContent = '🔇';
          return;
        }
        console.error('Unable to play wedding music:', error);
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

  // Story Video Audio sync & Play Overlay
  const storyVideo = document.getElementById('our-story-video');
  const videoPlayOverlay = document.getElementById('video-play-overlay');

  if (storyVideo) {
    let wasMusicPlayingBeforeVideo = false;

    if (videoPlayOverlay) {
      videoPlayOverlay.addEventListener('click', () => {
        storyVideo.play().catch((err) => console.warn('Video play error:', err));
      });
    }

    storyVideo.addEventListener('play', () => {
      if (videoPlayOverlay) {
        videoPlayOverlay.classList.add('hidden');
      }
      if (isPlaying) {
        wasMusicPlayingBeforeVideo = true;
        pauseMusic();
      }
    });

    storyVideo.addEventListener('pause', () => {
      if (videoPlayOverlay) {
        videoPlayOverlay.classList.remove('hidden');
      }
      if (wasMusicPlayingBeforeVideo) {
        playMusic();
        wasMusicPlayingBeforeVideo = false;
      }
    });

    storyVideo.addEventListener('ended', () => {
      if (videoPlayOverlay) {
        videoPlayOverlay.classList.remove('hidden');
      }
      if (wasMusicPlayingBeforeVideo) {
        playMusic();
        wasMusicPlayingBeforeVideo = false;
      }
    });
  }

  // ==============================================================
  // Calendar (.ics & Google Calendar) Direct Action
  // ==============================================================
  const heroDateBtn = document.getElementById('hero-date-btn');
  const googleCalendarUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Nikhil+%26+Pranami+Wedding+Celebration&dates=20261211T113000Z/20261212T023000Z&details=Celebrate+the+wedding+of+Nikhil+and+Pranami+at+Royal+Anand+Resort+%26+Club.+Contact+Akhil+Shukla:+9919892622&location=Royal+Anand+Resort+%26+Club%2C+Kanpur%2C+Uttar+Pradesh';

  if (heroDateBtn) {
    heroDateBtn.style.cursor = 'pointer';
    heroDateBtn.addEventListener('click', () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS && downloadIcsBtn) {
        downloadIcsBtn.click();
      } else {
        window.open(googleCalendarUrl, '_blank');
      }
    });
  }

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

  function getSavedBlessings() {
    try {
      const stored = localStorage.getItem('nikhil_pranami_blessings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.filter(b => b.id !== '1' && b.id !== '2' && b.id !== '3');
      }
      return [];
    } catch {
      return [];
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

    if (list.length === 0) {
      blessingsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem 1rem; background: #FCF8F5; border: 1px dashed rgba(212, 163, 115, 0.6); border-radius: 1rem; max-width: 450px; margin: 0 auto;">
          <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">💌</div>
          <h4 style="font-family: var(--font-serif); font-size: 1.4rem; color: #1B3A2F; margin-bottom: 0.5rem;">Be the First to Send a Blessing!</h4>
          <p style="font-family: var(--font-sans); font-size: 0.875rem; color: rgba(27, 58, 47, 0.7); margin-bottom: 1rem;">No wishes have been posted yet. Submit the RSVP form to send your warm wishes for Nikhil & Pranami.</p>
          <a href="#rsvp" class="rsvp-btn" style="display: inline-block; padding: 0.6rem 1.25rem; font-size: 0.75rem; text-decoration: none;">Write a Blessing</a>
        </div>
      `;
      return;
    }

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
