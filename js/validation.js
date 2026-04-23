// js/validation.js - Enhanced Validation and Error Handling
class ValidationManager {
    constructor() {
        this.validators = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^(\+254|0)?[7]\d{8}$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            name: /^[a-zA-Z\s]{2,50}$/,
            idNumber: /^\d{6,8}$/,
            county: /^[a-zA-Z\s]{2,30}$/,
            estate: /^[a-zA-Z0-9\s]{2,50}$/,
            street: /^[a-zA-Z0-9\s]{2,50}$/
        };
    }

    // Email validation
    validateEmail(email) {
        if (!email) return { valid: false, message: 'Email is required' };
        if (!this.validators.email.test(email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }
        return { valid: true };
    }

    // Phone validation (Kenyan format)
    validatePhone(phone) {
        if (!phone) return { valid: false, message: 'Phone number is required' };
        
        // Remove spaces and dashes
        const cleanPhone = phone.replace(/[\s-]/g, '');
        
        if (!this.validators.phone.test(cleanPhone)) {
            return { valid: false, message: 'Please enter a valid Kenyan phone number (e.g., +2547XX XXX XXX or 07XX XXX XXX)' };
        }
        return { valid: true };
    }

    // Password validation
    validatePassword(password) {
        if (!password) return { valid: false, message: 'Password is required' };
        
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }
        
        if (!this.validators.password.test(password)) {
            return { valid: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' };
        }
        
        return { valid: true };
    }

    // Name validation
    validateName(name, fieldName = 'Name') {
        if (!name) return { valid: false, message: `${fieldName} is required` };
        if (!this.validators.name.test(name)) {
            return { valid: false, message: `${fieldName} should only contain letters and spaces (2-50 characters)` };
        }
        return { valid: true };
    }

    // ID Number validation
    validateIdNumber(idNumber) {
        if (!idNumber) return { valid: false, message: 'ID number is required' };
        if (!this.validators.idNumber.test(idNumber)) {
            return { valid: false, message: 'ID number should be 6-8 digits' };
        }
        return { valid: true };
    }

    // Address validation
    validateAddress(address) {
        const errors = [];
        
        if (!address.county) {
            errors.push('County is required');
        } else if (!this.validators.county.test(address.county)) {
            errors.push('County should only contain letters and spaces');
        }
        
        if (!address.estate) {
            errors.push('Estate/Area is required');
        } else if (!this.validators.estate.test(address.estate)) {
            errors.push('Estate/Area should be 2-50 characters');
        }
        
        if (!address.street) {
            errors.push('Street is required');
        } else if (!this.validators.street.test(address.street)) {
            errors.push('Street should be 2-50 characters');
        }
        
        return {
            valid: errors.length === 0,
            message: errors.length > 0 ? errors.join(', ') : null
        };
    }

    // Form validation
    validateForm(formData, rules) {
        const errors = {};
        let isValid = true;

        for (const field in rules) {
            const rule = rules[field];
            const value = formData[field];

            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = `${rule.label || field} is required`;
                isValid = false;
                continue;
            }

            if (value && rule.validator) {
                const validation = this[rule.validator](value);
                if (!validation.valid) {
                    errors[field] = validation.message;
                    isValid = false;
                }
            }

            if (rule.minLength && value && value.length < rule.minLength) {
                errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
                isValid = false;
            }

            if (rule.maxLength && value && value.length > rule.maxLength) {
                errors[field] = `${rule.label || field} must not exceed ${rule.maxLength} characters`;
                isValid = false;
            }
        }

        return { isValid, errors };
    }

    // Real-time validation feedback
    setupRealTimeValidation(formElement, rules) {
        const inputs = formElement.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            const fieldName = input.name || input.id;
            const rule = rules[fieldName];
            
            if (rule) {
                input.addEventListener('blur', () => {
                    this.validateField(input, rule);
                });

                input.addEventListener('input', () => {
                    if (input.classList.contains('error')) {
                        this.validateField(input, rule);
                    }
                });
            }
        });
    }

    validateField(input, rule) {
        const value = input.value.trim();
        let isValid = true;
        let message = '';

        if (rule.required && !value) {
            isValid = false;
            message = `${rule.label || input.name} is required`;
        } else if (value && rule.validator) {
            const validation = this[rule.validator](value);
            isValid = validation.valid;
            message = validation.message || '';
        }

        this.showFieldValidation(input, isValid, message);
        return isValid;
    }

    showFieldValidation(input, isValid, message) {
        const feedbackElement = input.parentNode.querySelector('.validation-feedback');
        
        if (!isValid) {
            input.classList.add('error');
            input.classList.remove('valid');
            
            if (!feedbackElement) {
                const feedback = document.createElement('div');
                feedback.className = 'validation-feedback';
                feedback.textContent = message;
                feedback.style.cssText = `
                    color: #dc3545;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                `;
                input.parentNode.appendChild(feedback);
            } else {
                feedbackElement.textContent = message;
                feedbackElement.style.color = '#dc3545';
            }
        } else {
            input.classList.add('valid');
            input.classList.remove('error');
            
            if (feedbackElement) {
                feedbackElement.textContent = '';
            }
        }
    }

    // Clear all validation states
    clearValidation(formElement) {
        const inputs = formElement.querySelectorAll('input, select, textarea');
        const feedbackElements = formElement.querySelectorAll('.validation-feedback');
        
        inputs.forEach(input => {
            input.classList.remove('error', 'valid');
        });
        
        feedbackElements.forEach(element => {
            element.remove();
        });
    }
}

// Error handling utilities
class ErrorHandler {
    static handleApiError(error, context = '') {
        console.error(`API Error ${context}:`, error);
        
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const message = error.response.data?.message || error.response.data?.error || 'Unknown server error';
            
            switch (status) {
                case 400:
                    return { type: 'validation', message: 'Invalid data provided. Please check your inputs.' };
                case 401:
                    return { type: 'auth', message: 'Authentication required. Please login again.' };
                case 403:
                    return { type: 'permission', message: 'You do not have permission to perform this action.' };
                case 404:
                    return { type: 'notfound', message: 'The requested resource was not found.' };
                case 429:
                    return { type: 'ratelimit', message: 'Too many requests. Please try again later.' };
                case 500:
                    return { type: 'server', message: 'Server error. Please try again later.' };
                default:
                    return { type: 'unknown', message: `Error: ${message}` };
            }
        } else if (error.request) {
            // Network error
            return { type: 'network', message: 'Network error. Please check your connection and try again.' };
        } else {
            // Other error
            return { type: 'unknown', message: 'An unexpected error occurred. Please try again.' };
        }
    }

    static async withErrorHandling(asyncFunction, context = '') {
        try {
            return await asyncFunction();
        } catch (error) {
            const errorInfo = this.handleApiError(error, context);
            throw errorInfo;
        }
    }
}

// Global instances
window.validationManager = new ValidationManager();
window.errorHandler = ErrorHandler;
