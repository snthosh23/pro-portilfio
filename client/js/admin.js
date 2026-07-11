// Admin Control Panel Logic
const API_URL = window.location.origin;

// State management
let currentActiveTab = 'dashboard';
let visitorChartInstance = null;
let downloadChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Guard Route: Redirect if not logged in
  await checkAuthAndRedirect();

  // Active user display
  const token = getToken();
  if (token) {
    try {
      const decoded = jwt_decode(token); // Library loaded via CDN in admin-dashboard.html
      const emailEl = document.getElementById('admin-display-email');
      if (emailEl && decoded) emailEl.textContent = decoded.email;
    } catch (e) {
      // fallback
    }
  }

  // Dashboard initialization
  initSidebar();
  loadActiveTabContent();
  setupAIModule();
  setupThemeCustomizer();

  // Global modal close events
  document.querySelectorAll('.modal-close, .modal-cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    });
  });

  // Logout trigger
  const logBtn = document.getElementById('admin-logout-btn');
  if (logBtn) logBtn.addEventListener('click', logout);
});

// Decode JWT token helper fallback if library fails to load
function jwt_decode(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/* -------------------------------------------------------------
   Navigation Control
------------------------------------------------------------- */
function initSidebar() {
  const links = document.querySelectorAll('.sidebar-menu li');
  links.forEach(li => {
    const anchor = li.querySelector('a');
    if (!anchor) return;

    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = anchor.getAttribute('href').slice(1);
      
      links.forEach(l => l.classList.remove('active'));
      li.classList.add('active');
      
      // Update UI title header
      document.getElementById('admin-header-title').textContent = anchor.textContent.trim();
      
      currentActiveTab = tab;
      loadActiveTabContent();
    });
  });
}

function loadActiveTabContent() {
  // Hide all sections
  document.querySelectorAll('.tab-content').forEach(sect => sect.classList.remove('active'));
  
  // Show target
  const target = document.getElementById(`tab-${currentActiveTab}`);
  if (target) target.classList.add('active');

  // Load content according to active tabs
  switch (currentActiveTab) {
    case 'dashboard':
      loadMetricsAndCharts();
      break;
    case 'profile':
      loadProfileDetails();
      break;
    case 'skills':
      renderSkillsList();
      break;
    case 'education':
      renderEducationList();
      break;
    case 'experience':
      renderExperienceList();
      break;
    case 'projects':
      renderProjectsList();
      break;
    case 'achievements':
      renderAchievementsList();
      break;
    case 'certifications':
      renderCertificationsList();
      break;
    case 'gallery':
      renderGalleryList();
      break;
    case 'blogs':
      renderBlogsList();
      break;
    case 'testimonials':
      renderTestimonialsList();
      break;
    case 'contact':
      renderMessagesList();
      break;
    case 'theme':
      loadThemeCustomizerInputs();
      break;
  }
}

/* -------------------------------------------------------------
   Dashboard Metrics & Charts (Chart.js)
------------------------------------------------------------- */
async function loadMetricsAndCharts() {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/analytics`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error();
    const analytics = await res.json();

    // Set numbers
    document.getElementById('metric-visitors').textContent = analytics.visitors || 0;
    document.getElementById('metric-downloads').textContent = analytics.downloads || 0;
    document.getElementById('metric-messages').textContent = analytics.messages || 0;
    document.getElementById('metric-subscribers').textContent = analytics.subscribers || 0;

    // Load Charts
    renderCharts(analytics);
  } catch (error) {
    console.error('Failed to load metrics:', error);
  }
}

function renderCharts(analytics) {
  // Helper dates array (last 7 days labels)
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#6366f1';
  const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim() || '#a855f7';

  // 1. Visitors Chart
  const vCtx = document.getElementById('visitors-chart');
  if (vCtx) {
    if (visitorChartInstance) visitorChartInstance.destroy();
    visitorChartInstance = new Chart(vCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Page Visitors',
          data: analytics.visitorHistory || [10, 15, 20, 25, 18, 30, 22],
          borderColor: primaryColor,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // 2. Downloads Chart
  const dCtx = document.getElementById('downloads-chart');
  if (dCtx) {
    if (downloadChartInstance) downloadChartInstance.destroy();
    downloadChartInstance = new Chart(dCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Resume Downloads',
          data: analytics.downloadHistory || [2, 5, 8, 4, 3, 10, 13],
          backgroundColor: secondaryColor,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

/* -------------------------------------------------------------
   Profile Management
------------------------------------------------------------- */
async function loadProfileDetails() {
  const form = document.getElementById('admin-profile-form');
  if (!form) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/profile`);
    const profile = await res.json();

    document.getElementById('profile-name').value = profile.name || '';
    document.getElementById('profile-title').value = profile.title || '';
    document.getElementById('profile-bio').value = profile.bio || '';
    document.getElementById('profile-intro').value = profile.introduction || '';
    document.getElementById('profile-email').value = profile.email || '';
    document.getElementById('profile-phone').value = profile.phone || '';
    document.getElementById('profile-address').value = profile.address || '';
    document.getElementById('profile-whatsapp').value = profile.whatsapp || '';
    
    if (profile.socials) {
      document.getElementById('profile-github').value = profile.socials.github || '';
      document.getElementById('profile-linkedin').value = profile.socials.linkedin || '';
      document.getElementById('profile-twitter').value = profile.socials.twitter || '';
    }

    // Photo and Resume indicators
    const photoPrev = document.getElementById('photo-preview-img');
    if (photoPrev && profile.photoUrl) photoPrev.src = profile.photoUrl;

    const resumePrev = document.getElementById('resume-preview-link');
    if (resumePrev && profile.resumeUrl) {
      resumePrev.href = profile.resumeUrl;
      resumePrev.style.display = 'inline-flex';
    } else if (resumePrev) {
      resumePrev.style.display = 'none';
    }

  } catch (error) {
    console.error('Failed to load profile details:', error);
  }

  // Register Profile submit event once
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const formData = new FormData();
    formData.append('name', document.getElementById('profile-name').value);
    formData.append('title', document.getElementById('profile-title').value);
    formData.append('bio', document.getElementById('profile-bio').value);
    formData.append('introduction', document.getElementById('profile-intro').value);
    formData.append('email', document.getElementById('profile-email').value);
    formData.append('phone', document.getElementById('profile-phone').value);
    formData.append('address', document.getElementById('profile-address').value);
    formData.append('whatsapp', document.getElementById('profile-whatsapp').value);

    const socials = {
      github: document.getElementById('profile-github').value,
      linkedin: document.getElementById('profile-linkedin').value,
      twitter: document.getElementById('profile-twitter').value
    };
    formData.append('socials', JSON.stringify(socials));

    const photoInput = document.getElementById('profile-photo-file');
    const resumeInput = document.getElementById('profile-resume-file');
    
    if (photoInput.files[0]) formData.append('photo', photoInput.files[0]);
    if (resumeInput.files[0]) formData.append('resume', resumeInput.files[0]);

    try {
      const res = await fetch(`${API_URL}/api/portfolio/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });

      if (res.ok) {
        showToast('Profile settings saved successfully!');
        loadProfileDetails();
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to save profile', 'error');
      }
    } catch (e) {
      showToast('Connection error saving profile.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check"></i> Update Profile';
    }
  };
}

// Photo preview on choose file
window.previewProfilePhoto = function(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('photo-preview-img').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

/* -------------------------------------------------------------
   Theme Customizer (Live color variables & configurations)
------------------------------------------------------------- */
function setupThemeCustomizer() {
  const form = document.getElementById('theme-customizer-form');
  if (!form) return;

  // Real-time input updates trigger instant style mapping
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => {
      const liveTheme = gatherThemeInputs();
      applyTheme(liveTheme); // Updates variables instantly in DOM
    });
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    const theme = gatherThemeInputs();
    
    try {
      const res = await fetch(`${API_URL}/api/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(theme)
      });
      if (res.ok) {
        showToast('Website style theme configurations updated!');
      } else {
        showToast('Failed to save theme settings', 'error');
      }
    } catch (error) {
      showToast('Connection error saving theme', 'error');
    } finally {
      btn.disabled = false;
    }
  };
}

async function loadThemeCustomizerInputs() {
  try {
    const res = await fetch(`${API_URL}/api/theme`);
    const theme = await res.json();

    document.getElementById('theme-primary').value = theme.primaryColor;
    document.getElementById('theme-secondary').value = theme.secondaryColor;
    document.getElementById('theme-accent').value = theme.accentColor;
    document.getElementById('theme-bg').value = theme.backgroundColor;
    document.getElementById('theme-text').value = theme.textColor;
    document.getElementById('theme-button').value = theme.buttonColor;
    document.getElementById('theme-card').value = theme.cardColor;
    document.getElementById('theme-navbar').value = theme.navbarColor;
    document.getElementById('theme-footer').value = theme.footerColor;
    document.getElementById('theme-radius').value = theme.borderRadius;
    document.getElementById('theme-font').value = theme.fontFamily;
    document.getElementById('theme-mode').value = theme.themeMode;
    document.getElementById('theme-glassmorphism').checked = theme.glassmorphism;
    document.getElementById('theme-speed').value = theme.animationSpeed;
    
  } catch (error) {
    console.error('Failed to load theme settings inside Customizer:', error);
  }
}

function gatherThemeInputs() {
  return {
    primaryColor: document.getElementById('theme-primary').value,
    secondaryColor: document.getElementById('theme-secondary').value,
    accentColor: document.getElementById('theme-accent').value,
    backgroundColor: document.getElementById('theme-bg').value,
    textColor: document.getElementById('theme-text').value,
    buttonColor: document.getElementById('theme-button').value,
    cardColor: document.getElementById('theme-card').value,
    navbarColor: document.getElementById('theme-navbar').value,
    footerColor: document.getElementById('theme-footer').value,
    borderRadius: document.getElementById('theme-radius').value,
    fontFamily: document.getElementById('theme-font').value,
    themeMode: document.getElementById('theme-mode').value,
    glassmorphism: document.getElementById('theme-glassmorphism').checked,
    animationSpeed: parseFloat(document.getElementById('theme-speed').value)
  };
}

/* -------------------------------------------------------------
   AI Assistant Chatbot Core Logic
------------------------------------------------------------- */
function setupAIModule() {
  const trigger = document.getElementById('chatbot-trigger');
  const panel = document.getElementById('ai-assistant-sidebar');
  const mainWrap = document.getElementById('admin-main-wrapper');
  const close = document.getElementById('ai-close');

  if (!panel || !trigger) return;

  // Toggle chatbot slider panel
  trigger.addEventListener('click', () => {
    panel.classList.toggle('active');
    mainWrap.classList.toggle('chat-open');
  });

  close.addEventListener('click', () => {
    panel.classList.remove('active');
    mainWrap.classList.remove('chat-open');
  });

  // Sending message action
  const sendBtn = document.getElementById('ai-send-btn');
  const aiInput = document.getElementById('ai-chat-input');
  
  const sendMessage = async () => {
    const text = aiInput.value.trim();
    if (!text) return;
    
    appendChatMessage(text, 'user');
    aiInput.value = '';
    
    const loadingBubble = appendChatMessage('<i class="fas fa-spinner fa-spin"></i> Assistant is typing...', 'ai');
    
    try {
      const type = document.getElementById('ai-prompt-type')?.value || 'general';
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ prompt: text, type: type })
      });
      const data = await res.json();
      
      loadingBubble.remove();
      
      if (res.ok) {
        appendChatMessage(data.response, 'ai', true);
      } else {
        appendChatMessage(`**Error**: ${data.error || 'AI generation failed.'}`, 'ai');
      }
    } catch (e) {
      loadingBubble.remove();
      appendChatMessage('**Connection Error**: Failed to reach AI service.', 'ai');
    }
  };

  sendBtn.addEventListener('click', sendMessage);
  aiInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Prompt Templates shortcut clicks
  document.querySelectorAll('.shortcut-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      const type = chip.getAttribute('data-type');
      
      aiInput.value = prompt;
      const select = document.getElementById('ai-prompt-type');
      if (select) select.value = type;
      aiInput.focus();
    });
  });

  // Clear Chat Log
  const clearBtn = document.getElementById('ai-clear-chat');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const history = document.getElementById('ai-chat-history');
      if (history) {
        history.innerHTML = `
          <div class="chat-bubble ai">
            Hello! I am your enterprise-grade portfolio AI assistant. How can I help you construct or refine your portfolio content today?
          </div>
        `;
      }
    });
  }
}

function appendChatMessage(content, sender, isMarkdown = false) {
  const history = document.getElementById('ai-chat-history');
  if (!history) return null;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  
  if (sender === 'ai' && isMarkdown) {
    bubble.innerHTML = compileMarkdown(content);
    
    // Add interaction buttons for AI response bubble
    const actions = document.createElement('div');
    actions.className = 'chat-bubble-actions';
    actions.innerHTML = `
      <button class="bubble-action-btn copy-btn"><i class="far fa-copy"></i> Copy</button>
    `;
    
    actions.querySelector('.copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(content).then(() => {
        showToast('AI response text copied to clipboard!');
      });
    });
    bubble.appendChild(actions);
  } else {
    bubble.innerHTML = content.replace(/\n/g, '<br>');
  }

  history.appendChild(bubble);
  history.scrollTop = history.scrollHeight;
  return bubble;
}

// High-fidelity Markdown compiler parser for AI chat bubbles
function compileMarkdown(md) {
  let html = md;
  // Headings
  html = html.replace(/### (.*?)\n/g, '<h4>$1</h4>');
  html = html.replace(/## (.*?)\n/g, '<h3>$1</h3>');
  html = html.replace(/# (.*?)\n/g, '<h2>$1</h2>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Lists
  html = html.replace(/^\* (.*?)$/gm, '• $1<br>');
  html = html.replace(/^- (.*?)$/gm, '• $1<br>');
  
  // Quotes
  html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
  
  // Code Blocks
  html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  return html;
}

/* -------------------------------------------------------------
   Generic List Rendering CRUD Modules
------------------------------------------------------------- */

// Helper to open edit overlays
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

// Handle generic record deletes
async function deleteRecord(collectionName, id, callback) {
  if (!confirm('Are you sure you want to delete this record?')) return;
  
  try {
    const res = await fetch(`${API_URL}/api/portfolio/${collectionName}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (res.ok) {
      showToast('Record deleted successfully');
      callback();
    } else {
      showToast('Failed to delete record', 'error');
    }
  } catch (error) {
    showToast('Network error during delete action', 'error');
  }
}

/* --- 1. Skills CRUD Module --- */
async function renderSkillsList() {
  const list = document.getElementById('skills-crud-list');
  if (!list) return;
  
  try {
    const res = await fetch(`${API_URL}/api/portfolio/skills`);
    const skills = await res.json();

    list.innerHTML = skills.map(skill => `
      <tr>
        <td><strong>${skill.name}</strong></td>
        <td>${skill.category}</td>
        <td>
          <div class="skill-progress-bg" style="width: 120px;">
            <div class="skill-progress-bar" style="width: ${skill.percentage}%; height: 6px;"></div>
          </div>
          <small>${skill.percentage}%</small>
        </td>
        <td><i class="${skill.icon || 'fas fa-code'}"></i></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editSkillModal('${skill.id}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" onclick="deleteSkill('${skill.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

window.addSkillModal = function() {
  const form = document.getElementById('skill-modal-form');
  form.reset();
  document.getElementById('skill-modal-title').textContent = 'Add Skill';
  document.getElementById('skill-doc-id').value = '';
  openModal('skill-modal');
};

window.editSkillModal = async function(id) {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/skills/${id}`);
    const skill = await res.json();
    
    document.getElementById('skill-doc-id').value = skill.id;
    document.getElementById('skill-name').value = skill.name;
    document.getElementById('skill-category').value = skill.category;
    document.getElementById('skill-percentage').value = skill.percentage;
    document.getElementById('skill-icon').value = skill.icon;
    
    document.getElementById('skill-modal-title').textContent = 'Edit Skill';
    openModal('skill-modal');
  } catch (e) {
    showToast('Failed to load skill details', 'error');
  }
};

window.saveSkill = async function(e) {
  const form = document.getElementById('skill-modal-form');
  const id = document.getElementById('skill-doc-id').value;
  
  const data = {
    name: document.getElementById('skill-name').value,
    category: document.getElementById('skill-category').value,
    percentage: parseInt(document.getElementById('skill-percentage').value),
    icon: document.getElementById('skill-icon').value
  };

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/api/portfolio/skills/${id}` : `${API_URL}/api/portfolio/skills`;

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      showToast('Skill saved successfully!');
      document.getElementById('skill-modal').classList.remove('active');
      renderSkillsList();
    } else {
      showToast('Failed to save skill', 'error');
    }
  } catch (error) {
    showToast('Error saving skill', 'error');
  }
};

window.deleteSkill = function(id) {
  deleteRecord('skills', id, renderSkillsList);
};

/* --- 2. Education Timeline CRUD Module --- */
async function renderEducationList() {
  const list = document.getElementById('education-crud-list');
  if (!list) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/education`);
    const education = await res.json();

    list.innerHTML = education.map(edu => `
      <tr>
        <td><strong>${edu.degree}</strong></td>
        <td>${edu.college || edu.university}</td>
        <td>${edu.year}</td>
        <td>${edu.cgpa}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editEducationModal('${edu.id}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" onclick="deleteEducation('${edu.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

window.addEducationModal = function() {
  const form = document.getElementById('education-modal-form');
  form.reset();
  document.getElementById('education-modal-title').textContent = 'Add Education Record';
  document.getElementById('education-doc-id').value = '';
  openModal('education-modal');
};

window.editEducationModal = async function(id) {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/education/${id}`);
    const edu = await res.json();
    
    document.getElementById('education-doc-id').value = edu.id;
    document.getElementById('edu-degree').value = edu.degree;
    document.getElementById('edu-college').value = edu.college || edu.university || '';
    document.getElementById('edu-year').value = edu.year;
    document.getElementById('edu-cgpa').value = edu.cgpa;
    document.getElementById('edu-desc').value = edu.description || '';
    
    document.getElementById('education-modal-title').textContent = 'Edit Education Record';
    openModal('education-modal');
  } catch (e) {
    showToast('Failed to load education details', 'error');
  }
};

window.saveEducation = async function() {
  const id = document.getElementById('education-doc-id').value;
  
  const data = {
    degree: document.getElementById('edu-degree').value,
    college: document.getElementById('edu-college').value,
    year: document.getElementById('edu-year').value,
    cgpa: document.getElementById('edu-cgpa').value,
    description: document.getElementById('edu-desc').value
  };

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/api/portfolio/education/${id}` : `${API_URL}/api/portfolio/education`;

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      showToast('Education record saved!');
      document.getElementById('education-modal').classList.remove('active');
      renderEducationList();
    } else {
      showToast('Failed to save education record', 'error');
    }
  } catch (error) {
    showToast('Error saving education', 'error');
  }
};

window.deleteEducation = function(id) {
  deleteRecord('education', id, renderEducationList);
};

/* --- 3. Experience Timeline CRUD Module --- */
async function renderExperienceList() {
  const list = document.getElementById('experience-crud-list');
  if (!list) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/experience`);
    const experience = await res.json();

    list.innerHTML = experience.map(exp => `
      <tr>
        <td><strong>${exp.position}</strong></td>
        <td>${exp.company}</td>
        <td>${exp.timeline || exp.year}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editExperienceModal('${exp.id}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" onclick="deleteExperience('${exp.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

window.addExperienceModal = function() {
  const form = document.getElementById('experience-modal-form');
  form.reset();
  document.getElementById('experience-modal-title').textContent = 'Add Work Experience';
  document.getElementById('experience-doc-id').value = '';
  openModal('experience-modal');
};

window.editExperienceModal = async function(id) {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/experience/${id}`);
    const exp = await res.json();
    
    document.getElementById('experience-doc-id').value = exp.id;
    document.getElementById('exp-company').value = exp.company;
    document.getElementById('exp-position').value = exp.position;
    document.getElementById('exp-timeline').value = exp.timeline || exp.year || '';
    document.getElementById('exp-desc').value = exp.responsibilities || exp.description || '';
    
    document.getElementById('experience-modal-title').textContent = 'Edit Work Experience';
    openModal('experience-modal');
  } catch (e) {
    showToast('Failed to load experience details', 'error');
  }
};

window.saveExperience = async function() {
  const id = document.getElementById('experience-doc-id').value;
  
  const data = {
    company: document.getElementById('exp-company').value,
    position: document.getElementById('exp-position').value,
    timeline: document.getElementById('exp-timeline').value,
    responsibilities: document.getElementById('exp-desc').value
  };

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/api/portfolio/experience/${id}` : `${API_URL}/api/portfolio/experience`;

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      showToast('Experience saved successfully!');
      document.getElementById('experience-modal').classList.remove('active');
      renderExperienceList();
    } else {
      showToast('Failed to save experience', 'error');
    }
  } catch (error) {
    showToast('Error saving experience', 'error');
  }
};

window.deleteExperience = function(id) {
  deleteRecord('experience', id, renderExperienceList);
};

/* --- 4. Portfolio Projects CRUD Module --- */
async function renderProjectsList() {
  const list = document.getElementById('projects-crud-list');
  if (!list) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/projects`);
    const projects = await res.json();

    list.innerHTML = projects.map(p => `
      <tr>
        <td><img src="${p.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100'}" class="table-img"></td>
        <td><strong>${p.title}</strong></td>
        <td>${p.category}</td>
        <td><small>${Array.isArray(p.technologies) ? p.technologies.join(', ') : p.technologies}</small></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editProjectModal('${p.id}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" onclick="deleteProject('${p.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

window.addProjectModal = function() {
  const form = document.getElementById('project-modal-form');
  form.reset();
  document.getElementById('project-preview-img').src = '';
  document.getElementById('project-modal-title').textContent = 'Create Project';
  document.getElementById('project-doc-id').value = '';
  openModal('project-modal');
};

window.editProjectModal = async function(id) {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/projects/${id}`);
    const p = await res.json();
    
    document.getElementById('project-doc-id').value = p.id;
    document.getElementById('proj-title').value = p.title;
    document.getElementById('proj-category').value = p.category;
    document.getElementById('proj-desc').value = p.description || '';
    document.getElementById('proj-tech').value = Array.isArray(p.technologies) ? p.technologies.join(', ') : p.technologies;
    document.getElementById('proj-github').value = p.github || '';
    document.getElementById('proj-live').value = p.live || '';
    document.getElementById('proj-video').value = p.video || '';
    
    if (p.image) {
      document.getElementById('project-preview-img').src = p.image;
    } else {
      document.getElementById('project-preview-img').src = '';
    }

    document.getElementById('project-modal-title').textContent = 'Edit Project';
    openModal('project-modal');
  } catch (e) {
    showToast('Failed to load project details', 'error');
  }
};

window.previewProjectImage = function(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('project-preview-img').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.saveProject = async function() {
  const id = document.getElementById('project-doc-id').value;
  const formData = new FormData();
  
  formData.append('title', document.getElementById('proj-title').value);
  formData.append('category', document.getElementById('proj-category').value);
  formData.append('description', document.getElementById('proj-desc').value);
  
  // Format technologies list as array in backend
  const techStr = document.getElementById('proj-tech').value;
  const techArray = techStr.split(',').map(t => t.trim());
  formData.append('technologies', JSON.stringify(techArray));
  
  formData.append('github', document.getElementById('proj-github').value);
  formData.append('live', document.getElementById('proj-live').value);
  formData.append('video', document.getElementById('proj-video').value);
  
  const fileInput = document.getElementById('proj-image-file');
  if (fileInput.files[0]) {
    formData.append('image', fileInput.files[0]);
  }

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/api/portfolio/projects/${id}` : `${API_URL}/api/portfolio/projects`;

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    if (res.ok) {
      showToast('Project saved successfully!');
      document.getElementById('project-modal').classList.remove('active');
      renderProjectsList();
    } else {
      showToast('Failed to save project', 'error');
    }
  } catch (error) {
    showToast('Error saving project file', 'error');
  }
};

window.deleteProject = function(id) {
  deleteRecord('projects', id, renderProjectsList);
};

/* --- 5. Achievements CRUD Module --- */
async function renderAchievementsList() {
  const list = document.getElementById('achievements-crud-list');
  if (!list) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/achievements`);
    const achs = await res.json();

    list.innerHTML = achs.map(ach => `
      <tr>
        <td><img src="${ach.image || 'https://images.unsplash.com/photo-1578269174936-2709b5a5e06e?w=100'}" class="table-img"></td>
        <td><strong>${ach.title || ach.awardName}</strong></td>
        <td>${ach.organization}</td>
        <td>${ach.year}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editAchievementModal('${ach.id}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" onclick="deleteAchievement('${ach.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

window.addAchievementModal = function() {
  const form = document.getElementById('achievement-modal-form');
  form.reset();
  document.getElementById('achievement-preview-img').src = '';
  document.getElementById('achievement-doc-id').value = '';
  document.getElementById('achievement-modal-title').textContent = 'Add Achievement Award';
  openModal('achievement-modal');
};

window.editAchievementModal = async function(id) {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/achievements/${id}`);
    const ach = await res.json();
    
    document.getElementById('achievement-doc-id').value = ach.id;
    document.getElementById('ach-title').value = ach.title || ach.awardName;
    document.getElementById('ach-org').value = ach.organization;
    document.getElementById('ach-year').value = ach.year;
    document.getElementById('ach-desc').value = ach.description || '';
    
    if (ach.image) {
      document.getElementById('achievement-preview-img').src = ach.image;
    } else {
      document.getElementById('achievement-preview-img').src = '';
    }

    document.getElementById('achievement-modal-title').textContent = 'Edit Achievement Award';
    openModal('achievement-modal');
  } catch (e) {
    showToast('Failed to load achievement details', 'error');
  }
};

window.previewAchievementImage = function(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('achievement-preview-img').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.saveAchievement = async function() {
  const id = document.getElementById('achievement-doc-id').value;
  const formData = new FormData();
  
  formData.append('title', document.getElementById('ach-title').value);
  formData.append('organization', document.getElementById('ach-org').value);
  formData.append('year', document.getElementById('ach-year').value);
  formData.append('description', document.getElementById('ach-desc').value);
  
  const fileInput = document.getElementById('ach-image-file');
  if (fileInput.files[0]) {
    formData.append('image', fileInput.files[0]);
  }

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/api/portfolio/achievements/${id}` : `${API_URL}/api/portfolio/achievements`;

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    if (res.ok) {
      showToast('Achievement details saved!');
      document.getElementById('achievement-modal').classList.remove('active');
      renderAchievementsList();
    } else {
      showToast('Failed to save achievement', 'error');
    }
  } catch (error) {
    showToast('Error saving achievement data', 'error');
  }
};

window.deleteAchievement = function(id) {
  deleteRecord('achievements', id, renderAchievementsList);
};

/* --- 6. Certifications CRUD Module --- */
async function renderCertificationsList() {
  const list = document.getElementById('certifications-crud-list');
  if (!list) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/certificates`);
    const certs = await res.json();

    list.innerHTML = certs.map(cert => `
      <tr>
        <td><img src="${cert.image || 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=100'}" class="table-img"></td>
        <td><strong>${cert.name}</strong></td>
        <td>${cert.organization}</td>
        <td>${cert.date}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editCertificateModal('${cert.id}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" onclick="deleteCertificate('${cert.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

window.addCertificateModal = function() {
  const form = document.getElementById('certificate-modal-form');
  form.reset();
  document.getElementById('cert-preview-img').src = '';
  document.getElementById('cert-doc-id').value = '';
  document.getElementById('certificate-modal-title').textContent = 'Upload Certificate';
  openModal('certificate-modal');
};

window.editCertificateModal = async function(id) {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/certificates/${id}`);
    const cert = await res.json();
    
    document.getElementById('cert-doc-id').value = cert.id;
    document.getElementById('cert-name').value = cert.name;
    document.getElementById('cert-org').value = cert.organization;
    document.getElementById('cert-date').value = cert.date;
    document.getElementById('cert-desc').value = cert.description || '';
    document.getElementById('cert-pdf-url').value = cert.pdf || '';
    
    if (cert.image) {
      document.getElementById('cert-preview-img').src = cert.image;
    } else {
      document.getElementById('cert-preview-img').src = '';
    }

    document.getElementById('certificate-modal-title').textContent = 'Edit Certificate Details';
    openModal('certificate-modal');
  } catch (e) {
    showToast('Failed to load certificate details', 'error');
  }
};

window.previewCertificateImage = function(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('cert-preview-img').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.saveCertificate = async function() {
  const id = document.getElementById('cert-doc-id').value;
  const formData = new FormData();
  
  formData.append('name', document.getElementById('cert-name').value);
  formData.append('organization', document.getElementById('cert-org').value);
  formData.append('date', document.getElementById('cert-date').value);
  formData.append('description', document.getElementById('cert-desc').value);
  formData.append('pdf', document.getElementById('cert-pdf-url').value); // Direct link or pdf file input (optional text link in admin form)
  
  const fileInput = document.getElementById('cert-image-file');
  if (fileInput.files[0]) {
    formData.append('image', fileInput.files[0]);
  }

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/api/portfolio/certificates/${id}` : `${API_URL}/api/portfolio/certificates`;

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    if (res.ok) {
      showToast('Certificate saved successfully!');
      document.getElementById('certificate-modal').classList.remove('active');
      renderCertificationsList();
    } else {
      showToast('Failed to save certificate', 'error');
    }
  } catch (error) {
    showToast('Error uploading certificate data', 'error');
  }
};

window.deleteCertificate = function(id) {
  deleteRecord('certificates', id, renderCertificationsList);
};

/* --- 7. Gallery CRUD Module --- */
async function renderGalleryList() {
  const list = document.getElementById('gallery-crud-list');
  if (!list) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/gallery`);
    const gallery = await res.json();

    list.innerHTML = gallery.map(item => `
      <tr>
        <td>
          ${item.type === 'video' ? `
            <video src="${item.url}" style="width: 60px; height: 45px; object-fit: cover;"></video>
          ` : `
            <img src="${item.url}" class="table-img">
          `}
        </td>
        <td>${item.category}</td>
        <td>${item.type || 'image'}</td>
        <td>${item.order || 0}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn delete" onclick="deleteGalleryItem('${item.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

window.addGalleryModal = function() {
  const form = document.getElementById('gallery-modal-form');
  form.reset();
  document.getElementById('gallery-preview-img').src = '';
  openModal('gallery-modal');
};

window.previewGalleryImage = function(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('gallery-preview-img').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.saveGalleryItem = async function() {
  const formData = new FormData();
  formData.append('category', document.getElementById('gal-category').value);
  formData.append('type', document.getElementById('gal-type').value);
  formData.append('order', parseInt(document.getElementById('gal-order').value || 0));
  
  const fileInput = document.getElementById('gal-file');
  if (fileInput.files[0]) {
    formData.append('url', fileInput.files[0]);
  } else {
    showToast('Please select a file to upload', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/portfolio/gallery`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    if (res.ok) {
      showToast('Media uploaded to gallery!');
      document.getElementById('gallery-modal').classList.remove('active');
      renderGalleryList();
    } else {
      showToast('Failed to upload gallery media', 'error');
    }
  } catch (error) {
    showToast('Error uploading media files', 'error');
  }
};

window.deleteGalleryItem = function(id) {
  deleteRecord('gallery', id, renderGalleryList);
};

/* --- 8. Blog Editor & CRUD Module --- */
async function renderBlogsList() {
  const list = document.getElementById('blogs-crud-list');
  if (!list) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/blogs`);
    const blogs = await res.json();

    list.innerHTML = blogs.map(b => `
      <tr>
        <td><img src="${b.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=100'}" class="table-img"></td>
        <td><strong>${b.title}</strong></td>
        <td>${b.category}</td>
        <td>
          <span class="badge" style="padding: 4px 8px; border-radius: 4px; background: ${b.status === 'published' ? '#10b98120; color: #10b981;' : '#fbbf2420; color: #fbbf24;'}">
            ${b.status}
          </span>
        </td>
        <td><small>${new Date(b.date || b.createdAt).toLocaleDateString()}</small></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editBlogModal('${b.id}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" onclick="deleteBlog('${b.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

window.addBlogModal = function() {
  const form = document.getElementById('blog-modal-form');
  form.reset();
  document.getElementById('blog-preview-img').src = '';
  document.getElementById('blog-doc-id').value = '';
  document.getElementById('blog-modal-title').textContent = 'Write Blog Post';
  openModal('blog-modal');
};

window.editBlogModal = async function(id) {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/blogs/${id}`);
    const b = await res.json();
    
    document.getElementById('blog-doc-id').value = b.id;
    document.getElementById('blog-title').value = b.title;
    document.getElementById('blog-category').value = b.category;
    document.getElementById('blog-tags').value = Array.isArray(b.tags) ? b.tags.join(', ') : b.tags || '';
    document.getElementById('blog-status').value = b.status || 'draft';
    document.getElementById('blog-content').value = b.content || '';
    
    if (b.image) {
      document.getElementById('blog-preview-img').src = b.image;
    } else {
      document.getElementById('blog-preview-img').src = '';
    }

    document.getElementById('blog-modal-title').textContent = 'Edit Blog Post';
    openModal('blog-modal');
  } catch (e) {
    showToast('Failed to load article details', 'error');
  }
};

window.previewBlogImage = function(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('blog-preview-img').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.saveBlog = async function() {
  const id = document.getElementById('blog-doc-id').value;
  const formData = new FormData();
  
  formData.append('title', document.getElementById('blog-title').value);
  formData.append('category', document.getElementById('blog-category').value);
  formData.append('status', document.getElementById('blog-status').value);
  formData.append('content', document.getElementById('blog-content').value);
  
  const tagsStr = document.getElementById('blog-tags').value;
  const tagsArray = tagsStr.split(',').map(t => t.trim());
  formData.append('tags', JSON.stringify(tagsArray));
  
  const fileInput = document.getElementById('blog-image-file');
  if (fileInput.files[0]) {
    formData.append('image', fileInput.files[0]);
  }

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/api/portfolio/blogs/${id}` : `${API_URL}/api/portfolio/blogs`;

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    if (res.ok) {
      showToast('Blog article saved!');
      document.getElementById('blog-modal').classList.remove('active');
      renderBlogsList();
    } else {
      showToast('Failed to save article', 'error');
    }
  } catch (error) {
    showToast('Error uploading article files', 'error');
  }
};

window.deleteBlog = function(id) {
  deleteRecord('blogs', id, renderBlogsList);
};

// Rich text editor tools mock helper functions
window.formatEditor = function(tag) {
  const textarea = document.getElementById('blog-content');
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);
  
  let formatted = '';
  switch (tag) {
    case 'bold':
      formatted = `**${selected}**`;
      break;
    case 'italic':
      formatted = `*${selected}*`;
      break;
    case 'heading':
      formatted = `### ${selected}`;
      break;
    case 'link':
      formatted = `[${selected}](url)`;
      break;
    case 'code':
      formatted = `\`\`\`javascript\n${selected}\n\`\`\``;
      break;
  }

  textarea.value = text.substring(0, start) + formatted + text.substring(end);
  textarea.focus();
};

/* --- 9. Testimonials CRUD Module --- */
async function renderTestimonialsList() {
  const list = document.getElementById('testimonials-crud-list');
  if (!list) return;

  try {
    const res = await fetch(`${API_URL}/api/portfolio/testimonials`);
    const testimonies = await res.json();

    list.innerHTML = testimonies.map(t => `
      <tr>
        <td><img src="${t.photo || 'https://randomuser.me/api/portraits/men/32.jpg'}" class="table-img"></td>
        <td><strong>${t.client}</strong></td>
        <td>${t.company}</td>
        <td>
          <div style="color: #fbbf24;">
            ${Array.from({ length: t.rating || 5 }).map(() => '<i class="fas fa-star"></i>').join('')}
          </div>
        </td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editTestimonialModal('${t.id}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" onclick="deleteTestimonial('${t.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

window.addTestimonialModal = function() {
  const form = document.getElementById('testimonial-modal-form');
  form.reset();
  document.getElementById('test-preview-img').src = '';
  document.getElementById('testimonial-doc-id').value = '';
  document.getElementById('testimonial-modal-title').textContent = 'Add Testimonial';
  setStarInputRating(5);
  openModal('testimonial-modal');
};

window.editTestimonialModal = async function(id) {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/testimonials/${id}`);
    const t = await res.json();
    
    document.getElementById('testimonial-doc-id').value = t.id;
    document.getElementById('test-client').value = t.client;
    document.getElementById('test-company').value = t.company || '';
    document.getElementById('test-review').value = t.review;
    
    if (t.photo) {
      document.getElementById('test-preview-img').src = t.photo;
    } else {
      document.getElementById('test-preview-img').src = '';
    }

    setStarInputRating(t.rating || 5);
    document.getElementById('testimonial-modal-title').textContent = 'Edit Testimonial';
    openModal('testimonial-modal');
  } catch (e) {
    showToast('Failed to load testimonial details', 'error');
  }
};

window.previewTestimonialPhoto = function(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('test-preview-img').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.setStarInputRating = function(rating) {
  document.getElementById('test-rating-value').value = rating;
  const stars = document.querySelectorAll('.rating-input i');
  stars.forEach((star, idx) => {
    if (idx < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
};

window.saveTestimonial = async function() {
  const id = document.getElementById('testimonial-doc-id').value;
  const formData = new FormData();
  
  formData.append('client', document.getElementById('test-client').value);
  formData.append('company', document.getElementById('test-company').value);
  formData.append('review', document.getElementById('test-review').value);
  formData.append('rating', parseInt(document.getElementById('test-rating-value').value));
  
  const fileInput = document.getElementById('test-photo-file');
  if (fileInput.files[0]) {
    formData.append('photo', fileInput.files[0]);
  }

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/api/portfolio/testimonials/${id}` : `${API_URL}/api/portfolio/testimonials`;

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    if (res.ok) {
      showToast('Testimonial reviews updated!');
      document.getElementById('testimonial-modal').classList.remove('active');
      renderTestimonialsList();
    } else {
      showToast('Failed to save testimonial', 'error');
    }
  } catch (error) {
    showToast('Error uploading reviews details', 'error');
  }
};

window.deleteTestimonial = function(id) {
  deleteRecord('testimonials', id, renderTestimonialsList);
};

/* --- 10. Contact Messages & Newsletter CRUD Module --- */
let allCachedMessages = [];
let currentMessageFilterStatus = 'all';
let currentMessageSearchQuery = '';
let currentActiveDetailMessageId = null;

function displayFilteredMessages() {
  const list = document.getElementById('messages-crud-list');
  if (!list) return;

  const filtered = allCachedMessages.filter(msg => {
    const matchesStatus = currentMessageFilterStatus === 'all' || 
                          (currentMessageFilterStatus === 'replied' && msg.replied) ||
                          (currentMessageFilterStatus === 'pending' && !msg.replied);
    
    const matchesSearch = !currentMessageSearchQuery ||
                          (msg.name || '').toLowerCase().includes(currentMessageSearchQuery) ||
                          (msg.email || '').toLowerCase().includes(currentMessageSearchQuery) ||
                          (msg.subject || '').toLowerCase().includes(currentMessageSearchQuery) ||
                          (msg.message || '').toLowerCase().includes(currentMessageSearchQuery);
    
    return matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<tr><td colspan="6" class="text-center opacity-60">No matching inquiries found.</td></tr>`;
    return;
  }

  list.innerHTML = filtered.map(msg => `
    <tr style="border-left: 3px solid ${msg.replied ? '#10b981' : 'var(--accent-color)'};">
      <td>
        <strong>${msg.name}</strong><br>
        <small>${msg.email}</small>
      </td>
      <td><strong>${msg.subject}</strong></td>
      <td><p style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${msg.message}</p></td>
      <td><small>${msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'N/A'}</small></td>
      <td>
        <span class="badge" style="padding: 4px 8px; border-radius: 4px; background: ${msg.replied ? '#10b98120; color: #10b981;' : '#f43f5e20; color: var(--accent-color);'}">
          ${msg.replied ? 'Replied' : 'Pending'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" onclick="viewMessageDetails('${msg.id}')" title="View Full Details"><i class="fas fa-eye" style="color: #3b82f6;"></i></button>
          <button class="action-btn edit" onclick="replyMessageModal('${msg.id}', '${msg.name}', '${msg.message}')" title="Email Reply"><i class="fas fa-reply"></i></button>
          <button class="action-btn delete" onclick="deleteMessage('${msg.id}')" title="Delete Log"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function renderMessagesList() {
  const list = document.getElementById('messages-crud-list');
  const subsList = document.getElementById('subscribers-crud-list');
  
  try {
    // Render Messages
    if (list) {
      const res = await fetch(`${API_URL}/api/portfolio/messages`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      allCachedMessages = await res.json();
      
      // Setup listeners once
      const searchInput = document.getElementById('message-search-input');
      if (searchInput && !searchInput.dataset.listenerAttached) {
        searchInput.dataset.listenerAttached = 'true';
        searchInput.addEventListener('input', (e) => {
          currentMessageSearchQuery = e.target.value.toLowerCase();
          displayFilteredMessages();
        });
        
        const filterBtns = document.querySelectorAll('#message-status-filters .filter-btn');
        filterBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMessageFilterStatus = btn.getAttribute('data-status');
            displayFilteredMessages();
          });
        });
      }

      displayFilteredMessages();
    }

    // Render Subscribers
    if (subsList) {
      const res = await fetch(`${API_URL}/api/portfolio/newsletter`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const subscribers = await res.json();
      
      subsList.innerHTML = subscribers.map(sub => `
        <tr>
          <td><strong>${sub.email}</strong></td>
          <td>${new Date(sub.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="action-btn delete" onclick="deleteSubscriber('${sub.id}')"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    }

  } catch (e) {
    console.error(e);
  }
}

window.viewMessageDetails = async function(id) {
  currentActiveDetailMessageId = id;
  try {
    const res = await fetch(`${API_URL}/api/portfolio/messages/${id}`);
    const msg = await res.json();
    
    document.getElementById('msg-detail-name').textContent = msg.name;
    document.getElementById('msg-detail-email').textContent = msg.email;
    document.getElementById('msg-detail-email').style.cursor = 'pointer';
    document.getElementById('msg-detail-email').onclick = () => window.open(`mailto:${msg.email}`);
    document.getElementById('msg-detail-date').textContent = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'N/A';
    
    const statusBadge = document.getElementById('msg-detail-status');
    statusBadge.textContent = msg.replied ? 'Replied' : 'Pending';
    statusBadge.style.background = msg.replied ? '#10b98120' : '#f43f5e20';
    statusBadge.style.color = msg.replied ? '#10b981' : 'var(--accent-color)';
    
    document.getElementById('msg-detail-subject').textContent = msg.subject;
    document.getElementById('msg-detail-content').textContent = msg.message;
    
    // Render threaded replies
    const repliesList = document.getElementById('msg-replies-list');
    const replies = msg.replies || [];
    if (replies.length === 0) {
      repliesList.innerHTML = '<p class="opacity-50" style="font-size: 0.85rem;">No replies sent to this inquiry yet.</p>';
    } else {
      repliesList.innerHTML = replies.map(r => `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 12px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.8rem; opacity: 0.6;">
            <span>From: <strong>${r.sender}</strong></span>
            <span>${new Date(r.date).toLocaleString()}</span>
          </div>
          <p style="font-size: 0.85rem; line-height: 1.4; white-space: pre-wrap;">${r.text}</p>
        </div>
      `).join('');
    }
    
    document.getElementById('msg-quick-reply-text').value = '';
    
    // AI reply drafting trigger inside modal
    const aiQuickBtn = document.getElementById('ai-generate-quick-reply-btn');
    if (aiQuickBtn) {
      aiQuickBtn.onclick = async () => {
        aiQuickBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Writing...';
        try {
          const response = await fetch(`${API_URL}/api/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
              prompt: `Draft a professional reply to ${msg.name} regarding their message.`,
              type: 'reply',
              context: { name: msg.name, message: msg.message }
            })
          });
          const data = await response.json();
          if (response.ok) {
            document.getElementById('msg-quick-reply-text').value = data.response;
          } else {
             showToast('AI could not compose draft', 'error');
          }
        } catch (err) {
          showToast('AI draft service error', 'error');
        } finally {
          aiQuickBtn.innerHTML = '<i class="fas fa-magic"></i> AI Draft Reply';
        }
      };
    }
    
    openModal('message-details-modal');
  } catch (e) {
    showToast('Failed to load message details', 'error');
  }
};

window.sendQuickReply = async function() {
  const id = currentActiveDetailMessageId;
  const replyText = document.getElementById('msg-quick-reply-text').value;

  if (!replyText.trim()) {
    showToast('Reply message cannot be empty', 'error');
    return;
  }

  const sendBtn = document.getElementById('msg-quick-reply-send-btn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

  try {
    const res = await fetch(`${API_URL}/api/portfolio/messages/${id}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ replyText })
    });
    if (res.ok) {
      showToast('Reply logged successfully!');
      document.getElementById('message-details-modal').classList.remove('active');
      renderMessagesList();
    } else {
      showToast('Failed to save message reply', 'error');
    }
  } catch (error) {
     showToast('Connection error sending reply', 'error');
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reply';
  }
};

window.replyMessageModal = function(id, name, originalMsg) {
  document.getElementById('reply-doc-id').value = id;
  document.getElementById('reply-client-name').textContent = name;
  document.getElementById('reply-original-text').textContent = originalMsg;
  document.getElementById('reply-text-content').value = '';
  openModal('reply-modal');
  
  const aiReplyBtn = document.getElementById('ai-generate-reply-btn');
  if (aiReplyBtn) {
    aiReplyBtn.onclick = async () => {
      aiReplyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Writing...';
      try {
        const response = await fetch(`${API_URL}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            prompt: `Draft a professional reply to ${name} regarding their message.`,
            type: 'reply',
            context: { name: name, message: originalMsg }
          })
        });
        const data = await response.json();
        if (response.ok) {
          document.getElementById('reply-text-content').value = data.response;
        } else {
          showToast('AI could not write reply', 'error');
        }
      } catch (err) {
        showToast('AI reply endpoint error', 'error');
      } finally {
        aiReplyBtn.innerHTML = '<i class="fas fa-magic"></i> AI Draft Reply';
      }
    };
  }
};

window.sendReply = async function() {
  const id = document.getElementById('reply-doc-id').value;
  const replyText = document.getElementById('reply-text-content').value;

  if (!replyText.trim()) {
    showToast('Reply message cannot be empty', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/portfolio/messages/${id}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ replyText })
    });
    if (res.ok) {
      showToast('Reply saved successfully!');
      document.getElementById('reply-modal').classList.remove('active');
      renderMessagesList();
    } else {
      showToast('Failed to save message reply', 'error');
    }
  } catch (error) {
    showToast('Error sending reply text', 'error');
  }
};

window.deleteMessage = function(id) {
  deleteRecord('messages', id, renderMessagesList);
};

window.deleteSubscriber = function(id) {
  deleteRecord('newsletter', id, renderMessagesList);
};

window.exportMessages = function() {
  window.open(`${API_URL}/api/portfolio/messages/export/csv?token=${getToken()}`);
  // Wait, token as query param since simple window.open doesn't support headers. Let's make sure backend allows fallback token queries for downloads
};

window.exportNewsletter = function() {
  window.open(`${API_URL}/api/portfolio/newsletter/export/csv?token=${getToken()}`);
};

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
