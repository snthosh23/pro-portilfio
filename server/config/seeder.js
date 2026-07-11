const DBModel = require('../models/db');

/**
 * Automatically seeds starter content into the live Firestore database if collections are empty.
 */
async function seedDatabaseIfNeeded() {
  try {
    console.log('=================================================');
    console.log('📦 Checking Firestore collections for starter data...');

    // 1. Seed Profile & Bio details
    const profile = await DBModel.getById('profile', 'main');
    if (!profile) {
      console.log('👉 Seeding Profile & Bio...');
      await DBModel.set('profile', 'main', {
        id: 'main',
        name: 'Santhosh Kumar',
        title: 'Senior UI/UX Designer & Full Stack Developer',
        bio: 'Crafting premium, high-performance web applications with modern architectures.',
        introduction: 'Welcome to my digital space. I build premium, secure web applications.',
        email: 'santhosh@example.com',
        phone: '+1 (234) 567-8900',
        address: 'Silicon Valley, CA',
        whatsapp: 'https://wa.me/12345678900',
        socials: {
          github: 'https://github.com',
          linkedin: 'https://linkedin.com',
          twitter: 'https://twitter.com'
        },
        resumeUrl: ''
      });
    }

    // 2. Seed Skills Catalog
    const skills = await DBModel.getAll('skills');
    if (skills.length === 0) {
      console.log('👉 Seeding Skills Catalog...');
      const defaultSkills = [
        { name: 'HTML5 & CSS3', category: 'Frontend', percentage: 95, icon: 'fab fa-html5' },
        { name: 'Vanilla JavaScript', category: 'Frontend', percentage: 90, icon: 'fab fa-js' },
        { name: 'Node.js & Express', category: 'Backend', percentage: 90, icon: 'fab fa-node-js' },
        { name: 'Firebase Database', category: 'Backend', percentage: 85, icon: 'fas fa-fire' },
        { name: 'UI/UX Design', category: 'Design', percentage: 92, icon: 'fas fa-palette' },
        { name: 'REST API Security', category: 'Security', percentage: 88, icon: 'fas fa-shield-halved' }
      ];
      for (const s of defaultSkills) {
        await DBModel.create('skills', s);
      }
    }

    // 3. Seed Education Log
    const education = await DBModel.getAll('education');
    if (education.length === 0) {
      console.log('👉 Seeding Education Log...');
      const defaultEd = [
        { degree: 'Master of Science in Software Systems', institution: 'State University', year: '2022', description: 'Specialized in distributed systems, security audits, and human-computer interaction models.' },
        { degree: 'Bachelor of Engineering in Computer Science', institution: 'Technology Institute', year: '2020', description: 'Fundamentals of algorithms, MVC software engineering, and database paradigms.' }
      ];
      for (const ed of defaultEd) {
        await DBModel.create('education', ed);
      }
    }

    // 4. Seed Experience Timeline
    const experience = await DBModel.getAll('experience');
    if (experience.length === 0) {
      console.log('👉 Seeding Experience Timeline...');
      const defaultExp = [
        { position: 'Senior Full Stack Developer', company: 'TechSolutions Ltd', timeline: '2024 - Present', description: 'Architecting high-performance MVC web portals and auditing server security headers.' },
        { position: 'Web Architect & Consultant', company: 'CyberGuard Inc', timeline: '2022 - 2024', description: 'Designed glassmorphic dashboard views and integrated Firebase/Gemini AI integrations.' }
      ];
      for (const exp of defaultExp) {
        await DBModel.create('experience', exp);
      }
    }

    // 5. Seed Projects Grid
    const projects = await DBModel.getAll('projects');
    if (projects.length === 0) {
      console.log('👉 Seeding Projects Grid...');
      const defaultProj = [
        {
          title: 'Glassmorphic CRM Dashboard',
          category: 'Web App',
          description: 'A premium, high-contrast dashboard with live customizer controls, interactive Chart.js analytics, and secure REST access.',
          technologies: ['Vanilla JS', 'Node.js', 'Express', 'Firebase'],
          github: 'https://github.com',
          live: 'https://example.com',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600'
        },
        {
          title: 'AI Copywriting Assistant',
          category: 'AI Engine',
          description: 'A helper application mapping to Gemini 1.5 Flash to automatically rewrite bios, reviews, and client inquiries drafts.',
          technologies: ['Node.js', 'Express', 'Gemini API', 'Vanilla CSS'],
          github: 'https://github.com',
          live: 'https://example.com',
          image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600'
        }
      ];
      for (const p of defaultProj) {
        await DBModel.create('projects', p);
      }
    }

    // 6. Seed Achievements Awards
    const achievements = await DBModel.getAll('achievements');
    if (achievements.length === 0) {
      console.log('👉 Seeding Achievements Awards...');
      const defaultAchs = [
        { title: 'Engineering Excellence Award', organization: 'Tech Innovation Forum', year: '2025', description: 'Honored for building high-performance, secure open-source backend libraries.', image: 'https://images.unsplash.com/photo-1578269174936-2709b5a5e06e?w=600' },
        { title: 'Best UI/UX Design Winner', organization: 'Creative Web Agency', year: '2023', description: 'Awarded for creating accessible, state-of-the-art glassmorphic client portals.', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600' }
      ];
      for (const ach of defaultAchs) {
        await DBModel.create('achievements', ach);
      }
    }

    // 7. Seed Certifications
    const certificates = await DBModel.getAll('certificates');
    if (certificates.length === 0) {
      console.log('👉 Seeding Certifications...');
      const defaultCerts = [
        { title: 'Google Certified Cloud Architect', organization: 'Google Cloud Platform', year: '2024', description: 'Specialized in deploying distributed container systems and serverless runtimes.', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600' },
        { title: 'CISSP - Security Professional', organization: '(ISC)²', year: '2025', description: 'Demonstrated mastery in information security architectures, network guards, and risk audits.', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600' }
      ];
      for (const cert of defaultCerts) {
        await DBModel.create('certificates', cert);
      }
    }

    // 8. Seed Media Gallery
    const gallery = await DBModel.getAll('gallery');
    if (gallery.length === 0) {
      console.log('👉 Seeding Media Gallery...');
      const defaultGallery = [
        { title: 'Design System Workspace', type: 'image', order: 1, url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600' },
        { title: 'Engineering Brainstorming', type: 'image', order: 2, url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600' },
        { title: 'Development Desk Setup', type: 'image', order: 3, url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600' }
      ];
      for (const item of defaultGallery) {
        await DBModel.create('gallery', item);
      }
    }

    // 9. Seed Blog Articles
    const blogs = await DBModel.getAll('blogs');
    if (blogs.length === 0) {
      console.log('👉 Seeding Blog Articles...');
      const defaultBlogs = [
        {
          title: 'Securing Node.js REST Endpoints',
          category: 'Security',
          summary: 'A detailed manual on configuring XSS body-sanitizers, rate limiters, and Helmet headers in Express.',
          content: 'Securing your server requires a multi-layer approach. In this article, we demonstrate how custom sanitization middlewares catch script injections before queries hit the database. Always use JWT tokens to guard routes.',
          slug: 'securing-nodejs-rest-endpoints',
          date: new Date().toISOString(),
          image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600'
        },
        {
          title: 'The Visual Power of CSS Custom Properties',
          category: 'Web Design',
          summary: 'How to build dynamic real-time theme customizers utilizing pure CSS variables and Vanilla JS modifiers.',
          content: 'CSS custom properties (--variables) have changed web styling. We explain how binding color controls directly to root variables lets admins customize aesthetics without reloading.',
          slug: 'visual-power-css-custom-properties',
          date: new Date().toISOString(),
          image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600'
        }
      ];
      for (const b of defaultBlogs) {
        await DBModel.create('blogs', b);
      }
    }

    // 10. Seed Testimonials Reviews
    const testimonials = await DBModel.getAll('testimonials');
    if (testimonials.length === 0) {
      console.log('👉 Seeding Testimonials Reviews...');
      const defaultTest = [
        { client: 'Johnathan Davis', company: 'CTO, InnoCorp', review: 'Santhosh delivered a beautiful, modular application. The API performance and attention to security detail are absolutely state-of-the-art.', rating: 5, photo: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { client: 'Evelyn Martinez', company: 'Product VP, DesignLabs', review: 'Stunning visual execution. The glassmorphic cards and micro-animations made our main application look premium and clean.', rating: 5, photo: 'https://randomuser.me/api/portraits/women/44.jpg' }
      ];
      for (const t of defaultTest) {
        await DBModel.create('testimonials', t);
      }
    }

    // 11. Seed Messages Portal Initial log
    const messages = await DBModel.getAll('messages');
    if (messages.length === 0) {
      console.log('👉 Seeding Messages Portal...');
      const defaultMsg = {
        name: 'Sarah Connor',
        email: 'sarah@cyberdyne.com',
        subject: 'System Architecture Revamp',
        message: 'Hi Santhosh, I saw your portfolio and would like to discuss a security audit and UI revamp for our new cloud dashboard system. Let\'s sync up soon.',
        replied: false,
        createdAt: new Date().toISOString(),
        replies: []
      };
      await DBModel.create('messages', defaultMsg);
    }

    console.log('✅ Database initialization checks completed successfully!');
    console.log('=================================================');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

module.exports = { seedDatabaseIfNeeded };
