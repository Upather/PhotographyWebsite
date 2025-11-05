/* Contact Form Enhancements & Communication */
(function () {
  'use strict';

  const form = document.querySelector('.contact-form');
  if (!form) return;

  // Form elements
  const nameInput = form.querySelector('input[name="name"]');
  const emailInput = form.querySelector('input[name="email"]');
  const serviceSelect = form.querySelector('select[name="service"]');
  const messageTextarea = form.querySelector('textarea[name="message"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  
  // Validation state
  const validationState = {
    name: { valid: false, message: '' },
    email: { valid: false, message: '' },
    service: { valid: false, message: '' },
    message: { valid: false, message: '' }
  };

  // Error message container
  let errorContainer = null;
  let successContainer = null;

  // Initialize form
  function initContactForm() {
    createMessageContainers();
    setupRealTimeValidation();
    setupFormSubmission();
    setupAnalytics();
  }

  // Create message containers
  function createMessageContainers() {
    // Error container
    errorContainer = document.createElement('div');
    errorContainer.className = 'form-messages form-error';
    errorContainer.setAttribute('role', 'alert');
    errorContainer.setAttribute('aria-live', 'polite');
    form.insertBefore(errorContainer, form.firstChild);

    // Success container
    successContainer = document.createElement('div');
    successContainer.className = 'form-messages form-success';
    successContainer.setAttribute('role', 'alert');
    successContainer.setAttribute('aria-live', 'polite');
    form.insertBefore(successContainer, form.firstChild);
  }

  // Email template customization
  function customizeEmailTemplate() {
    const name = nameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const service = serviceSelect?.value || '';
    const message = messageTextarea?.value.trim() || '';

    // Get service display name
    const serviceNames = {
      'safw': 'SA Fashion Week Coverage',
      'sfw': 'Soweto Fashion Week Coverage',
      'editorial': 'Editorial Shoot',
      'campaign': 'Campaign Photography',
      'lookbook': 'Lookbook',
      'other': 'Other'
    };
    const serviceDisplayName = serviceNames[service] || service;

    // Customize email subject
    const subjectInput = form.querySelector('input[name="_subject"]');
    if (subjectInput) {
      subjectInput.value = `New Photography Inquiry: ${serviceDisplayName} - ${name}`;
    }

    // Customize reply-to (optional - set to submitter's email)
    const replyToInput = form.querySelector('input[name="_replyto"]');
    if (replyToInput && email) {
      replyToInput.value = email;
    }

    // Add custom format with structured data
    const formatInput = form.querySelector('input[name="_format"]');
    if (formatInput) {
      formatInput.value = 'plain'; // Can be changed to 'html' if needed
    }

    // Add custom template variable (if using Formspree with custom templates)
    // This creates a structured email body
    const customData = {
      name: name,
      email: email,
      service: serviceDisplayName,
      message: message,
      timestamp: new Date().toLocaleString(),
      source: 'Website Contact Form'
    };

    // Add hidden field for structured data (if backend supports it)
    let customDataField = form.querySelector('input[name="_custom_data"]');
    if (!customDataField) {
      customDataField = document.createElement('input');
      customDataField.type = 'hidden';
      customDataField.name = '_custom_data';
      form.appendChild(customDataField);
    }
    customDataField.value = JSON.stringify(customData);
  }

  // Setup real-time validation
  function setupRealTimeValidation() {
    // Name validation
    nameInput?.addEventListener('blur', () => validateName());
    nameInput?.addEventListener('input', () => {
      if (validationState.name.message) validateName();
    });

    // Email validation
    emailInput?.addEventListener('blur', () => validateEmail());
    emailInput?.addEventListener('input', () => {
      if (validationState.email.message) validateEmail();
    });

    // Service validation
    serviceSelect?.addEventListener('change', () => validateService());

    // Message validation
    messageTextarea?.addEventListener('blur', () => validateMessage());
    messageTextarea?.addEventListener('input', () => {
      if (validationState.message.message) validateMessage();
    });
  }

  // Validation functions
  function validateName() {
    const value = nameInput?.value.trim() || '';
    const minLength = 2;
    const maxLength = 100;

    if (!value) {
      setFieldError(nameInput, 'Name is required');
      validationState.name = { valid: false, message: 'Name is required' };
      return false;
    }

    if (value.length < minLength) {
      setFieldError(nameInput, `Name must be at least ${minLength} characters`);
      validationState.name = { valid: false, message: `Name must be at least ${minLength} characters` };
      return false;
    }

    if (value.length > maxLength) {
      setFieldError(nameInput, `Name must be less than ${maxLength} characters`);
      validationState.name = { valid: false, message: `Name must be less than ${maxLength} characters` };
      return false;
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const namePattern = /^[a-zA-Z\s'-]+$/;
    if (!namePattern.test(value)) {
      setFieldError(nameInput, 'Name can only contain letters, spaces, hyphens, and apostrophes');
      validationState.name = { valid: false, message: 'Name contains invalid characters' };
      return false;
    }

    clearFieldError(nameInput);
    validationState.name = { valid: true, message: '' };
    return true;
  }

  function validateEmail() {
    const value = emailInput?.value.trim() || '';
    
    if (!value) {
      setFieldError(emailInput, 'Email is required');
      validationState.email = { valid: false, message: 'Email is required' };
      return false;
    }

    // Enhanced email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      setFieldError(emailInput, 'Please enter a valid email address');
      validationState.email = { valid: false, message: 'Invalid email format' };
      return false;
    }

    // Check for common typos
    const commonTypos = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmai.com': 'hotmail.com'
    };
    
    const domain = value.split('@')[1]?.toLowerCase();
    if (domain && commonTypos[domain]) {
      setFieldError(emailInput, `Did you mean ${value.split('@')[0]}@${commonTypos[domain]}?`);
      validationState.email = { valid: false, message: 'Possible typo in email domain' };
      return false;
    }

    clearFieldError(emailInput);
    validationState.email = { valid: true, message: '' };
    return true;
  }

  function validateService() {
    const value = serviceSelect?.value || '';
    
    if (!value) {
      setFieldError(serviceSelect, 'Please select a service type');
      validationState.service = { valid: false, message: 'Service selection is required' };
      return false;
    }

    clearFieldError(serviceSelect);
    validationState.service = { valid: true, message: '' };
    return true;
  }

  function validateMessage() {
    const value = messageTextarea?.value.trim() || '';
    const minLength = 10;
    const maxLength = 2000;

    if (!value) {
      setFieldError(messageTextarea, 'Project details are required');
      validationState.message = { valid: false, message: 'Message is required' };
      return false;
    }

    if (value.length < minLength) {
      setFieldError(messageTextarea, `Please provide more details (at least ${minLength} characters)`);
      validationState.message = { valid: false, message: `Message must be at least ${minLength} characters` };
      return false;
    }

    if (value.length > maxLength) {
      setFieldError(messageTextarea, `Message is too long (maximum ${maxLength} characters)`);
      validationState.message = { valid: false, message: `Message exceeds ${maxLength} characters` };
      return false;
    }

    clearFieldError(messageTextarea);
    validationState.message = { valid: true, message: '' };
    return true;
  }

  // Field error handling
  function setFieldError(field, message) {
    if (!field) return;
    
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) existingError.remove();

    // Add error message
    const errorMsg = document.createElement('span');
    errorMsg.className = 'field-error';
    errorMsg.textContent = message;
    errorMsg.setAttribute('role', 'alert');
    field.parentElement.appendChild(errorMsg);
  }

  function clearFieldError(field) {
    if (!field) return;
    
    field.removeAttribute('aria-invalid');
    field.classList.remove('error');
    
    const errorMsg = field.parentElement.querySelector('.field-error');
    if (errorMsg) errorMsg.remove();
  }

  // Validate all fields
  function validateAllFields() {
    const nameValid = validateName();
    const emailValid = validateEmail();
    const serviceValid = validateService();
    const messageValid = validateMessage();

    return nameValid && emailValid && serviceValid && messageValid;
  }

  // Form submission
  function setupFormSubmission() {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Hide previous messages
      hideMessages();

      // Validate all fields
      if (!validateAllFields()) {
        showError('Please correct the errors in the form before submitting.');
        submitBtn?.focus();
        return;
      }

      // Disable submit button
      const originalBtnText = submitBtn?.textContent || 'Send Inquiry';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        submitBtn.setAttribute('aria-busy', 'true');
      }

      try {
        // Track submission attempt
        trackFormSubmission('attempt', {
          service: serviceSelect?.value,
          timestamp: new Date().toISOString()
        });

        // Customize email template
        customizeEmailTemplate();

        // Submit form data
        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          // Success
          trackFormSubmission('success', {
            service: serviceSelect?.value,
            timestamp: new Date().toISOString()
          });

          showSuccess('Thank you! Your inquiry has been sent successfully. We\'ll get back to you within 24 hours.');
          form.reset();
          clearAllFieldErrors();
          
          // Reset validation state
          Object.keys(validationState).forEach(key => {
            validationState[key] = { valid: false, message: '' };
          });

          // Focus on name field after success
          setTimeout(() => nameInput?.focus(), 100);
        } else {
          // Server error
          const errorData = await response.json().catch(() => ({}));
          trackFormSubmission('error', {
            service: serviceSelect?.value,
            error: errorData.error || 'Server error',
            timestamp: new Date().toISOString()
          });

          throw new Error(errorData.error || 'Failed to send message. Please try again.');
        }
      } catch (error) {
        // Network or other error
        trackFormSubmission('error', {
          service: serviceSelect?.value,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        showError('Unable to send your message. Please check your connection and try again, or contact us directly via phone or WhatsApp.');
      } finally {
        // Re-enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
          submitBtn.removeAttribute('aria-busy');
        }
      }
    });
  }

  // Message display functions
  function showError(message) {
    if (!errorContainer) return;
    errorContainer.textContent = message;
    errorContainer.classList.add('show');
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-hide after 10 seconds
    setTimeout(() => hideError(), 10000);
  }

  function showSuccess(message) {
    if (!successContainer) return;
    successContainer.textContent = message;
    successContainer.classList.add('show');
    successContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-hide after 8 seconds
    setTimeout(() => hideSuccess(), 8000);
  }

  function hideError() {
    if (errorContainer) errorContainer.classList.remove('show');
  }

  function hideSuccess() {
    if (successContainer) successContainer.classList.remove('show');
  }

  function hideMessages() {
    hideError();
    hideSuccess();
  }

  function clearAllFieldErrors() {
    [nameInput, emailInput, serviceSelect, messageTextarea].forEach(field => {
      clearFieldError(field);
    });
  }

  // Analytics tracking
  function setupAnalytics() {
    // Track form interactions
    [nameInput, emailInput, serviceSelect, messageTextarea].forEach(field => {
      if (field) {
        field.addEventListener('focus', () => {
          trackFormInteraction('field_focus', field.name);
        });
      }
    });

    // Track service selection popularity
    serviceSelect?.addEventListener('change', () => {
      trackServiceSelection(serviceSelect.value);
    });
  }

  function trackFormSubmission(status, data) {
    try {
      // Store in localStorage for analytics
      const submissions = JSON.parse(localStorage.getItem('form_submissions') || '[]');
      submissions.push({
        status,
        ...data,
        id: Date.now().toString()
      });
      
      // Keep only last 100 submissions
      if (submissions.length > 100) {
        submissions.shift();
      }
      
      localStorage.setItem('form_submissions', JSON.stringify(submissions));

      // Track popular inquiry types
      if (status === 'success' && data.service) {
        const serviceStats = JSON.parse(localStorage.getItem('service_stats') || '{}');
        serviceStats[data.service] = (serviceStats[data.service] || 0) + 1;
        localStorage.setItem('service_stats', JSON.stringify(serviceStats));
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  function trackFormInteraction(type, fieldName) {
    try {
      const interactions = JSON.parse(localStorage.getItem('form_interactions') || '[]');
      interactions.push({
        type,
        field: fieldName,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 200 interactions
      if (interactions.length > 200) {
        interactions.shift();
      }
      
      localStorage.setItem('form_interactions', JSON.stringify(interactions));
    } catch (error) {
      console.warn('Interaction tracking failed:', error);
    }
  }

  function trackServiceSelection(service) {
    try {
      const selections = JSON.parse(localStorage.getItem('service_selections') || '[]');
      selections.push({
        service,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 selections
      if (selections.length > 100) {
        selections.shift();
      }
      
      localStorage.setItem('service_selections', JSON.stringify(selections));
    } catch (error) {
      console.warn('Service selection tracking failed:', error);
    }
  }

  // Public API for analytics
  window.contactFormAnalytics = {
    getSubmissionStats: function() {
      try {
        const submissions = JSON.parse(localStorage.getItem('form_submissions') || '[]');
        const serviceStats = JSON.parse(localStorage.getItem('service_stats') || '{}');
        
        const totalAttempts = submissions.filter(s => s.status === 'attempt').length;
        const totalSuccess = submissions.filter(s => s.status === 'success').length;
        const totalErrors = submissions.filter(s => s.status === 'error').length;
        const successRate = totalAttempts > 0 ? (totalSuccess / totalAttempts * 100).toFixed(1) : 0;

        return {
          totalAttempts,
          totalSuccess,
          totalErrors,
          successRate: successRate + '%',
          popularServices: Object.entries(serviceStats)
            .sort((a, b) => b[1] - a[1])
            .map(([service, count]) => ({ service, count }))
        };
      } catch (error) {
        console.warn('Failed to get analytics:', error);
        return null;
      }
    },
    clearAnalytics: function() {
      try {
        localStorage.removeItem('form_submissions');
        localStorage.removeItem('service_stats');
        localStorage.removeItem('form_interactions');
        localStorage.removeItem('service_selections');
        return true;
      } catch (error) {
        console.warn('Failed to clear analytics:', error);
        return false;
      }
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
>>>>>>> master
})();

