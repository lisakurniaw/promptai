// AI Content Generator - Main Application

import './style.css'
import { generateVideoPrompt, generateStoryboard, GLOBAL_LOCKS, BACKGROUNDS, NICHE_ADAPTERS, SCENE_TEMPLATES, STYLE_PRESETS, EXAMPLE_PROMPTS } from './promptEngine.js'
import { videoService } from './videoService.js'
import { imageService } from './imageService.js'

// Application State
const state = {
  currentPage: 'dashboard',
  currentStep: 1,
  totalSteps: 5,
  project: {
    productImage: null,
    productLink: '',
    productName: 'Product Name',
    niche: null,
    persona: 'indonesian_woman_fair',
    background: 'minimalist_kitchen',
    stylePreset: 'studio',
    masterImage: null,
    scenes: [],
    generatedPrompts: [],
    output: null
  },
  apiKeys: {
    gemini: localStorage.getItem('gemini_api_key') || '',
    replicate: localStorage.getItem('replicate_api_key') || '',
    bananaApiKey: localStorage.getItem('banana_api_key') || '',
    bananaModelKey: localStorage.getItem('banana_model_key') || ''
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initNavigation()
  renderPage('dashboard')
})

// Navigation Handler
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item')

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      const page = item.dataset.page

      // Update active state
      navItems.forEach(nav => nav.classList.remove('active'))
      item.classList.add('active')

      // Render page
      state.currentPage = page
      renderPage(page)
    })
  })
}

// Page Router
function renderPage(page) {
  const mainContent = document.getElementById('main-content')

  switch (page) {
    case 'dashboard':
      mainContent.innerHTML = renderDashboard()
      break
    case 'new-project':
      mainContent.innerHTML = renderWizard()
      initWizard()
      break
    case 'projects':
      mainContent.innerHTML = renderProjects()
      break
    case 'assets':
      mainContent.innerHTML = renderAssets()
      break
    case 'settings':
      mainContent.innerHTML = renderSettings()
      break
    default:
      mainContent.innerHTML = renderDashboard()
  }
}

// ============================================
// Dashboard Page
// ============================================
function renderDashboard() {
  return `
    <div class="page active">
      <header class="mb-4">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your content overview.</p>
      </header>
      
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">12</div>
          <div class="stat-label">Total Projects</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎬</div>
          <div class="stat-value">48</div>
          <div class="stat-label">Scenes Generated</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔗</div>
          <div class="stat-value">156</div>
          <div class="stat-label">Link Clicks</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">Rp 2.4M</div>
          <div class="stat-label">Est. Revenue</div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="card mb-3">
        <div class="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-primary btn-lg" onclick="navigateTo('new-project')">
            ➕ New Project
          </button>
          <button class="btn btn-secondary" onclick="navigateTo('assets')">
            🎭 Browse Personas
          </button>
        </div>
      </div>
      
      <!-- Recent Projects -->
      <div class="card">
        <div class="card-header">
          <h3>Recent Projects</h3>
          <button class="btn btn-ghost" onclick="navigateTo('projects')">View All →</button>
        </div>
        <div class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
          ${renderProjectCard('Skincare Review', 'Herbal', '3 hours ago', true)}
          ${renderProjectCard('Dress Promotion', 'Fashion', 'Yesterday', false)}
          ${renderProjectCard('Wireless Earbuds', 'Elektronik', '2 days ago', false)}
        </div>
      </div>
    </div>
  `
}

function renderProjectCard(name, niche, time, isNew) {
  const nicheClass = niche.toLowerCase()
  return `
    <div class="card" style="padding: 1rem; cursor: pointer;">
      <div class="flex justify-between items-center mb-1">
        <h4>${name}</h4>
        ${isNew ? '<span class="lock-badge">NEW</span>' : ''}
      </div>
      <div class="flex gap-1 items-center">
        <span class="niche-card ${nicheClass} selected" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">${niche}</span>
        <span class="text-muted" style="font-size: 0.75rem;">${time}</span>
      </div>
    </div>
  `
}

// ============================================
// Wizard (New Project)
// ============================================
function renderWizard() {
  return `
    <div class="page active wizard-container">
      <!-- Stepper -->
      <div class="stepper">
        ${renderStepper()}
      </div>
      
      <!-- Wizard Content -->
      <div id="wizard-step-content">
        ${renderWizardStep(state.currentStep)}
      </div>
    </div>
  `
}

function renderStepper() {
  const steps = [
    { num: 1, label: 'Upload' },
    { num: 2, label: 'Persona' },
    { num: 3, label: 'Master Image' },
    { num: 4, label: 'Storyboard' },
    { num: 5, label: 'Export' }
  ]

  return steps.map((step, idx) => {
    const isActive = step.num === state.currentStep
    const isCompleted = step.num < state.currentStep

    let html = `
      <div class="step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
        <div class="step-indicator">
          ${isCompleted ? '✓' : step.num}
        </div>
        <span class="step-label">${step.label}</span>
      </div>
    `

    if (idx < steps.length - 1) {
      html += `<div class="step-connector"></div>`
    }

    return html
  }).join('')
}

function renderWizardStep(step) {
  switch (step) {
    case 1: return renderStep1()
    case 2: return renderStep2()
    case 3: return renderStep3()
    case 4: return renderStep4()
    case 5: return renderStep5()
    default: return renderStep1()
  }
}

// Step 1: Upload & Input
function renderStep1() {
  return `
    <div class="wizard-header">
      <h2 class="wizard-title">Step 1: Product Setup</h2>
      <p class="wizard-subtitle">Upload your product image and enter details</p>
    </div>
    
    <div class="wizard-content">
      <!-- Left: Upload -->
      <div>
        <label class="form-label">Product Image</label>
        <div class="upload-zone ${state.project.productImage ? 'has-file' : ''}" id="upload-zone">
          ${state.project.productImage
      ? `<img src="${state.project.productImage}" class="upload-preview" alt="Product">`
      : `
              <div class="upload-icon">📷</div>
              <div class="upload-text">Drop image here or click to upload</div>
              <div class="upload-hint">Supports JPG, PNG up to 10MB</div>
            `
    }
          <input type="file" id="product-image-input" accept="image/*" style="display: none;">
        </div>
      </div>
      
      <!-- Right: Details -->
      <div>
        <div class="form-group">
          <label class="form-label">Product Link (Affiliate)</label>
          <input type="url" class="form-input" id="product-link" 
            placeholder="https://shopee.co.id/..." 
            value="${state.project.productLink}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Select Niche</label>
          <div class="niche-selector">
            <div class="niche-card herbal ${state.project.niche === 'herbal' ? 'selected' : ''}" 
              data-niche="herbal">
              <div class="niche-icon">🌿</div>
              <div class="niche-name">Herbal</div>
            </div>
            <div class="niche-card fashion ${state.project.niche === 'fashion' ? 'selected' : ''}" 
              data-niche="fashion">
              <div class="niche-icon">👗</div>
              <div class="niche-name">Fashion</div>
            </div>
            <div class="niche-card elektronik ${state.project.niche === 'elektronik' ? 'selected' : ''}" 
              data-niche="elektronik">
              <div class="niche-icon">📱</div>
              <div class="niche-name">Elektronik</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="wizard-footer">
      <div></div>
      <button class="btn btn-primary" onclick="nextStep()">
        Continue →
      </button>
    </div>
  `
}

// Step 2: Persona Selection
function renderStep2() {
  return `
    <div class="wizard-header">
      <h2 class="wizard-title">Step 2: Persona Selection</h2>
      <p class="wizard-subtitle">Choose your AI model character</p>
    </div>
    
    <div style="max-width: 700px; margin: 0 auto;">
      <!-- Filters -->
      <div class="flex gap-2 mb-3" style="flex-wrap: wrap;">
        <div class="form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
          <label class="form-label">Gender</label>
          <div class="flex gap-1">
            <button class="btn btn-secondary" style="flex: 1;">♀ Wanita</button>
            <button class="btn btn-ghost" style="flex: 1;">♂ Pria</button>
          </div>
        </div>
        <div class="form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
          <label class="form-label">Skin Tone</label>
          <select class="form-input form-select">
            <option>Fair / Cerah</option>
            <option>Medium</option>
            <option>Tan / Sawo</option>
          </select>
        </div>
        <div class="form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
          <label class="form-label">Age Range</label>
          <select class="form-input form-select">
            <option>18-24</option>
            <option selected>25-30</option>
            <option>31-40</option>
            <option>40+</option>
          </select>
        </div>
      </div>
      
      <!-- Persona Grid -->
      <label class="form-label">Select Persona</label>
      <div class="persona-grid">
        ${renderPersonaCards()}
      </div>
    </div>
    
    <div class="wizard-footer">
      <button class="btn btn-secondary" onclick="prevStep()">
        ← Back
      </button>
      <button class="btn btn-primary" onclick="nextStep()">
        Continue →
      </button>
    </div>
  `
}

function renderPersonaCards() {
  const personas = [
    { id: 1, name: 'Sarah (Professional)', gender: 'Female', age: '25-30', tone: 'Fair' },
    { id: 2, name: 'Budi (Casual)', gender: 'Male', age: '20-25', tone: 'Tan' },
    { id: 3, name: 'Maya (Elegant)', gender: 'Female', age: '30-40', tone: 'Medium' },
    { id: 4, name: 'Andi (Energetic)', gender: 'Male', age: '25-30', tone: 'Medium' },
    { id: 5, name: 'Rina (Friendly)', gender: 'Female', age: '18-24', tone: 'Fair' },
    { id: 6, name: 'Dian (Mature)', gender: 'Female', age: '40+', tone: 'Tan' },
  ]

  return personas.map(p => `
    <div class="persona-card ${state.project.persona === p.id ? 'selected' : ''}" 
      data-persona="${p.id}" onclick="selectPersona(${p.id})">
      <div class="persona-image-placeholder" style="background: linear-gradient(135deg, ${getGradientColors(p.id)});">
        <span style="font-size: 2rem;">${p.gender === 'Female' ? '👩' : '👨'}</span>
      </div>
      <div class="persona-info">
        <div class="persona-name">${p.name}</div>
        <div class="persona-details">${p.gender}, ${p.age}</div>
      </div>
    </div>
  `).join('')
}

function getGradientColors(id) {
  const colors = [
    '#FF9A9E, #FECFEF', '#a18cd1, #fbc2eb', '#84fab0, #8fd3f4',
    '#fccb90, #d57eeb', '#e0c3fc, #8ec5fc', '#f093fb, #f5576c'
  ]
  return colors[id % colors.length]
}

// Helper to handle selection explicitly
window.selectPersona = function (id) {
  state.project.persona = id
  updateWizard() // Re-render to show selection
}

// Step 3: Master Image Generation
function renderStep3() {
  // Generate random seed for this session
  const seed = state.project.seed || Math.floor(Math.random() * 900000) + 100000
  state.project.seed = seed

  return `
    <div class="wizard-header">
      <h2 class="wizard-title">Step 3: Master Image Lock</h2>
      <p class="wizard-subtitle">Generate and lock your reference image for consistency</p>
    </div>
    
    <div class="wizard-content">
      <!-- Left: Master Image Preview -->
      <div class="card text-center" style="min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-primary); border: 2px dashed var(--border-color);">
        <div id="master-preview">
          ${state.project.masterImage ? `
            <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
              <img src="${state.project.masterImage}" style="max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Master Image">
              <div style="position: absolute; bottom: 10px; right: 10px;">
                <span class="param-value-badge">LOCKED</span>
              </div>
            </div>
          ` : `
            <div class="spinner mb-2" style="margin: 0 auto;"></div>
            <p class="text-secondary">Generating master image...</p>
          `}
        </div>
      </div>
      
      <!-- Right: Locked Parameters -->
      <div>
        <div class="card mb-3">
          <div class="flex items-center gap-2 mb-3">
            <span style="color: #F59E0B; font-size: 1.25rem;">🔒</span>
            <h3 style="margin: 0;">Locked Parameters</h3>
          </div>
          
          <div class="locked-params-list">
            <div class="locked-param-row">
              <span class="param-label">Seed</span>
              <span class="param-value-badge">${seed}</span>
            </div>
            <div class="locked-param-row">
              <span class="param-label">Lighting</span>
              <span class="param-value-badge">Cinematic</span>
            </div>
            <div class="locked-param-row">
              <span class="param-label">Face Lock</span>
              <span class="param-value-badge">Enabled</span>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Background</label>
          <select class="form-input form-select" id="background-select" onchange="updateBackground(this.value)">
            <option value="modern_living_room" ${state.project.background === 'modern_living_room' ? 'selected' : ''}>Modern Living Room</option>
            <option value="minimalist_kitchen" ${state.project.background === 'minimalist_kitchen' ? 'selected' : ''}>Minimalist Kitchen</option>
            <option value="modern_bedroom" ${state.project.background === 'modern_bedroom' ? 'selected' : ''}>Modern Bedroom</option>
            <option value="studio_white" ${state.project.background === 'studio_white' ? 'selected' : ''}>Studio White</option>
            <option value="outdoor_garden" ${state.project.background === 'outdoor_garden' ? 'selected' : ''}>Outdoor Garden</option>
          </select>
        </div>
        
        <div class="form-group mb-0">
          <label class="form-label">Style Preset</label>
          <div class="style-preset-buttons">
            <button class="btn ${state.project.stylePreset === 'vlog' ? 'btn-primary' : 'btn-secondary'}" onclick="setStylePreset('vlog')">Vlog</button>
            <button class="btn ${state.project.stylePreset === 'studio' ? 'btn-primary' : 'btn-secondary'}" onclick="setStylePreset('studio')">Studio</button>
            <button class="btn ${state.project.stylePreset === 'cinematic' ? 'btn-primary' : 'btn-secondary'}" onclick="setStylePreset('cinematic')">Cinematic</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="wizard-footer">
      <button class="btn btn-secondary" onclick="prevStep()">
        ← Back
      </button>
      <div class="flex gap-1">
        <button class="btn btn-ghost" onclick="regenerateMasterImage()">🔄 Regenerate</button>
        <button class="btn btn-primary" onclick="nextStep()">
          Lock & Continue →
        </button>
      </div>
    </div>
  `
}

// Step 4: Storyboard
function renderStep4() {
  // Generate storyboard using prompt engine
  const storyboard = generateStoryboard({
    globalLock: state.project.persona || 'indonesian_woman_fair',
    background: state.project.background || 'minimalist_kitchen',
    niche: state.project.niche || 'herbal',
    stylePreset: state.project.stylePreset || 'studio',
    productName: state.project.productName || 'Product'
  })

  // Store generated prompts
  state.project.generatedPrompts = storyboard

  const sceneInfo = [
    { type: 'HOOK', description: 'Menarik perhatian viewer', camera: 'Static → Subtle Zoom' },
    { type: 'BENEFIT', description: 'Menunjukkan manfaat produk', camera: 'Slow Pan Right' },
    { type: 'DEMO', description: 'Demo penggunaan produk', camera: 'Close-up Follow Focus' },
    { type: 'CTA', description: 'Ajakan untuk membeli', camera: 'Zoom In to Face' }
  ]

  return `
  < div class="wizard-header" >
      <h2 class="wizard-title">Step 4: Multi-Scene Storyboard</h2>
      <p class="wizard-subtitle">Review AI-generated prompts for each scene</p>
    </div >
    
    < !--Scene Timeline-- >
    <div class="scene-timeline">
      ${sceneInfo.map((s, idx) => `
        <div class="scene-card ${idx === 0 ? 'active' : ''}" data-scene="${idx + 1}">
          <div class="scene-number">Scene ${idx + 1}</div>
          <div class="scene-title">${s.type}</div>
          <div class="scene-duration">4s</div>
        </div>
      `).join('')}
    </div>
    
    <!--Scene Details-- >
    <div id="scene-details">
      ${storyboard.map((scene, idx) => `
        <div class="card mb-2 scene-detail ${idx === 0 ? '' : 'hidden'}" data-scene-detail="${scene.sceneNumber}">
          <div class="card-header">
            <div>
              <h3>Scene ${scene.sceneNumber} - ${scene.sceneType}</h3>
              <p class="text-secondary" style="font-size: 0.875rem; margin-top: 0.25rem;">${sceneInfo[idx].description}</p>
            </div>
            <span class="lock-badge">🔒 Consistency Locked</span>
          </div>
          
          <div class="grid gap-2 mb-3" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <div>
              <label class="form-label">Camera</label>
              <div class="text-primary">${sceneInfo[idx].camera}</div>
            </div>
            <div>
              <label class="form-label">Duration</label>
              <div class="text-primary">${scene.duration}</div>
            </div>
            <div>
              <label class="form-label">Negative Prompt</label>
              <div class="text-muted" style="font-size: 0.75rem;">${scene.negativePrompt}</div>
            </div>
          </div>
          
          <div>
            <label class="form-label">Full Video Prompt</label>
            <div class="prompt-content" style="border-radius: var(--border-radius-md); font-size: 0.8rem; max-height: 150px; overflow-y: auto;">${scene.prompt}</div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="wizard-footer">
      <button class="btn btn-secondary" onclick="prevStep()">
        ← Back
      </button>
      <button class="btn btn-primary" onclick="nextStep()">
        Generate Outputs →
      </button>
    </div>
`
}

// Step 5: Final Output
function renderStep5() {
  const prompts = state.project.generatedPrompts.length > 0
    ? state.project.generatedPrompts
    : generateStoryboard({
      globalLock: state.project.persona || 'indonesian_woman_fair',
      background: state.project.background || 'minimalist_kitchen',
      niche: state.project.niche || 'herbal',
      stylePreset: state.project.stylePreset || 'studio',
      productName: state.project.productName || 'Product'
    })

  const hasApiKey = state.apiKeys.gemini || state.apiKeys.replicate

  return `
  < div class="wizard-header" >
      <h2 class="wizard-title">Step 5: Generate & Export</h2>
      <p class="wizard-subtitle">Generate videos or copy prompts for external tools</p>
    </div >

  ${!hasApiKey ? `
      <div class="card mb-3" style="border-color: var(--warning); background: var(--warning-bg);">
        <div class="flex items-center gap-2">
          <span style="font-size: 1.5rem;">⚠️</span>
          <div>
            <strong>API Key Required</strong>
            <p class="text-secondary" style="margin: 0;">Add your Gemini or Replicate API key in <a href="#" onclick="navigateTo('settings')">Settings</a> to generate videos directly.</p>
          </div>
        </div>
      </div>
    ` : ''
    }
    
    < !--Video Preview Grid(9: 16 Portrait)-- >
    <div class="card mb-3">
      <div class="card-header">
        <div>
          <h3>🎬 Video Preview</h3>
          <p class="text-secondary" style="font-size: 0.75rem; margin-top: 0.25rem;">Format: 9:16 Portrait (TikTok/Reels/Shorts)</p>
        </div>
        <div class="flex gap-1">
          ${hasApiKey ? `<button class="btn btn-primary" onclick="generateAllVideos()">🚀 Generate All</button>` : ''}
        </div>
      </div>
      
      <div class="video-preview-grid">
        ${prompts.map((p, idx) => `
          <div class="video-preview-card" id="video-card-${idx}">
            <div class="video-frame" id="video-frame-${idx}">
              <div class="format-badge">9:16</div>
              <div class="video-frame-placeholder" id="video-placeholder-${idx}">
                <div class="icon">📹</div>
                <div class="text">Scene ${p.sceneNumber}<br>${p.sceneType}</div>
                ${hasApiKey ? `<button class="btn btn-ghost" style="font-size: 0.75rem; padding: 0.5rem;" onclick="generateSingleVideo(${idx})">Generate</button>` : ''}
              </div>
            </div>
            <div class="video-preview-label">
              <div class="scene-info">
                <span class="scene-name">Scene ${p.sceneNumber}</span>
                <span class="scene-type">${p.sceneType}</span>
              </div>
              <span class="scene-badge">${p.duration}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <!--Prompts(Collapsible) -->
    <div class="card mb-3">
      <div class="card-header" style="cursor: pointer;" onclick="togglePrompts()">
        <h3>📝 Video Prompts</h3>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary" onclick="event.stopPropagation(); copyAllPrompts()">📋 Copy All</button>
          <span id="prompts-toggle-icon">▼</span>
        </div>
      </div>
      
      <div id="prompts-list" class="flex flex-col gap-2">
        ${prompts.map((p, idx) => `
          <div class="prompt-card" style="border: 1px solid var(--border-color);">
            <div class="prompt-header" style="padding: 0.75rem 1rem;">
              <div class="flex items-center gap-2">
                <span class="prompt-title" style="font-size: 0.8rem;">Scene ${p.sceneNumber}: ${p.sceneType}</span>
                <span class="lock-badge" style="font-size: 0.625rem;">🔒 ${p.duration}</span>
              </div>
              <button class="btn btn-ghost btn-icon" style="width: 32px; height: 32px;" onclick="copyPromptByIndex(${idx})" title="Copy Prompt">📋</button>
            </div>
            <div class="prompt-content" style="font-size: 0.75rem; max-height: 80px; overflow-y: auto; padding: 0.75rem 1rem;">${p.prompt}</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <!--Caption & Link-- >
    <div class="grid gap-2" style="grid-template-columns: 1fr 1fr;">
      <div class="card">
        <div class="card-header">
          <h3>📝 Caption Review (Soft-Sell)</h3>
          <button class="btn btn-ghost btn-icon">✏️</button>
        </div>
        <p class="text-secondary mb-2" style="line-height: 1.8; white-space: pre-line;">
"Udah coba produk ini belum? 🤔

Awalnya aku skeptis, tapi setelah 2 minggu pake... hasilnya bikin kaget! ✨

Texture-nya enak banget, cepet meresap, dan ga bikin lengket. Yang paling penting: ${state.project.niche === 'herbal' ? 'kulit jadi lebih cerah dan sehat!' : state.project.niche === 'fashion' ? 'kualitas bahannya premium banget!' : 'fitur-fiturnya lengkap dan worth it!'}

Yang mau coba, link ada di bio ya! 🛒

#review #${state.project.niche || 'product'} #affiliate #rekomendasi"
        </p>
        <button class="btn btn-secondary" style="width: 100%;" onclick="copyCaptionText()">📋 Copy Caption</button>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3>🔗 Affiliate Link</h3>
        </div>
        <div class="form-group">
          <label class="form-label">Original Link</label>
          <input class="form-input" id="original-link" value="${state.project.productLink || 'https://shopee.co.id/...'}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Shortened (for bio)</label>
          <div class="form-input" style="font-family: monospace;">
            bit.ly/produk-${Date.now().toString(36)}
          </div>
        </div>
        <div class="flex gap-1">
          <button class="btn btn-secondary" style="flex: 1;">📋 Copy Short Link</button>
          <button class="btn btn-ghost" style="flex: 1;">🔗 Open</button>
        </div>
      </div>
    </div>
    
    <div class="wizard-footer">
      <button class="btn btn-secondary" id="step-back">
        ← Back
      </button>
      <div class="flex gap-1">
        <button class="btn btn-secondary" onclick="saveProject()">💾 Save Project</button>
        <button class="btn btn-primary" onclick="navigateTo('dashboard')">
          ✅ Complete
        </button>
      </div>
    </div>
`
}

// ============================================
// Projects Page
// ============================================
function renderProjects() {
  return `
  < div class="page active" >
      <header class="flex justify-between items-center mb-4">
        <div>
          <h1>Projects</h1>
          <p>Manage your content projects</p>
        </div>
        <button class="btn btn-primary" onclick="navigateTo('new-project')">
          ➕ New Project
        </button>
      </header>
      
      <!--Filters -->
      <div class="card mb-3">
        <div class="flex gap-2" style="flex-wrap: wrap;">
          <input class="form-input" placeholder="Search projects..." style="flex: 1; min-width: 200px;">
          <select class="form-input form-select" style="width: auto;">
            <option>All Niches</option>
            <option>Herbal</option>
            <option>Fashion</option>
            <option>Elektronik</option>
          </select>
          <select class="form-input form-select" style="width: auto;">
            <option>Sort: Newest</option>
            <option>Sort: Oldest</option>
            <option>Sort: Name A-Z</option>
          </select>
        </div>
      </div>
      
      <!--Projects Grid-- >
  <div class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
    ${renderProjectCard('Skincare Review', 'Herbal', '3 hours ago', true)}
    ${renderProjectCard('Dress Promotion', 'Fashion', 'Yesterday', false)}
    ${renderProjectCard('Wireless Earbuds', 'Elektronik', '2 days ago', false)}
    ${renderProjectCard('Vitamin C Serum', 'Herbal', '3 days ago', false)}
    ${renderProjectCard('Summer Collection', 'Fashion', '1 week ago', false)}
    ${renderProjectCard('Smart Watch', 'Elektronik', '1 week ago', false)}
  </div>
    </div >
  `
}

// ============================================
// Assets Page
// ============================================
function renderAssets() {
  return `
  < div class="page active" >
      <header class="mb-4">
        <h1>Asset Library</h1>
        <p>Browse personas and backgrounds for your content</p>
      </header>
      
      <!--Tabs -->
      <div class="flex gap-1 mb-3">
        <button class="btn btn-primary">🎭 Personas</button>
        <button class="btn btn-secondary">🏠 Backgrounds</button>
      </div>
      
      <!--Filters -->
      <div class="card mb-3">
        <div class="flex gap-2" style="flex-wrap: wrap;">
          <select class="form-input form-select" style="width: auto;">
            <option>All Genders</option>
            <option>Female</option>
            <option>Male</option>
          </select>
          <select class="form-input form-select" style="width: auto;">
            <option>All Skin Tones</option>
            <option>Fair</option>
            <option>Medium</option>
            <option>Tan</option>
          </select>
          <select class="form-input form-select" style="width: auto;">
            <option>All Ages</option>
            <option>18-24</option>
            <option>25-30</option>
            <option>31-40</option>
            <option>40+</option>
          </select>
        </div>
      </div>
      
      <!--Persona Grid-- >
  <div class="persona-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));">
    ${Array(12).fill().map(() => `
          <div class="persona-card">
            <div class="persona-placeholder">👤</div>
          </div>
        `).join('')}
  </div>
    </div >
  `
}

// ============================================
// Settings Page
// ============================================
function renderSettings() {
  return `
    <div class="page active">
      <header class="mb-4">
        <h1>Settings</h1>
        <p>Configure your API keys and preferences</p>
      </header>
      
      <div style="max-width: 600px;">
        <!-- API Keys -->
        <div class="card mb-3">
          <h3 class="mb-2">🔑 API Keys for Video Generation</h3>
          <p class="text-secondary mb-3" style="font-size: 0.875rem;">
            Add at least one API key to enable direct video generation. Videos will be generated using Google Veo or Replicate.
          </p>
          
          <div class="form-group">
            <label class="form-label">Google Gemini API Key (for Veo)</label>
            <input class="form-input" type="password" id="gemini-api-key" 
              placeholder="AIza..." 
              value="${state.apiKeys.gemini ? '••••••••••••' : ''}">
            <small class="text-muted">Get your key from <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a></small>
          </div>
          
          <div class="form-group mb-0">
            <label class="form-label">Replicate API Key (alternative)</label>
            <input class="form-input" type="password" id="replicate-api-key" 
              placeholder="r8_..." 
              value="${state.apiKeys.replicate ? '••••••••••••' : ''}">
            <small class="text-muted">Get your key from <a href="https://replicate.com/account/api-tokens" target="_blank">Replicate</a></small>
          </div>
        </div>

        <!-- Preferences -->
        <div class="card mb-3">
          <h3 class="mb-2">⚙️ Default Preferences</h3>
          <div class="form-group">
            <label class="form-label">Default Niche</label>
            <select class="form-input form-select" id="default-niche">
              <option value="">None</option>
              <option value="herbal">Herbal</option>
              <option value="fashion">Fashion</option>
              <option value="elektronik">Elektronik</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Default Style Preset</label>
            <select class="form-input form-select" id="default-style">
              <option value="studio">Studio</option>
              <option value="vlog">Vlog</option>
              <option value="cinematic">Cinematic</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Preferred Video Provider</label>
            <select class="form-input form-select" id="video-provider">
              <option value="gemini">Google Veo (Gemini)</option>
              <option value="replicate">Replicate</option>
            </select>
          </div>
        </div>
        
        <!-- Save -->
        <button class="btn btn-primary" onclick="saveSettings()">💾 Save Settings</button>
      </div>
    </div>
  `
}

// ============================================
// Wizard Initialization & Event Handlers
// ============================================
function initWizard() {
  // Reset step if needed
  if (state.currentStep < 1) state.currentStep = 1
  if (state.currentStep > 5) state.currentStep = 5

  // Next button
  const nextBtn = document.getElementById('step-next')
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.currentStep < state.totalSteps) {
        state.currentStep++
        updateWizard()
      }
    })
  }

  // Back button
  const backBtn = document.getElementById('step-back')
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (state.currentStep > 1) {
        state.currentStep--
        updateWizard()
      }
    })
  }

  // Upload zone
  const uploadZone = document.getElementById('upload-zone')
  const fileInput = document.getElementById('product-image-input')

  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', () => fileInput.click())

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      uploadZone.classList.add('dragover')
    })

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover')
    })

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault()
      uploadZone.classList.remove('dragover')
      const file = e.dataTransfer.files[0]
      if (file) handleFileUpload(file)
    })

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) handleFileUpload(file)
    })
  }

  // Niche selector
  const nicheCards = document.querySelectorAll('.niche-card')
  nicheCards.forEach(card => {
    card.addEventListener('click', () => {
      nicheCards.forEach(c => c.classList.remove('selected'))
      card.classList.add('selected')
      state.project.niche = card.dataset.niche
    })
  })

  // Persona selector
  const personaCards = document.querySelectorAll('.persona-card[data-persona]')
  personaCards.forEach(card => {
    card.addEventListener('click', () => {
      personaCards.forEach(c => c.classList.remove('selected'))
      card.classList.add('selected')
      state.project.persona = parseInt(card.dataset.persona)
    })
  })

  // Scene cards
  const sceneCards = document.querySelectorAll('.scene-card')
  sceneCards.forEach(card => {
    card.addEventListener('click', () => {
      sceneCards.forEach(c => c.classList.remove('active'))
      card.classList.add('active')
    })
  })

  // Simulate master image generation
  // Simulate master image generation
  if (state.currentStep === 3 && !state.project.masterImage) {
    setTimeout(() => {
      // Double check if one was generated in the meantime
      if (state.project.masterImage) return;

      const preview = document.getElementById('master-preview')
      if (preview) {
        preview.innerHTML = `
          <div style="font-size: 6rem; margin-bottom: 1rem;">🎭</div>
          <p class="text-secondary">Master Image Generated (Simulated)</p>
          <span class="param-value-badge" style="margin-top: 0.5rem;">LOCKED</span>
        `
      }
      // Set dummy master image to allow navigation
      state.project.masterImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwJSIgZmlsbD0iIzIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNpbXVsYXRlZCBNYXN0ZXIgSW1hZ2U8L3RleHQ+PC9zdmc+'
    }, 2000)
  }
}

function updateWizard() {
  // Update stepper
  const stepper = document.querySelector('.stepper')
  if (stepper) {
    stepper.innerHTML = renderStepper()
  }

  // Update content
  const content = document.getElementById('wizard-step-content')
  if (content) {
    content.innerHTML = renderWizardStep(state.currentStep)
    initWizard() // Re-init event listeners
  }
}

function handleFileUpload(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    state.project.productImage = e.target.result
    const uploadZone = document.getElementById('upload-zone')
    if (uploadZone) {
      uploadZone.classList.add('has-file')
      uploadZone.innerHTML = `<img src="${e.target.result}" class="upload-preview" alt="Product">`
    }
  }
  reader.readAsDataURL(file)
}

// ============================================
// Utility Functions
// ============================================
// ============================================
// Global Navigation Functions
// ============================================
window.nextStep = function () {
  // Validation
  if (state.currentStep === 1 && !state.project.productImage) {
    showToast('Please upload a product image first', 'error')
    return
  }

  if (state.currentStep === 2 && !state.project.persona) {
    showToast('Please select a persona', 'error')
    return
  }

  if (state.currentStep === 3 && !state.project.masterImage) {
    showToast('Please generate a master image first', 'error')
    return
  }

  if (state.currentStep < state.totalSteps) {
    state.currentStep++
    updateWizard()
  }
}

window.prevStep = function () {
  if (state.currentStep > 1) {
    state.currentStep--
    updateWizard()
  }
}

window.navigateTo = function (page) {
  const navItem = document.querySelector(`[data-page="${page}"]`)
  if (navItem) {
    navItem.click()
  }
}

window.copyToClipboard = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success')
  })
}

window.copyAllPrompts = function () {
  const prompts = document.querySelectorAll('.prompt-content')
  const allText = Array.from(prompts).map(p => p.textContent).join('\n\n---\n\n')
  navigator.clipboard.writeText(allText).then(() => {
    showToast('All prompts copied!', 'success')
  })
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container')
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast-container'
    document.body.appendChild(container)
  }

  const toast = document.createElement('div')
  toast.className = `toast ${type} `
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
`
  container.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

// ============================================
// Video Generation Functions
// ============================================
window.generateAllVideos = async function () {
  if (!state.apiKeys.gemini && !state.apiKeys.replicate) {
    showToast('Please add an API key in Settings first', 'error')
    return
  }

  // Initialize video service
  videoService.init({
    geminiApiKey: state.apiKeys.gemini,
    replicateApiKey: state.apiKeys.replicate,
    preferredProvider: state.apiKeys.gemini ? 'gemini' : 'replicate'
  })

  showToast('Starting video generation for all scenes...', 'info')

  for (let i = 0; i < state.project.generatedPrompts.length; i++) {
    await generateSingleVideo(i)
  }
}

window.generateSingleVideo = async function (index) {
  if (!state.apiKeys.gemini && !state.apiKeys.replicate) {
    showToast('Please add an API key in Settings first', 'error')
    return
  }

  const videoCard = document.getElementById(`video - card - ${index} `)
  const videoFrame = document.getElementById(`video - frame - ${index} `)
  const placeholder = document.getElementById(`video - placeholder - ${index} `)

  if (!videoFrame) return

  // Update card state
  videoCard?.classList.add('generating')

  // Show generating overlay in video frame
  videoFrame.innerHTML = `
  < div class="format-badge" > 9: 16</div >
    <div class="video-generating-overlay">
      <div class="progress-ring"></div>
      <div class="wave-animation">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>
      <div class="status-text">Generating Scene ${index + 1}...</div>
      <div class="progress-percent pulse-animation">Processing</div>
    </div>
`

  try {
    // Initialize video service
    videoService.init({
      geminiApiKey: state.apiKeys.gemini,
      replicateApiKey: state.apiKeys.replicate,
      preferredProvider: state.apiKeys.gemini ? 'gemini' : 'replicate'
    })

    const scene = state.project.generatedPrompts[index]
    const result = await videoService.generateVideo(scene.prompt, {
      aspectRatio: '9:16',
      duration: scene.duration
    })

    // Update to show pending with operation ID
    videoFrame.innerHTML = `
  < div class="format-badge" > 9: 16</div >
    <div class="video-generating-overlay">
      <div class="progress-ring"></div>
      <div class="status-text">Video is being generated<br><small style="color: var(--text-muted);">This may take 1-2 minutes</small></div>
      <div class="progress-percent pulse-animation">⏳ Waiting...</div>
    </div>
`

    // Poll for completion
    pollVideoStatus(index, result.operationId, result.provider)

  } catch (error) {
    videoCard?.classList.remove('generating')
    videoCard?.classList.add('error')

    videoFrame.innerHTML = `
  < div class="format-badge" > 9: 16</div >
    <div class="video-generating-overlay" style="background: rgba(239, 68, 68, 0.1);">
      <div style="font-size: 3rem;">❌</div>
      <div class="status-text" style="color: var(--error);">${error.message}</div>
      <button class="btn btn-ghost" style="font-size: 0.75rem;" onclick="generateSingleVideo(${index})">Retry</button>
    </div>
`
  }
}

async function pollVideoStatus(index, operationId, provider) {
  const videoCard = document.getElementById(`video - card - ${index} `)
  const videoFrame = document.getElementById(`video - frame - ${index} `)
  if (!videoFrame) return

  try {
    const status = await videoService.checkStatus(operationId, provider)

    if (status.status === 'COMPLETED') {
      videoCard?.classList.remove('generating')
      videoCard?.classList.add('completed')

      // Show video or download button
      videoFrame.innerHTML = `
  < div class="format-badge" > 9: 16</div >
    ${status.videoUrl ?
          `<video src="${status.videoUrl}" autoplay loop muted playsinline></video>
           <div class="video-completed-overlay">
             <a href="${status.videoUrl}" target="_blank" class="btn btn-primary">⬇️ Download</a>
             <button class="btn btn-ghost" onclick="window.open('${status.videoUrl}')">▶️ Play</button>
           </div>` :
          `<div class="video-generating-overlay" style="background: rgba(16, 185, 129, 0.15);">
             <div style="font-size: 3rem;">✅</div>
             <div class="status-text" style="color: var(--success);">Video Ready!</div>
           </div>`
        }
`
      showToast(`Scene ${index + 1} video ready!`, 'success')

    } else if (status.status === 'FAILED') {
      videoCard?.classList.remove('generating')
      videoCard?.classList.add('error')

      videoFrame.innerHTML = `
  < div class="format-badge" > 9: 16</div >
    <div class="video-generating-overlay" style="background: rgba(239, 68, 68, 0.1);">
      <div style="font-size: 3rem;">❌</div>
      <div class="status-text" style="color: var(--error);">${status.error || 'Generation failed'}</div>
      <button class="btn btn-ghost" style="font-size: 0.75rem;" onclick="generateSingleVideo(${index})">Retry</button>
    </div>
`
    } else {
      // Still pending, update progress and poll again
      const progressText = status.progress ? `${status.progress}% ` : 'Processing...'

      videoFrame.innerHTML = `
  < div class="format-badge" > 9: 16</div >
    <div class="video-generating-overlay">
      <div class="progress-ring"></div>
      <div class="status-text">Generating video<br><small style="color: var(--text-muted);">Scene ${index + 1}</small></div>
      <div class="progress-percent pulse-animation">${progressText}</div>
    </div>
`
      setTimeout(() => pollVideoStatus(index, operationId, provider), 10000)
    }
  } catch (error) {
    // Retry on error
    setTimeout(() => pollVideoStatus(index, operationId, provider), 15000)
  }
}

// Toggle prompts visibility
window.togglePrompts = function () {
  const promptsList = document.getElementById('prompts-list')
  const toggleIcon = document.getElementById('prompts-toggle-icon')

  if (promptsList && toggleIcon) {
    if (promptsList.classList.contains('hidden')) {
      promptsList.classList.remove('hidden')
      toggleIcon.textContent = '▼'
    } else {
      promptsList.classList.add('hidden')
      toggleIcon.textContent = '▶'
    }
  }
}

// ============================================
// Settings Functions
// ============================================
window.saveSettings = function () {
  const geminiKey = document.getElementById('gemini-api-key')?.value
  const replicateKey = document.getElementById('replicate-api-key')?.value
  // Only save if not the masked value
  if (geminiKey && !geminiKey.includes('•')) {
    localStorage.setItem('gemini_api_key', geminiKey)
    state.apiKeys.gemini = geminiKey
  }
  if (replicateKey && !replicateKey.includes('•')) {
    localStorage.setItem('replicate_api_key', replicateKey)
    state.apiKeys.replicate = replicateKey
  }

  // Update services
  videoService.init({
    geminiApiKey: state.apiKeys.gemini,
    replicateApiKey: state.apiKeys.replicate,
    preferredProvider: document.getElementById('video-provider')?.value || 'gemini'
  })

  imageService.init({
    geminiApiKey: state.apiKeys.gemini
  })

  showToast('Settings saved successfully!', 'success')
}

window.saveProject = function () {
  const projectData = JSON.stringify(state.project)
  localStorage.setItem('current_project', projectData)
  showToast('Project saved!', 'success')
}

window.copyPromptByIndex = function (index) {
  const prompt = state.project.generatedPrompts[index]
  if (prompt) {
    navigator.clipboard.writeText(prompt.prompt).then(() => {
      showToast(`Scene ${index + 1} prompt copied!`, 'success')
    })
  }
}

window.copyCaptionText = function () {
  const captionEl = document.querySelector('.card p.text-secondary')
  if (captionEl) {
    navigator.clipboard.writeText(captionEl.textContent).then(() => {
      showToast('Caption copied!', 'success')
    })
  }
}

// ============================================
// Step 3 Helper Functions
// ============================================
window.setStylePreset = function (preset) {
  state.project.stylePreset = preset
  // Refresh wizard to update button states
  updateWizard()
  showToast(`Style preset set to ${preset}`, 'success')
}

window.updateBackground = function (value) {
  state.project.background = value
  showToast(`Background updated`, 'success')
}

window.regenerateMasterImage = async function () {
  // Generate new seed
  state.project.seed = Math.floor(Math.random() * 900000) + 100000

  // Show regenerating state
  const preview = document.getElementById('master-preview')
  if (preview) {
    preview.innerHTML = `
      <div class="spinner mb-2" style="margin: 0 auto;"></div>
      <p class="text-secondary">Generating master image with Google Gemini...</p>
      <p class="text-muted" style="font-size: 0.75rem;">Seed: ${state.project.seed}</p>
    `
  }

  // Check if keys are available
  if (!state.apiKeys.gemini) {
    // Fallback to simulation if keys are missing
    setTimeout(() => {
      if (preview) {
        preview.innerHTML = `
          <div style="font-size: 4rem; margin-bottom: 1rem;">🎭</div>
          <p class="text-primary" style="font-weight: 600;">Master Image Generated (Simulated)</p>
          <p class="text-secondary" style="font-size: 0.75rem;">Add Google Gemini API Key in Settings for real generation</p>
          <span class="param-value-badge" style="margin-top: 0.5rem;">LOCKED</span>
        `
      }
      // Set dummy master image to allow navigation
      state.project.masterImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwJSIgZmlsbD0iIzIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNpbXVsYXRlZCBNYXN0ZXIgSW1hZ2U8L3RleHQ+PC9zdmc+'
      showToast('Simulated generation (No Gemini API Key)', 'warning')
    }, 1500)
    return
  }

  try {
    // Initialize service
    imageService.init({
      geminiApiKey: state.apiKeys.gemini
    })

    // Construct prompt
    const prompt = `Professional product photography of ${state.project.productName}, ${state.project.background}, ${state.project.stylePreset} style, high quality, 4k, photorealistic`

    const result = await imageService.generateImage(prompt, {
      seed: state.project.seed,
      width: 1024,
      height: 1024
    })

    if (preview) {
      preview.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
          <img src="${result.image}" style="max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Master Image">
          <div style="position: absolute; bottom: 10px; right: 10px;">
            <span class="param-value-badge">LOCKED</span>
          </div>
        </div>
      `
    }

    // Save master image to project state
    state.project.masterImage = result.image
    showToast('Master image generated successfully!', 'success')

  } catch (error) {
    console.error('Generation failed:', error)
    if (preview) {
      preview.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
        <p class="text-error">Generation Failed</p>
        <p class="text-secondary" style="font-size: 0.75rem;">${error.message}</p>
        <button class="btn btn-primary mt-2" onclick="regenerateMasterImage()">Try Again</button>
      `
    }
    showToast('Generation failed: ' + error.message, 'error')
  }
}
