 // Tour System JavaScript
class TourSystem {
    constructor(options) {
        this.options = {
            showProgress: true,
            animate: true,
            smoothScroll: true,
            allowClose: true,
            overlayClickNext: false,
            stagePadding: 4,
            stageRadius: 10,
            steps: [],
            ...options
        };
        
        this.currentStep = 0;
        this.isActive = false;
        this.elements = {
            overlay: null,
            spotlight: null,
            popover: null
        };
    }

    // Initialize the tour elements
    initialize() {
        // Create overlay
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'tour-overlay';
        if (this.options.overlayClickNext) {
            this.elements.overlay.addEventListener('click', () => this.next());
        }
        
        // Create spotlight
        this.elements.spotlight = document.createElement('div');
        this.elements.spotlight.className = 'tour-spotlight';
        if (this.options.animate) {
            this.elements.spotlight.classList.add('pulse');
        }
        
        // Create popover
        this.elements.popover = document.createElement('div');
        this.elements.popover.className = 'tour-popover';
        
        // Add elements to DOM
        document.body.appendChild(this.elements.overlay);
        document.body.appendChild(this.elements.spotlight);
        document.body.appendChild(this.elements.popover);
    }

    // Start the tour
    drive() {
        if (this.isActive || this.options.steps.length === 0) return;
        
        this.isActive = true;
        this.currentStep = 0;
        this.initialize();
        this.showStep(this.currentStep);
        
        // Handle escape key to close tour
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.options.allowClose) {
                this.close();
            } else if (e.key === 'ArrowRight') {
                this.next();
            } else if (e.key === 'ArrowLeft') {
                this.previous();
            }
        });
    }

    // Show a specific step
    showStep(index) {
        if (index < 0 || index >= this.options.steps.length) return;
        
        const step = this.options.steps[index];
        
        // Highlight the element if specified
        if (step.element) {
            const targetElement = typeof step.element === 'string' 
                ? document.querySelector(step.element) 
                : step.element;
            
            if (targetElement) {
                // Scroll to element if needed
                if (this.options.smoothScroll) {
                    this.scrollToElement(targetElement);
                }
                
                // Position spotlight over the element
                this.highlightElement(targetElement);
            } else {
                // If element not found, hide spotlight
                this.elements.spotlight.style.display = 'none';
            }
        } else {
            // If no element specified, hide spotlight
            this.elements.spotlight.style.display = 'none';
        }
        
        // Show popover
        this.showPopover(step);
    }

    // Highlight an element with the spotlight
    highlightElement(element) {
        const rect = element.getBoundingClientRect();
        const padding = this.options.stagePadding;
        
        this.elements.spotlight.style.display = 'block';
        this.elements.spotlight.style.top = (rect.top - padding + window.scrollY) + 'px';
        this.elements.spotlight.style.left = (rect.left - padding + window.scrollX) + 'px';
        this.elements.spotlight.style.width = (rect.width + padding * 2) + 'px';
        this.elements.spotlight.style.height = (rect.height + padding * 2) + 'px';
        this.elements.spotlight.style.borderRadius = this.options.stageRadius + 'px';
    }

    // Show the popover with step information
    showPopover(step) {
        const popover = this.elements.popover;
        popover.innerHTML = '';
        
        // Add title
        if (step.popover && step.popover.title) {
            const title = document.createElement('div');
            title.className = 'tour-popover-title';
            title.textContent = step.popover.title;
            popover.appendChild(title);
        }
        
        // Add progress dots if enabled
        if (this.options.showProgress) {
            const progress = document.createElement('div');
            progress.className = 'tour-progress';
            
            for (let i = 0; i < this.options.steps.length; i++) {
                const dot = document.createElement('div');
                dot.className = 'tour-progress-dot';
                if (i === this.currentStep) {
                    dot.classList.add('active');
                }
                progress.appendChild(dot);
            }
            
            popover.appendChild(progress);
        }
        
        // Add description
        if (step.popover && step.popover.description) {
            const description = document.createElement('div');
            description.className = 'tour-popover-description';
            description.textContent = step.popover.description;
            popover.appendChild(description);
        }
        
        // Add navigation buttons
        const buttons = document.createElement('div');
        buttons.className = 'tour-buttons';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'tour-button tour-prev';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = this.currentStep === 0;
        prevBtn.addEventListener('click', () => this.previous());
        
        // Next/Finish button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'tour-button tour-next';
        nextBtn.textContent = this.currentStep === this.options.steps.length - 1 ? 'Finish' : 'Next';
        nextBtn.addEventListener('click', () => this.next());
        
        // Close button if allowed
        if (this.options.allowClose) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'tour-button tour-close';
            closeBtn.textContent = 'Skip';
            closeBtn.addEventListener('click', () => this.close());
            buttons.appendChild(closeBtn);
        }
        
        buttons.appendChild(prevBtn);
        buttons.appendChild(nextBtn);
        popover.appendChild(buttons);
        
        // Position the popover
        this.positionPopover(step);
        
        // Show with animation
        setTimeout(() => {
            popover.classList.add('show');
        }, 50);
    }

    // Position the popover relative to the highlighted element
    positionPopover(step) {
        const popover = this.elements.popover;
        popover.classList.remove('show');
        
        if (!step.element) {
            // Center in viewport if no element
            popover.style.top = '50%';
            popover.style.left = '50%';
            popover.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        const targetElement = typeof step.element === 'string' 
            ? document.querySelector(step.element) 
            : step.element;
            
        if (!targetElement) return;
        
        const targetRect = targetElement.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        const padding = this.options.stagePadding;
        
        // Default positioning
        const side = step.popover?.side || 'bottom';
        const align = step.popover?.align || 'center';
        
        // Remove any existing arrow
        const existingArrow = popover.querySelector('.tour-arrow');
        if (existingArrow) existingArrow.remove();
        
        // Create arrow
        const arrow = document.createElement('div');
        arrow.className = `tour-arrow ${side}`;
        popover.appendChild(arrow);
        
        // Position based on side and alignment
        let top, left;
        
        switch (side) {
            case 'top':
                top = targetRect.top - popoverRect.height - padding - 10 + window.scrollY;
                break;
            case 'bottom':
                top = targetRect.bottom + padding + 10 + window.scrollY;
                break;
            case 'left':
                left = targetRect.left - popoverRect.width - padding - 10 + window.scrollX;
                top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2) + window.scrollY;
                break;
            case 'right':
                left = targetRect.right + padding + 10 + window.scrollX;
                top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2) + window.scrollY;
                break;
        }
        
        if (side === 'top' || side === 'bottom') {
            switch (align) {
                case 'start':
                    left = targetRect.left + window.scrollX;
                    arrow.style.left = '20px';
                    break;
                case 'center':
                    left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2) + window.scrollX;
                    arrow.style.left = '50%';
                    arrow.style.marginLeft = '-10px';
                    break;
                case 'end':
                    left = targetRect.right - popoverRect.width + window.scrollX;
                    arrow.style.right = '20px';
                    break;
            }
        } else if (side === 'left' || side === 'right') {
            switch (align) {
                case 'start':
                    top = targetRect.top + window.scrollY;
                    arrow.style.top = '20px';
                    break;
                case 'center':
                    // Already set above
                    arrow.style.top = '50%';
                    arrow.style.marginTop = '-10px';
                    break;
                case 'end':
                    top = targetRect.bottom - popoverRect.height + window.scrollY;
                    arrow.style.bottom = '20px';
                    break;
            }
        }
        
        // Apply positions
        popover.style.top = top + 'px';
        popover.style.left = left + 'px';
        
        // Make sure popover is in viewport
        this.ensureInViewport(popover);
    }

    // Make sure the popover stays in the viewport
    ensureInViewport(popover) {
        const rect = popover.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let offsetX = 0;
        let offsetY = 0;
        
        // Check horizontal boundaries
        if (rect.left < 0) {
            offsetX = -rect.left + 10;
        } else if (rect.right > viewportWidth) {
            offsetX = viewportWidth - rect.right - 10;
        }
        
        // Check vertical boundaries
        if (rect.top < 0) {
            offsetY = -rect.top + 10;
        } else if (rect.bottom > viewportHeight) {
            offsetY = viewportHeight - rect.bottom - 10;
        }
        
        // Apply offsets if needed
        if (offsetX !== 0 || offsetY !== 0) {
            const currentTop = parseInt(popover.style.top, 10);
            const currentLeft = parseInt(popover.style.left, 10);
            
            popover.style.top = (currentTop + offsetY) + 'px';
            popover.style.left = (currentLeft + offsetX) + 'px';
            
            // Also adjust arrow if needed
            const arrow = popover.querySelector('.tour-arrow');
            if (arrow) {
                if (arrow.classList.contains('top') || arrow.classList.contains('bottom')) {
                    const arrowLeft = arrow.style.left;
                    if (arrowLeft.includes('%')) {
                        // Don't adjust percentage-based positions
                    } else if (arrowLeft) {
                        arrow.style.left = (parseInt(arrowLeft, 10) - offsetX) + 'px';
                    }
                }
            }
        }
    }

    // Scroll to make an element visible
    scrollToElement(element) {
        const rect = element.getBoundingClientRect();
        const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
        
        if (!isInViewport) {
            const scrollTop = rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
            window.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
            
            // Wait for scroll to complete before showing the step
            return new Promise(resolve => {
                setTimeout(resolve, 500);
            });
        }
        
        return Promise.resolve();
    }

    // Move to the next step
    next() {
        if (this.currentStep < this.options.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.close();
        }
    }

    // Move to the previous step
    previous() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    // Close the tour
    close() {
        if (!this.isActive) return;
        
        // Remove elements
        this.elements.overlay.remove();
        this.elements.spotlight.remove();
        this.elements.popover.remove();
        
        // Reset state
        this.isActive = false;
    }
}

// Function to create a new tour instance
function createTour(options) {
    return new TourSystem(options);
}

// Add the tour initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the tour button
    const tourButton = document.getElementById('startTour');
    
    if (tourButton) {
        tourButton.addEventListener('click', function() {
            // Disable button while tour is active
            this.disabled = true;
            this.textContent = 'Tour in Progress...';
            
            // Create and start the tour
            const tour = createTour({
                showProgress: true,
                animate: true,
                smoothScroll: true,
                allowClose: true,
                overlayClickNext: false,
                stagePadding: 4,
                stageRadius: 10,
                steps: [
                    { 
                        element: '.logo',
                        popover: { 
                            title: 'Welcome to Rainy Portfolio!', 
                            description: 'Let me guide you through my professional portfolio to help you get to know me better.', 
                            side: "bottom", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#languageToggle',
                        popover: { 
                            title: 'Language Toggle', 
                            description: 'You can switch between English and Spanish by clicking this button.', 
                            side: "bottom", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '.hero-content',
                        popover: { 
                            title: 'My Professional Summary', 
                            description: 'I\'m a Freelance Backend Developer specializing in automation and software development.', 
                            side: "bottom", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '#about .section-title',
                        popover: { 
                            title: 'About Me Section', 
                            description: 'Learn more about who I am, what I do, and why you should work with me.', 
                            side: "top", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '#whoTitle',
                        popover: { 
                            title: 'Who I Am', 
                            description: 'A passionate backend developer focused on process automation and system design.', 
                            side: "right", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#whatTitle',
                        popover: { 
                            title: 'What I Do', 
                            description: 'I create efficient, scalable technological solutions using clean architecture principles.', 
                            side: "right", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#whyTitle',
                        popover: { 
                            title: 'Why Work With Me', 
                            description: 'I combine technical expertise with strong problem-solving and communication skills.', 
                            side: "right", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#projects .section-title',
                        popover: { 
                            title: 'My Projects', 
                            description: 'Here are some of the key projects I\'ve worked on. Each demonstrates different aspects of my technical abilities.', 
                            side: "top", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '.project-card:nth-child(1)',
                        popover: { 
                            title: 'SyncTube API', 
                            description: 'A REST API for real-time multimedia content synchronization built with Python and FastAPI.', 
                            side: "left", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '.project-card:nth-child(2)',
                        popover: { 
                            title: 'POS System in Java', 
                            description: 'A modular point-of-sale system built with Clean Architecture principles and JavaFX.', 
                            side: "left", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '.project-card:nth-child(3)',
                        popover: { 
                            title: 'JavaCodeBox', 
                            description: 'A utility package for automation and parallel processing in Java.', 
                            side: "left", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '#skills .section-title',
                        popover: { 
                            title: 'Knowledge & Experience', 
                            description: 'A detailed breakdown of my technical skills, experience, and educational background.', 
                            side: "top", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '#techSkillsTitle',
                        popover: { 
                            title: 'Technical Skills', 
                            description: 'I\'m proficient in Java, Python, SQL, and various frameworks and technologies.', 
                            side: "right", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '.skill-item:nth-child(2)',
                        popover: { 
                            title: 'Java Expertise', 
                            description: 'Java is one of my strongest skills, with experience in OOP, concurrency, and various frameworks.', 
                            side: "right", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#workExpTitle',
                        popover: { 
                            title: 'Technical Training', 
                            description: 'I have extensive training in backend development, software architecture, and database design.', 
                            side: "left", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#contact .section-title',
                        popover: { 
                            title: 'Get In Touch', 
                            description: 'Interested in working together? Here\'s how you can reach me.', 
                            side: "top", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '.contact-info',
                        popover: { 
                            title: 'Contact Information', 
                            description: 'Feel free to email me or connect through GitHub for any professional inquiries.', 
                            side: "left", 
                            align: 'center' 
                        }
                    },
                    { 
                        popover: { 
                            title: 'Thank You for Visiting!', 
                            description: 'I hope this tour has given you a good overview of my skills and experience. I look forward to potentially working together on your next project!' 
                        } 
                    }
                ]
            });
            
            // Start the tour
            tour.drive();
            
            // Reset button when tour ends
            const resetButton = () => {
                if (!tour.isActive) {
                    tourButton.disabled = false;
                    tourButton.textContent = 'Start Tour';
                } else {
                    setTimeout(resetButton, 1000);
                }
            };
            
            setTimeout(resetButton, 1000);
        });
    }
});
