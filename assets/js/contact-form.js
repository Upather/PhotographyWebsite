/* Contact Form Handler with Validation, Analytics, and Multi-channel Support */

(function() {
  'use strict';

  // Contact form configuration
  const config = {
    formspreeEndpoint: 'https://formspree.io/f/your-id',
    analyticsEnabled: true,
    useLocalStorage: true,
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    setupFormValidation(form);
    setupFormSubmission(form);
    setupMultiChannelOptions();
    loadAnalytics();
  }

  // Form validation with real-time feedback
  function setupFormValidation(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      // Real-time validation
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          validateField(input);
        }
      });
    });

    // Email validation
    const emailInput = form.querySelector('input[type="email"]');
    if (emailInput) {
      emailInput.addEventListener('input', (e) => {
        const email = e.target.value.trim();
        if (email && !isValidEmail(email)) {
          showFieldError(e.target, 'Please enter a valid email address');
        }
      });
    }

    // Name validation (min length, no numbers)
    const nameInput = form.querySelector('input[name="name"]');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        const name = e.target.value.trim();
        if (name && name.length < 2) {
          showFieldError(e.target, 'Name must be at least 2 characters');
        } else if (name && /[0-9]/.test(name)) {
          showFieldError(e.target, 'Name should not contain numbers');
        }
      });
    }

    // Message validation (min length)
    const messageInput = form.querySelector('textarea[name="message"]');
    if (messageInput) {
      messageInput.addEventListener('input', (e) => {
        const message = e.target.value.trim();
        if (message && message.length < 10) {
          showFieldError(e.target, 'Please provide more details (at least 10 characters)');
        }
      });
    }
  }

  function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required field check
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Type-specific validation
    if (value) {
      if (field.type === 'email' && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      } else if (field.tagName === 'SELECT' && field.value === '') {
        isValid = false;
        errorMessage = 'Please select an option';
      } else if (field.name === 'name' && value.length < 2) {
        isValid = false;
        errorMessage = 'Name must be at least 2 characters';
      } else if (field.name === 'message' && value.length < 10) {
        isValid = false;
        errorMessage = 'Message must be at least 10 characters';
      }
    }

    if (isValid) {
      clearFieldError(field);
    } else {
      showFieldError(field, errorMessage);
    }

    return isValid;
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function showFieldError(field, message) {
    clearFieldError(field);
    field.classList.add('error');
    
    const errorEl = document.createElement('span');
    errorEl.className = 'field-error';
    errorEl.textContent = message;
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'polite');
    
    field.parentElement.appendChild(errorEl);
    field.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(field) {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  // Form submission handler
  function setupFormSubmission(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate all fields
      const inputs = form.querySelectorAll('input, select, textarea');
      let isFormValid = true;
      
      inputs.forEach(input => {
        if (!validateField(input)) {
          isFormValid = false;
        }
      });

      if (!isFormValid) {
        showFormMessage('Please correct the errors below', 'error');
        return;
      }

      // Disable submit button and show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      submitBtn.classList.add('loading');

      try {
        // Collect form data
        const formData = new FormData(form);
        const service = formData.get('service');
        const serviceNames = {
          safw: 'SA Fashion Week Coverage',
          sfw: 'Soweto Fashion Week Coverage',
          editorial: 'Editorial Shoot',
          campaign: 'Campaign Photography',
          lookbook: 'Lookbook',
          other: 'Other Service',
        };
        
        const data = {
          name: formData.get('name'),
          email: formData.get('email'),
          service: service,
          'service-name': serviceNames[service] || service,
          message: formData.get('message'),
          _subject: `New Inquiry: ${serviceNames[service] || service} - ${formData.get('name')}`,
          _format: 'plain',
          _replyto: formData.get('email'),
          _template: 'default', // Can be customized in Formspree settings
        };

        // Track analytics
        if (config.analyticsEnabled) {
          trackFormSubmission(data);
        }

        // Submit to Formspree
        const response = await fetch(config.formspreeEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          // Success
          showFormMessage('Thank you! Your message has been sent successfully. We\'ll get back to you within 24 hours.', 'success');
          form.reset();
          inputs.forEach(input => clearFieldError(input));
          
          // Track success
          trackFormEvent('form_success', data);
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        showFormMessage('Sorry, there was an error sending your message. Please try again or contact us directly.', 'error');
        trackFormEvent('form_error', { error: error.message });
      } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.classList.remove('loading');
      }
    });
  }

  // Form message display
  function showFormMessage(message, type) {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    // Remove existing messages
    const existingMessage = form.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = `form-message form-message--${type}`;
    messageEl.setAttribute('role', 'alert');
    messageEl.setAttribute('aria-live', 'polite');
    messageEl.textContent = message;

    const submitBtn = form.querySelector('button[type="submit"]');
    form.insertBefore(messageEl, submitBtn);

    // Auto-dismiss after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        messageEl.style.opacity = '0';
        setTimeout(() => messageEl.remove(), 300);
      }, 5000);
    }

    // Scroll to message
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Multi-channel contact options
  function setupMultiChannelOptions() {
    const contactSection = document.getElementById('contact');
    if (!contactSection) return;

    // Check if multi-channel options already exist
    if (document.querySelector('.contact-channels')) return;

    const channelsContainer = document.createElement('div');
    channelsContainer.className = 'contact-channels';
    channelsContainer.innerHTML = `
      <div class="section-intro" style="margin-top: var(--spacing-xl);">
        <h3 class="section-title" style="font-size: 28px;">Other Ways to Reach Us</h3>
        <p class="section-description" style="font-size: 17px;">Prefer to contact us directly? Choose your preferred method.</p>
      </div>
      <div class="channels-grid">
        <a href="tel:+27123456789" class="channel-card" aria-label="Call us">
          <div class="channel-icon">📞</div>
          <h4>Phone</h4>
          <p>+27 12 345 6789</p>
          <span class="channel-action">Call Now</span>
        </a>
        <a href="https://wa.me/27123456789" target="_blank" rel="noopener noreferrer" class="channel-card" aria-label="Message us on WhatsApp">
          <div class="channel-icon">💬</div>
          <h4>WhatsApp</h4>
          <p>Chat with us instantly</p>
          <span class="channel-action">Start Chat</span>
        </a>
        <a href="mailto:hello@example.com" class="channel-card" aria-label="Send us an email">
          <div class="channel-icon">✉️</div>
          <h4>Email</h4>
          <p>hello@example.com</p>
          <span class="channel-action">Send Email</span>
        </a>
      </div>
    `;

    const form = contactSection.querySelector('.contact-form');
    if (form) {
      contactSection.insertBefore(channelsContainer, form.nextSibling);
    } else {
      contactSection.appendChild(channelsContainer);
    }
  }

  // Analytics tracking
  function trackFormSubmission(data) {
    const analytics = {
      timestamp: new Date().toISOString(),
      service: data.service,
      hasMessage: data.message && data.message.length > 0,
      messageLength: data.message ? data.message.length : 0,
    };

    // Store in localStorage
    if (config.useLocalStorage) {
      try {
        const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
        submissions.push(analytics);
        // Keep only last 100 submissions
        if (submissions.length > 100) {
          submissions.splice(0, submissions.length - 100);
        }
        localStorage.setItem('contactSubmissions', JSON.stringify(submissions));
      } catch (e) {
        console.warn('Could not save analytics to localStorage:', e);
      }
    }

    // Track event
    trackFormEvent('form_submission', analytics);
  }

  function trackFormEvent(eventType, data) {
    // Console log for debugging (can be replaced with actual analytics service)
    console.log('Contact Form Event:', eventType, data);

    // You can integrate with Google Analytics, Facebook Pixel, etc. here
    // Example:
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', eventType, {
    //     'event_category': 'Contact Form',
    //     'event_label': data.service || 'unknown',
    //   });
    // }
  }

  // Load and display analytics
  function loadAnalytics() {
    if (!config.useLocalStorage) return;

    try {
      const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
      if (submissions.length === 0) return;

      // Calculate statistics
      const serviceCounts = {};
      submissions.forEach(sub => {
        serviceCounts[sub.service] = (serviceCounts[sub.service] || 0) + 1;
      });

      // Log analytics summary (can be displayed in admin panel)
      console.log('Contact Form Analytics:', {
        totalSubmissions: submissions.length,
        serviceBreakdown: serviceCounts,
        averageMessageLength: submissions.reduce((sum, s) => sum + s.messageLength, 0) / submissions.length,
      });
    } catch (e) {
      console.warn('Could not load analytics:', e);
    }
  }

  // Export analytics function for admin panel
  window.contactFormAnalytics = {
    getSubmissions: () => {
      try {
        return JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
      } catch (e) {
        return [];
      }
    },
    getServiceStats: () => {
      const submissions = window.contactFormAnalytics.getSubmissions();
      const counts = {};
      submissions.forEach(sub => {
        counts[sub.service] = (counts[sub.service] || 0) + 1;
      });
      return counts;
    },
    clearAnalytics: () => {
      localStorage.removeItem('contactSubmissions');
    },
  };

})();

