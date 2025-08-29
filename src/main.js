import './style.css'

document.querySelector('#app').innerHTML = `
  <div class="container">
    <header class="header">
      <nav class="nav">
        <div class="nav-brand">
          <h1>Cole</h1>
        </div>
        <div class="nav-links">
          <a href="#about" class="nav-link">About</a>
          <a href="#projects" class="nav-link">Projects</a>
          <a href="#contact" class="nav-link">Contact</a>
        </div>
      </nav>
    </header>

    <main class="main">
      <section class="hero">
        <div class="hero-content">
          <h2 class="hero-title">
            Hi, I'm <span class="highlight">Cole</span>
          </h2>
          <p class="hero-subtitle">
            Full-stack developer passionate about creating beautiful, functional web experiences
          </p>
          <div class="hero-buttons">
            <button class="btn btn-primary">View My Work</button>
            <button class="btn btn-secondary">Get In Touch</button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="floating-card">
            <div class="card-header"></div>
            <div class="card-content">
              <div class="code-line"></div>
              <div class="code-line short"></div>
              <div class="code-line"></div>
              <div class="code-line medium"></div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" class="section">
        <div class="section-content">
          <h3 class="section-title">About Me</h3>
          <p class="section-text">
            I'm a passionate developer with expertise in modern web technologies. 
            I love building applications that solve real problems and provide 
            exceptional user experiences.
          </p>
          <div class="skills">
            <span class="skill-tag">JavaScript</span>
            <span class="skill-tag">React</span>
            <span class="skill-tag">Node.js</span>
            <span class="skill-tag">TypeScript</span>
            <span class="skill-tag">CSS</span>
            <span class="skill-tag">HTML</span>
          </div>
        </div>
      </section>

      <section id="projects" class="section">
        <div class="section-content">
          <h3 class="section-title">Featured Projects</h3>
          <div class="projects-grid">
            <div class="project-card">
              <div class="project-image"></div>
              <div class="project-info">
                <h4 class="project-title">Project One</h4>
                <p class="project-description">A modern web application built with React and Node.js</p>
                <div class="project-tags">
                  <span class="tag">React</span>
                  <span class="tag">Node.js</span>
                </div>
              </div>
            </div>
            <div class="project-card">
              <div class="project-image"></div>
              <div class="project-info">
                <h4 class="project-title">Project Two</h4>
                <p class="project-description">An innovative solution using cutting-edge technologies</p>
                <div class="project-tags">
                  <span class="tag">TypeScript</span>
                  <span class="tag">CSS</span>
                </div>
              </div>
            </div>
            <div class="project-card">
              <div class="project-image"></div>
              <div class="project-info">
                <h4 class="project-title">Project Three</h4>
                <p class="project-description">A beautiful interface with smooth animations</p>
                <div class="project-tags">
                  <span class="tag">JavaScript</span>
                  <span class="tag">CSS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" class="section">
        <div class="section-content">
          <h3 class="section-title">Let's Connect</h3>
          <p class="section-text">
            I'm always interested in new opportunities and collaborations.
            Feel free to reach out!
          </p>
          <div class="contact-links">
            <a href="mailto:cole@example.com" class="contact-link">
              <span class="contact-icon">✉</span>
              Email
            </a>
            <a href="https://github.com" class="contact-link">
              <span class="contact-icon">⚡</span>
              GitHub
            </a>
            <a href="https://linkedin.com" class="contact-link">
              <span class="contact-icon">💼</span>
              LinkedIn
            </a>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <p>&copy; 2025 Cole. Built with passion and modern web technologies.</p>
    </footer>
  </div>
`

// Smooth scrolling for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault()
    const targetId = link.getAttribute('href').substring(1)
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' })
    }
  })
})

// Button interactions
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.style.transform = 'scale(0.95)'
    setTimeout(() => {
      btn.style.transform = ''
    }, 150)
  })
})