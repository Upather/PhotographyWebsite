/**
 * Contact Form Handler with Enhanced Validation, Analytics, and Multi-channel Support
 * Agent 1: Contact Form Enhancements & Communication
 */

// Initialize Firebase if available
let db = null;
let analyticsCollection = null;

try {
  if (window.firebase && window.firebaseConfig && window.firebaseConfig.apiKey !== "YOUR_API_KEY") {
    if (!window.firebase.apps || window.firebase.apps.length === 0) {
      window.firebase.initializeApp(window.firebaseConfig);
    }
    db = window.firebase.firestore();
    analyticsCollection = db.collection("contactAnalytics");
  }
} catch (error) {
  console.warn("Firebase not available for contact analytics:", error);
}

/**
 * Form validation utilities
 */
const validators = {
  name: (value) => {
    if (!value || value.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    if (value.trim().length > 100) {
      return "Name must be less than 100 characters";
    }
    if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes";
    }
    return null;
  },

  email: (value) => {
    if (!value || value.trim().length === 0) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return "Please enter a valid email address";
    }
    return null;
  },

  service: (value) => {
    if (!value || value.trim().length === 0) {
      return "Please select a service type";
    }
    return null;
  },

  message: (value) => {
    if (!value || value.trim().length < 10) {
      return "Message must be at least 10 characters";
    }
    if (value.trim().length > 2000) {
      return "Message must be less than 2000 characters";
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null; // Phone is optional
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(value.trim())) {
      return "Please enter a valid phone number";
    }
    if (value.replace(/\D/g, "").length < 10) {
      return "Phone number must have at least 10 digits";
    }
    return null;
  },
};

/**
 * Track form analytics
 */
async function trackFormSubmission(formData) {
  if (!analyticsCollection) return;

  try {
    const submissionData = {
      timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
      serviceType: formData.service || "unknown",
      hasPhone: !!formData.phone,
      messageLength: formData.message?.length || 0,
      source: "contact-form",
    };

    await analyticsCollection.add(submissionData);

    // Update popular inquiry types counter
    const inquiryTypeRef = analyticsCollection.doc("inquiryTypes");
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(inquiryTypeRef);
      const currentData = doc.data() || {};
      const serviceType = formData.service || "other";
      currentData[serviceType] = (currentData[serviceType] || 0) + 1;
      currentData.total = (currentData.total || 0) + 1;
      transaction.set(inquiryTypeRef, currentData);
    });
  } catch (error) {
    console.warn("Analytics tracking failed:", error);
    // Don't block form submission if analytics fails
  }
}

/**
 * Get popular inquiry types for display
 */
async function getPopularInquiryTypes() {
  if (!analyticsCollection) return null;

  try {
    const inquiryTypeRef = analyticsCollection.doc("inquiryTypes");
    const doc = await inquiryTypeRef.get();
    if (!doc.exists) return null;

    const data = doc.data();
    const types = Object.entries(data)
      .filter(([key]) => key !== "total")
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return types;
  } catch (error) {
    console.warn("Failed to fetch inquiry types:", error);
    return null;
  }
}

/**
 * Initialize contact form
 */
function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const formFields = {
    name: form.querySelector('input[name="name"]'),
    email: form.querySelector('input[name="email"]'),
    phone: form.querySelector('input[name="phone"]'),
    service: form.querySelector('select[name="service"]'),
    message: form.querySelector('textarea[name="message"]'),
  };

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || "Send Inquiry";

  // Create success/error message container
  let messageContainer = form.querySelector(".form-message");
  if (!messageContainer) {
    messageContainer = document.createElement("div");
    messageContainer.className = "form-message";
    form.insertBefore(messageContainer, submitButton);
  }

  // Real-time validation
  Object.entries(formFields).forEach(([fieldName, field]) => {
    if (!field) return;

    // Skip if field doesn't have a validator
    if (!validators[fieldName]) return;

    field.addEventListener("blur", () => {
      validateField(field, fieldName);
    });

    field.addEventListener("input", () => {
      // Clear error on input if field is valid
      if (field.classList.contains("error")) {
        const error = validators[fieldName](field.value);
        if (!error) {
          clearFieldError(field);
        }
      }
    });
  });

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate all fields
    let isValid = true;
    const formData = {};

    Object.entries(formFields).forEach(([fieldName, field]) => {
      if (!field) return;
      const value = field.value.trim();
      formData[fieldName] = value;

      if (validators[fieldName]) {
        const error = validators[fieldName](value);
        if (error) {
          showFieldError(field, error);
          isValid = false;
        } else {
          clearFieldError(field);
        }
      }
    });

    if (!isValid) {
      showFormMessage("Please correct the errors above", "error");
      return;
    }

    // Disable submit button
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
      submitButton.classList.add("loading");
    }

    try {
      // Track analytics
      await trackFormSubmission(formData);

      // Submit to FormSpree
      const formAction = form.getAttribute("action");
      const formMethod = form.getAttribute("method") || "POST";

      // Create FormData for FormSpree
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      if (formData.phone) {
        formDataToSend.append("phone", formData.phone);
      }
      formDataToSend.append("service", formData.service);
      formDataToSend.append("message", formData.message);
      formDataToSend.append("_subject", `New Contact Form Submission: ${formData.service}`);
      formDataToSend.append("_template", "box"); // Custom template
      formDataToSend.append("_format", "plain");

      const response = await fetch(formAction, {
        method: formMethod,
        headers: {
          Accept: "application/json",
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`Form submission failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.ok || result.success || response.status === 200) {
        // Success
        showFormMessage(
          "Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.",
          "success"
        );
        form.reset();
        clearAllFieldErrors();

        // Track successful submission
        if (analyticsCollection) {
          try {
            await analyticsCollection.add({
              timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
              status: "success",
              serviceType: formData.service,
            });
          } catch (error) {
            console.warn("Failed to track success:", error);
          }
        }
      } else {
        throw new Error(result.error || "Form submission failed");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showFormMessage(
        "Sorry, there was an error sending your message. Please try again or contact us directly.",
        "error"
      );

      // Track failed submission
      if (analyticsCollection) {
        try {
          await analyticsCollection.add({
            timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
            status: "error",
            error: error.message,
          });
        } catch (trackError) {
          console.warn("Failed to track error:", trackError);
        }
      }
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        submitButton.classList.remove("loading");
      }
    }
  });

  /**
   * Show field error
   */
  function showFieldError(field, errorMessage) {
    field.classList.add("error");
    field.setAttribute("aria-invalid", "true");

    // Remove existing error message
    const existingError = field.parentElement.querySelector(".field-error");
    if (existingError) {
      existingError.remove();
    }

    // Add error message
    const errorElement = document.createElement("span");
    errorElement.className = "field-error";
    errorElement.textContent = errorMessage;
    errorElement.setAttribute("role", "alert");
    field.parentElement.appendChild(errorElement);
  }

  /**
   * Clear field error
   */
  function clearFieldError(field) {
    field.classList.remove("error");
    field.removeAttribute("aria-invalid");
    const errorElement = field.parentElement.querySelector(".field-error");
    if (errorElement) {
      errorElement.remove();
    }
  }

  /**
   * Clear all field errors
   */
  function clearAllFieldErrors() {
    Object.values(formFields).forEach((field) => {
      if (field) clearFieldError(field);
    });
  }

  /**
   * Validate field
   */
  function validateField(field, fieldName) {
    const validator = validators[fieldName];
    if (!validator) return true;

    const error = validator(field.value);
    if (error) {
      showFieldError(field, error);
      return false;
    } else {
      clearFieldError(field);
      return true;
    }
  }

  /**
   * Show form message
   */
  function showFormMessage(message, type = "info") {
    messageContainer.textContent = message;
    messageContainer.className = `form-message form-message-${type}`;
    messageContainer.setAttribute("role", "alert");
    messageContainer.setAttribute("aria-live", "polite");

    // Scroll to message
    messageContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Auto-hide success messages after 10 seconds
    if (type === "success") {
      setTimeout(() => {
        messageContainer.textContent = "";
        messageContainer.className = "form-message";
        messageContainer.removeAttribute("role");
        messageContainer.removeAttribute("aria-live");
      }, 10000);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContactForm);
} else {
  initContactForm();
}

