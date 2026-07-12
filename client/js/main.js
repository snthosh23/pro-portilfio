// Main Client JavaScript - Portfolio page
const API_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
  // Page Loader Animation
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => {
      gsap.to(loader, {
        opacity: 0,
        duration: 0.8,
        onComplete: () => loader.style.display = 'none'
      });
    }, 1000);
  }

  // Track page visit analytic
  fetch(`${API_URL}/api/portfolio/analytics/visit`, { method: 'POST' }).catch(() => {});

  // Initialize features
  initTheme();
  setupMouseFollower();
  setupNavbar();
  loadProfile();
  loadSkills();
  loadExperienceEducation();
  loadProjects();
  loadCertificatesAchievements();
  loadGallery();
  loadBlogs();
  loadTestimonials();
  setupContactForm();
  setupNewsletter();
});

/* -------------------------------------------------------------
   Dynamic Theme Loading
------------------------------------------------------------- */
async function initTheme() {
  try {
    const res = await fetch(`${API_URL}/api/theme`);
    if (!res.ok) throw new Error('Failed to load theme');
    const theme = await res.json();
    applyTheme(theme);
  } catch (error) {
    console.warn('Could not load theme from API. Using stylesheet defaults.', error);
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', theme.primaryColor);
  root.style.setProperty('--secondary-color', theme.secondaryColor);
  root.style.setProperty('--accent-color', theme.accentColor);
  root.style.setProperty('--background-color', theme.backgroundColor);
  root.style.setProperty('--text-color', theme.textColor);
  root.style.setProperty('--button-color', theme.buttonColor);
  root.style.setProperty('--card-color', theme.cardColor);
  root.style.setProperty('--navbar-color', theme.navbarColor);
  root.style.setProperty('--footer-color', theme.footerColor);
  root.style.setProperty('--border-radius', theme.borderRadius);
  root.style.setProperty('--font-family', theme.fontFamily);
  root.style.setProperty('--animation-speed', theme.animationSpeed);

  // Apply glassmorphism rules
  if (theme.glassmorphism) {
    root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.03)');
    root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--glass-blur', '16px');
  } else {
    root.style.setProperty('--glass-bg', theme.cardColor);
    root.style.setProperty('--glass-border', 'transparent');
    root.style.setProperty('--glass-blur', '0px');
  }

  // Adjust GSAP duration scales if speed changes
  gsap.globalTimeline.timeScale(1 / (theme.animationSpeed || 1));
}

/* -------------------------------------------------------------
   UI Interactive Features
------------------------------------------------------------- */
function setupMouseFollower() {
  const follower = document.getElementById('mouse-follower');
  if (!follower) return;

  // Don't enable on mobile touch devices
  if ('ontouchstart' in window) {
    follower.style.display = 'none';
    return;
  }
  
  follower.style.display = 'block';

  document.addEventListener('mousemove', (e) => {
    gsap.to(follower, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.1,
      ease: 'power2.out'
    });
  });

  // Grow bubble on interactive links
  const interactives = document.querySelectorAll('a, button, .clickable, .glass-card, .gallery-item');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => follower.classList.add('hovering'));
    el.addEventListener('mouseleave', () => follower.classList.remove('hovering'));
  });
}

function setupNavbar() {
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    // Add scrolled styling
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active navigation highlighting
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').slice(1) === current) {
        link.classList.add('active');
      }
    });
  });

  // Mobile Menu Toggle
  const toggle = document.querySelector('.menu-toggle');
  const navList = document.querySelector('.nav-links');
  if (toggle && navList) {
    toggle.addEventListener('click', () => {
      navList.classList.toggle('active');
      toggle.classList.toggle('fa-bars');
      toggle.classList.toggle('fa-times');
    });
    
    // Close nav menu when link is clicked
    navLinks.forEach(l => l.addEventListener('click', () => {
      navList.classList.remove('active');
      toggle.classList.add('fa-bars');
      toggle.classList.remove('fa-times');
    }));
  }
}

/* -------------------------------------------------------------
   Dynamic Data Rendering Methods
------------------------------------------------------------- */

// Load Biography and Hero Headers
async function loadProfile() {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/profile`);
    if (!res.ok) throw new Error();
    const profile = await res.json();

    document.title = `${profile.name} | Portfolio`;
    document.querySelectorAll('.profile-name').forEach(el => el.textContent = profile.name);
    document.querySelectorAll('.profile-title').forEach(el => el.textContent = profile.title);
    
    const bioText = document.getElementById('about-bio-text');
    if (bioText) bioText.textContent = profile.bio;

    const aboutIntro = document.getElementById('about-intro-text');
    if (aboutIntro) aboutIntro.textContent = profile.introduction;

    // Contact Details
    const address = document.getElementById('contact-address');
    if (address) address.textContent = profile.address;
    
    document.querySelectorAll('.profile-email').forEach(el => {
      el.textContent = profile.email;
      el.href = `mailto:${profile.email}`;
    });

    const phone = document.getElementById('contact-phone');
    if (phone) {
      phone.textContent = profile.phone;
      phone.href = `tel:${profile.phone}`;
    }
    const whatsapp = document.getElementById('contact-whatsapp');
    if (whatsapp) whatsapp.href = profile.whatsapp || '#';

    // Social Links
    if (profile.socials) {
      Object.keys(profile.socials).forEach(key => {
        const link = document.querySelector(`.social-link-${key}`);
        if (link) link.href = profile.socials[key];
      });
    }

    // Set Profile Photo
    if (profile.photoUrl) {
      const img = document.getElementById('hero-profile-image');
      if (img) img.src = profile.photoUrl;
      const abImg = document.getElementById('about-profile-image');
      if (abImg) abImg.src = profile.photoUrl;
    }

    // Resume Download action
    const resumeBtn = document.getElementById('resume-download-btn');
    if (resumeBtn && profile.resumeUrl) {
      resumeBtn.href = profile.resumeUrl;
      resumeBtn.addEventListener('click', () => {
        fetch(`${API_URL}/api/portfolio/analytics/download`, { method: 'POST' }).catch(() => {});
      });
    }

    // Hero typing text array from database or split titles
    setupTypingText(profile.title);
  } catch (error) {
    console.error('Failed to load profile settings:', error);
  }
}

function setupTypingText(titleStr) {
  const el = document.getElementById('hero-typing-text');
  if (!el) return;
  
  const words = [titleStr, 'Software Architect', 'Creative Visualizer', 'Clean Code Enthusiast'];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      el.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = 100;
    if (isDeleting) typeSpeed /= 2;

    if (!isDeleting && charIndex === currentWord.length) {
      typeSpeed = 1500; // Pause at end of word
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typeSpeed = 500;
    }

    setTimeout(type, typeSpeed);
  }

  type();
}

// Load Skills Categories & Percentage Visualizer
async function loadSkills() {
  const container = document.getElementById('skills-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/skills`);
    if (!res.ok) throw new Error();
    const skills = await res.json();

    if (skills.length === 0) {
      container.innerHTML = `<p class="text-center opacity-60">No skills records found. Add them in the Admin Panel.</p>`;
      return;
    }

    // Group skills by category
    const categories = {};
    skills.forEach(skill => {
      const cat = skill.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(skill);
    });

    let html = '';
    Object.keys(categories).forEach(cat => {
      html += `
        <div class="skills-category-section">
          <h3 class="skills-category-title">${cat}</h3>
          <div class="skills-grid">
      `;

      categories[cat].forEach(skill => {
        html += `
          <div class="glass-card skill-card">
            <div class="skill-icon-box">
              <i class="${skill.icon || 'fas fa-code'}"></i>
            </div>
            <div class="skill-info">
              <div class="skill-header">
                <span>${skill.name}</span>
                <span>${skill.percentage}%</span>
              </div>
              <div class="skill-progress-bg">
                <div class="skill-progress-bar" data-width="${skill.percentage}"></div>
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Trigger skills bar animation on scroll reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bars = entry.target.querySelectorAll('.skill-progress-bar');
          bars.forEach(bar => {
            bar.style.width = bar.getAttribute('data-width') + '%';
          });
        }
      });
    }, { threshold: 0.1 });

    observer.observe(container);

  } catch (error) {
    console.error('Error rendering skills:', error);
  }
}

// Load Education & Experience timelines
async function loadExperienceEducation() {
  const expList = document.getElementById('experience-timeline-list');
  const eduList = document.getElementById('education-timeline-list');

  try {
    // 1. Experience
    if (expList) {
      const expRes = await fetch(`${API_URL}/api/portfolio/experience`);
      const experience = await expRes.json();
      
      if (experience.length === 0) {
        expList.innerHTML = `<p class="opacity-60">No experience records found.</p>`;
      } else {
        expList.innerHTML = experience.map(exp => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="glass-card timeline-card">
              <div class="timeline-date">${exp.timeline || exp.year}</div>
              <h4>${exp.position}</h4>
              <div class="timeline-subtitle">${exp.company}</div>
              <p>${exp.responsibilities ? (Array.isArray(exp.responsibilities) ? exp.responsibilities.join('<br>• ') : exp.responsibilities) : exp.description || ''}</p>
            </div>
          </div>
        `).join('');
      }
    }

    // 2. Education
    if (eduList) {
      const eduRes = await fetch(`${API_URL}/api/portfolio/education`);
      const education = await eduRes.json();
      
      if (education.length === 0) {
        eduList.innerHTML = `<p class="opacity-60">No education records found.</p>`;
      } else {
        eduList.innerHTML = education.map(edu => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="glass-card timeline-card">
              <div class="timeline-date">${edu.year}</div>
              <h4>${edu.degree}</h4>
              <div class="timeline-subtitle">${edu.college || edu.university}</div>
              <p>Score: <strong>${edu.cgpa}</strong><br>${edu.description || ''}</p>
            </div>
          </div>
        `).join('');
      }
    }

  } catch (error) {
    console.error('Timeline fetch error:', error);
  }
}

// Load Projects and build dynamic search/filter operations
async function loadProjects() {
  const grid = document.getElementById('portfolio-grid');
  const filterWrap = document.getElementById('portfolio-filters');
  if (!grid) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/projects`);
    const projects = await res.json();

    if (projects.length === 0) {
      grid.innerHTML = `<p class="text-center opacity-60">No projects added yet.</p>`;
      return;
    }

    // 1. Build Unique Category Filter buttons
    const categories = ['All', ...new Set(projects.map(p => p.category))];
    if (filterWrap) {
      filterWrap.innerHTML = categories.map((cat, i) => `
        <button class="filter-btn ${i === 0 ? 'active' : ''}" data-filter="${cat}">${cat}</button>
      `).join('');
      setupFiltersAndSearch(projects);
    }

    renderProjects(projects);

  } catch (error) {
    console.error('Projects list fetch error:', error);
  }
}

function renderProjects(projectsList) {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  grid.innerHTML = projectsList.map(project => {
    const techTags = Array.isArray(project.technologies) 
      ? project.technologies 
      : (typeof project.technologies === 'string' ? project.technologies.split(',') : []);

    return `
      <div class="glass-card portfolio-card project-item" data-category="${project.category}">
        <div class="portfolio-image">
          ${project.video ? `
            <video src="${project.video}" muted loop autoplay playsinline></video>
          ` : `
            <img src="${project.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600'}" alt="${project.title}">
          `}
          <div class="portfolio-overlay">
            ${project.github ? `<a href="${project.github}" target="_blank" class="portfolio-overlay-btn" title="GitHub Source"><i class="fab fa-github"></i></a>` : ''}
            ${project.live ? `<a href="${project.live}" target="_blank" class="portfolio-overlay-btn" title="Live Preview"><i class="fas fa-external-link-alt"></i></a>` : ''}
          </div>
        </div>
        <div class="portfolio-info">
          <span class="project-category">${project.category}</span>
          <h3>${project.title}</h3>
          <p>${project.description || ''}</p>
          <div class="project-tech-tags">
            ${techTags.map(tag => `<span class="project-tag">${tag.trim()}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupFiltersAndSearch(allProjects) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('portfolio-search-input');
  
  let activeFilter = 'All';
  let searchQuery = '';

  function filterProjects() {
    const filtered = allProjects.filter(p => {
      const matchesCategory = activeFilter === 'All' || p.category === activeFilter;
      const matchesSearch = p.title.toLowerCase().includes(searchQuery) ||
                            (p.description || '').toLowerCase().includes(searchQuery) ||
                            (p.category || '').toLowerCase().includes(searchQuery) ||
                            (p.technologies || '').toString().toLowerCase().includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
    renderProjects(filtered);
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      filterProjects();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      filterProjects();
    });
  }
}

// Load Certificates and Achievements
async function loadCertificatesAchievements() {
  const certGrid = document.getElementById('certs-grid');
  const achGrid = document.getElementById('achievements-grid');

  try {
    // Certificates
    if (certGrid) {
      const res = await fetch(`${API_URL}/api/portfolio/certificates`);
      const certs = await res.json();
      if (certs.length === 0) {
        certGrid.innerHTML = '<p class="opacity-60">No certificates uploaded.</p>';
      } else {
        certGrid.innerHTML = certs.map(cert => `
          <div class="glass-card cert-card">
            ${cert.image ? `<img src="${cert.image}" alt="${cert.name}" class="cert-image">` : ''}
            <h4>${cert.name}</h4>
            <div class="cert-org">${cert.organization} | <small>${cert.date || ''}</small></div>
            <p>${cert.description || ''}</p>
            ${cert.pdf ? `<a href="${cert.pdf}" target="_blank" class="btn btn-secondary mt-3" style="padding: 6px 14px; font-size: 0.85rem;"><i class="far fa-file-pdf"></i> View Certificate PDF</a>` : ''}
          </div>
        `).join('');
      }
    }

    // Achievements
    if (achGrid) {
      const res = await fetch(`${API_URL}/api/portfolio/achievements`);
      const achs = await res.json();
      if (achs.length === 0) {
        achGrid.innerHTML = '<p class="opacity-60">No achievements recorded.</p>';
      } else {
        achGrid.innerHTML = achs.map(ach => `
          <div class="glass-card cert-card">
            ${ach.image ? `<img src="${ach.image}" alt="${ach.title}" class="cert-image">` : ''}
            <h4>${ach.title || ach.awardName}</h4>
            <div class="cert-org">${ach.organization} | <small>${ach.year || ''}</small></div>
            <p>${ach.description || ''}</p>
          </div>
        `).join('');
      }
    }
  } catch (e) {
    console.error('Cert/Achievement error:', e);
  }
}

// Load Gallery Grid & Lightbox triggers
async function loadGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/gallery`);
    const gallery = await res.json();

    if (gallery.length === 0) {
      grid.innerHTML = '<p class="opacity-60 text-center">Gallery is empty.</p>';
      return;
    }

    grid.innerHTML = gallery.map(item => `
      <div class="gallery-item" data-url="${item.url}" data-type="${item.type || 'image'}">
        ${item.type === 'video' ? `
          <video src="${item.url}" muted></video>
        ` : `
          <img src="${item.url}" alt="${item.category || 'Portfolio item'}">
        `}
        <div class="gallery-overlay">
          <i class="${item.type === 'video' ? 'fas fa-play' : 'fas fa-expand'}"></i>
        </div>
      </div>
    `).join('');

    setupLightbox();

  } catch (error) {
    console.error('Gallery fetch error:', error);
  }
}

function setupLightbox() {
  const items = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox-modal');
  const container = document.getElementById('lightbox-content-container');
  const close = document.getElementById('lightbox-close');

  if (!lightbox) return;

  items.forEach(item => {
    item.addEventListener('click', () => {
      const url = item.getAttribute('data-url');
      const type = item.getAttribute('data-type');

      container.innerHTML = '';
      if (type === 'video') {
        container.innerHTML = `<video src="${url}" controls autoplay class="lightbox-content"></video>`;
      } else {
        container.innerHTML = `<img src="${url}" class="lightbox-content">`;
      }
      lightbox.style.display = 'flex';
    });
  });

  close.addEventListener('click', () => {
    lightbox.style.display = 'none';
    container.innerHTML = '';
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.style.display = 'none';
      container.innerHTML = '';
    }
  });
}

// Load Blog Card listings
async function loadBlogs() {
  const grid = document.getElementById('blogs-grid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/blogs`);
    const blogs = await res.json();

    const published = blogs.filter(b => b.status === 'published');

    if (published.length === 0) {
      grid.innerHTML = '<p class="opacity-60 text-center col-span-3">No articles published yet.</p>';
      return;
    }

    grid.innerHTML = published.slice(0, 3).map(blog => `
      <div class="glass-card blog-card">
        <img src="${blog.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600'}" alt="${blog.title}" class="blog-cover">
        <div class="blog-body">
          <span class="blog-date">${new Date(blog.date || blog.createdAt).toLocaleDateString()}</span>
          <h3><a href="/blog-detail.html?id=${blog.id}">${blog.title}</a></h3>
          <p class="blog-desc">${stripHtml(blog.content || '').substring(0, 120)}...</p>
          <a href="/blog-detail.html?id=${blog.id}" class="blog-link">Read Full Post <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Blogs fetch error:', error);
  }
}

function stripHtml(html) {
  let tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// Load Client Testimonial Slider carousel
async function loadTestimonials() {
  const track = document.getElementById('testimonial-track');
  const dotWrap = document.getElementById('testimonial-dots');
  if (!track) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/testimonials`);
    const testimonials = await res.json();

    if (testimonials.length === 0) {
      track.innerHTML = '<p class="opacity-60 text-center w-full">Client feedback will be displayed here.</p>';
      return;
    }

    track.innerHTML = testimonials.map(t => `
      <div class="testimonial-slide">
        <div class="glass-card testimonial-box">
          <img src="${t.photo || 'https://randomuser.me/api/portraits/men/32.jpg'}" alt="${t.client}" class="testimonial-photo">
          <div class="testimonial-rating">
            ${Array.from({ length: t.rating || 5 }).map(() => '<i class="fas fa-star"></i>').join('')}
          </div>
          <p class="testimonial-review">"${t.review}"</p>
          <h4 class="testimonial-author">${t.client}</h4>
          <span class="testimonial-company">${t.company || ''}</span>
        </div>
      </div>
    `).join('');

    // Setup Dots
    if (dotWrap) {
      dotWrap.innerHTML = testimonials.map((_, idx) => `
        <span class="slider-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
      `).join('');
    }

    setupSlider();

  } catch (error) {
    console.error('Testimonials slider error:', error);
  }
}

function setupSlider() {
  const track = document.getElementById('testimonial-track');
  const dots = document.querySelectorAll('.slider-dot');
  const slides = document.querySelectorAll('.testimonial-slide');
  if (slides.length === 0) return;

  let currentIdx = 0;

  function moveToSlide(idx) {
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach(d => d.classList.remove('active'));
    if (dots[idx]) dots[idx].classList.add('active');
    currentIdx = idx;
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index'));
      moveToSlide(idx);
    });
  });

  // Auto rotate slide every 8s
  setInterval(() => {
    let next = (currentIdx + 1) % slides.length;
    moveToSlide(next);
  }, 8000);
}

/* -------------------------------------------------------------
   Contact Portal Submissions
------------------------------------------------------------- */
function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    const data = {
      name: document.getElementById('form-name').value,
      email: document.getElementById('form-email').value,
      subject: document.getElementById('form-subject').value,
      message: document.getElementById('form-message').value
    };

    try {
      const res = await fetch(`${API_URL}/api/portfolio/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      
      if (res.ok) {
        showToast('Message sent successfully! Thank you.', 'success');
        form.reset();
      } else {
        showToast(result.error || 'Failed to send message', 'error');
      }
    } catch (e) {
      showToast('Connection error sending message.', 'error');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

function setupNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
      const res = await fetch(`${API_URL}/api/portfolio/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value })
      });
      const result = await res.json();
      if (res.ok) {
        showToast('Subscribed to newsletter list!', 'success');
        emailInput.value = '';
      } else {
        showToast(result.error || 'Failed to subscribe', 'error');
      }
    } catch (e) {
      showToast('Error subscribing to list', 'error');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}

// Toast alerts utility
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}
