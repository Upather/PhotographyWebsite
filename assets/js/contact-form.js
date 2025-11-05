/**
 * Contact Form Enhancements
 * Agent 1: Contact Form Enhancements & Communication
 * 
 * Features:
 * - Enhanced validation and error handling
 * - Form submission confirmation messages and success states
 * - Email template customization
 * - Contact form analytics (submission tracking, popular inquiry types)
 * - Multi-channel contact options (phone, WhatsApp, contact form)
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    formspreeEndpoint: 'https://formspree.io/f/your-id',
    analyticsEnabled: true,
    localStorageKey: 'contactFormAnalytics',
    phoneNumber: '+27 12 345 6789', // Replace with actual phone number
    whatsappNumber: '+27123456789', // Replace with actual WhatsApp number (no spaces, with country code)
    emailAddress: 'hello@example.com' // Replace with actual email
  };

  // Analytics storage
  let analytics = {
    totalSubmissions: 0,
    serviceTypes: {},
    submissionDates: [],
    popularInquiries: {}
  };

  // Load analytics from localStorage
  function loadAnalytics() {
    try {
      const stored = localStorage.getItem(CONFIG.localStorageKey);
      if (stored) {
        analytics = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load analytics:', e);
    }
  }

  // Save analytics to localStorage
  function saveAnalytics() {
    try {
      localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(analytics));
    } catch (e) {
      console.warn('Failed to save analytics:', e);
    }
  }

  // Track submission for analytics
  function trackSubmission(formData) {
    if (!CONFIG.analyticsEnabled) return;

    analytics.totalSubmissions++;
    const serviceType = formData.get('service') || 'unknown';
    analytics.serviceTypes[serviceType] = (analytics.serviceTypes[serviceType] || 0) + 1;
    analytics.submissionDates.push(new Date().toISOString());
    
    // Track popular inquiry keywords (basic implementation)
    const message = (formData.get('message') || '').toLowerCase();
    const keywords = ['urgent', 'asap', 'wedding', 'event', 'campaign', 'editorial', 'fashion week'];
    keywords.forEach(keyword => {
      if (message.includes(keyword)) {
        analytics.popularInquiries[keyword] = (analytics.popularInquiries[keyword] || 0) + 1;
      }
    });

    // Keep only last 100 dates
    if (analytics.submissionDates.length > 100) {
      analytics.submissionDates = analytics.submissionDates.slice(-100);
    }

    saveAnalytics();
  }

  // Get analytics summary
  function getAnalyticsSummary() {
    const serviceEntries = Object.entries(analytics.serviceTypes);
    const popularService = serviceEntries.length > 0 
      ? serviceEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'N/A';
    
    return {
      total: analytics.totalSubmissions,
      popularService,
      serviceTypes: analytics.serviceTypes,
      popularInquiries: analytics.popularInquiries
    };
  }

  // Validation rules
  const validators = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'-]+$/,
      message: 'Name must be 2-100 characters and contain only letters, spaces, hyphens, or apostrophes'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    service: {
      required: true,
      message: 'Please select a service type'
    },
    message: {
      required: true,
      minLength: 10,
      maxLength: 2000,
      message: 'Message must be 10-2000 characters'
    }
  };

  // Validate field
  function validateField(field, value) {
    const validator = validators[field];
    if (!validator) return { valid: true };

    // Check required
    if (validator.required && (!value || value.trim().length === 0)) {
      return { valid: false, message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required` };
    }

    if (!value || value.trim().length === 0) {
      return { valid: true };
    }

    // Check min length
    if (validator.minLength && value.length < validator.minLength) {
      return { valid: false, message: validator.message || `Minimum ${validator.minLength} characters required` };
    }

    // Check max length
    if (validator.maxLength && value.length > validator.maxLength) {
      return { valid: false, message: validator.message || `Maximum ${validator.maxLength} characters allowed` };
    }

    // Check pattern
    if (validator.pattern && !validator.pattern.test(value)) {
      return { valid: false, message: validator.message || 'Invalid format' };
    }

    return { valid: true };
  }

  // Show field error
  function showFieldError(field, message) {
    const input = document.querySelector(`[name="${field}"]`);
    if (!input) return;

    const label = input.closest('label');
    if (!label) return;

    // Remove existing error
    hideFieldError(field);

    // Add error class
    input.classList.add('error');
    label.classList.add('has-error');

    // Create error message element
    const errorEl = document.createElement('span');
    errorEl.className = 'field-error';
    errorEl.textContent = message;
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'polite');
    label.appendChild(errorEl);
  }

  // Hide field error
  function hideFieldError(field) {
    const input = document.querySelector(`[name="${field}"]`);
    if (!input) return;

    const label = input.closest('label');
    if (!label) return;

    input.classList.remove('error');
    label.classList.remove('has-error');

    const errorEl = label.querySelector('.field-error');
    if (errorEl) errorEl.remove();
  }

  // Validate entire form
  function validateForm(form) {
    const formData = new FormData(form);
    let isValid = true;
    const errors = [];

    // Validate each field
    for (const [field, validator] of Object.entries(validators)) {
      const value = formData.get(field);
      const result = validateField(field, value);
      
      if (!result.valid) {
        isValid = false;
        errors.push({ field, message: result.message });
        showFieldError(field, result.message);
      } else {
        hideFieldError(field);
      }
    }

    // Focus first error field
    if (!isValid && errors.length > 0) {
      const firstErrorField = document.querySelector(`[name="${errors[0].field}"]`);
      if (firstErrorField) {
        firstErrorField.focus();
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return isValid;
  }

  // Show success message
  function showSuccessMessage(form) {
    const successEl = document.createElement('div');
    successEl.className = 'form-success';
    successEl.setAttribute('role', 'alert');
    successEl.setAttribute('aria-live', 'polite');
    successEl.innerHTML = `
      <div class="form-success-icon">✓</div>
      <h3>Thank you for your inquiry!</h3>
      <p>We've received your message and will get back to you within 24 hours.</p>
      <p class="form-success-subtitle">You can also reach us directly:</p>
      <div class="form-success-contacts">
        <a href="tel:${CONFIG.phoneNumber}" class="contact-link phone">${CONFIG.phoneNumber}</a>
        <a href="https://wa.me/${CONFIG.whatsappNumber}" target="_blank" rel="noopener noreferrer" class="contact-link whatsapp">WhatsApp</a>
        <a href="mailto:${CONFIG.emailAddress}" class="contact-link email">${CONFIG.emailAddress}</a>
      </div>
    `;

    form.parentNode.insertBefore(successEl, form);
    form.style.display = 'none';
    
    // Scroll to success message
    successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Show error message
  function showErrorMessage(message) {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    // Remove existing error message
    const existingError = form.querySelector('.form-error');
    if (existingError) existingError.remove();

    const errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'assertive');
    errorEl.textContent = message;

    form.insertBefore(errorEl, form.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.remove();
      }
    }, 5000);
  }

  // Set form loading state
  function setFormLoading(form, loading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    if (loading) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      const originalText = submitBtn.textContent;
      submitBtn.dataset.originalText = originalText;
      submitBtn.textContent = 'Sending...';
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.textContent = submitBtn.dataset.originalText || 'Send Inquiry';
    }
  }

  // Customize email template
  function customizeEmailTemplate(formData) {
    const name = formData.get('name');
    const email = formData.get('email');
    const service = formData.get('service');
    const message = formData.get('message');

    // Service type labels
    const serviceLabels = {
      safw: 'SA Fashion Week Coverage',
      sfw: 'Soweto Fashion Week Coverage',
      editorial: 'Editorial Shoot',
      campaign: 'Campaign Photography',
      lookbook: 'Lookbook',
      other: 'Other'
    };

    // Create custom subject
    const subject = `New Inquiry: ${serviceLabels[service] || 'Contact Form Submission'}`;

    // Create custom email body (for services that support it)
    const emailBody = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Service Type: ${serviceLabels[service] || service}
Message:
${message}

---
Submitted: ${new Date().toLocaleString()}
    `.trim();

    return {
      subject,
      body: emailBody,
      _replyto: email,
      _subject: subject
    };
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;

    // Validate form
    if (!validateForm(form)) {
      showErrorMessage('Please correct the errors below and try again.');
      return;
    }

    // Set loading state
    setFormLoading(form, true);

    // Remove any existing error messages
    const existingError = form.querySelector('.form-error');
    if (existingError) existingError.remove();

    try {
      const formData = new FormData(form);
      
      // Customize email template
      const emailData = customizeEmailTemplate(formData);
      
      // Add custom fields to form data
      for (const [key, value] of Object.entries(emailData)) {
        formData.append(key, value);
      }

      // Submit to Formspree
      const response = await fetch(CONFIG.formspreeEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Track submission
        trackSubmission(formData);
        
        // Show success message
        showSuccessMessage(form);
        
        // Reset form
        form.reset();
        
        // Log analytics (for admin/debugging)
        if (CONFIG.analyticsEnabled) {
          console.log('Form Analytics:', getAnalyticsSummary());
        }
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showErrorMessage(error.message || 'An error occurred. Please try again or contact us directly.');
    } finally {
      setFormLoading(form, false);
    }
  }

  // Real-time validation
  function setupRealTimeValidation() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    // Validate on blur
    form.addEventListener('blur', (e) => {
      if (e.target.matches('input, select, textarea') && e.target.name) {
        const value = e.target.value;
        const result = validateField(e.target.name, value);
        
        if (!result.valid) {
          showFieldError(e.target.name, result.message);
        } else {
          hideFieldError(e.target.name);
        }
      }
    }, true);

    // Clear errors on input
    form.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea') && e.target.name) {
        if (e.target.classList.contains('error')) {
          const value = e.target.value;
          const result = validateField(e.target.name, value);
          if (result.valid) {
            hideFieldError(e.target.name);
          }
        }
      }
    });
  }

  // Initialize
  function init() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    // Load analytics
    loadAnalytics();

    // Setup form submission
    form.addEventListener('submit', handleSubmit);

    // Setup real-time validation
    setupRealTimeValidation();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export analytics for admin panel (optional)
  window.contactFormAnalytics = {
    getSummary: getAnalyticsSummary,
    getFullAnalytics: () => analytics,
    reset: () => {
      analytics = {
        totalSubmissions: 0,
        serviceTypes: {},
        submissionDates: [],
        popularInquiries: {}
      };
      saveAnalytics();
    }
  };
})();

