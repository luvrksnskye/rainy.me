class TourSystem {
    constructor(options) {
        this.options = {
            showProgress: true,
            animate: true,
            smoothScroll: true,
            autoScroll: true,  
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

    initialize() {

        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'tour-overlay';
        if (this.options.overlayClickNext) {
            this.elements.overlay.addEventListener('click', () => this.next());
        }

        this.elements.spotlight = document.createElement('div');
        this.elements.spotlight.className = 'tour-spotlight';
        if (this.options.animate) {
            this.elements.spotlight.classList.add('pulse');
        }

        this.elements.popover = document.createElement('div');
        this.elements.popover.className = 'tour-popover';

        document.body.appendChild(this.elements.overlay);
        document.body.appendChild(this.elements.spotlight);
        document.body.appendChild(this.elements.popover);
    }

    drive() {
        if (this.isActive || this.options.steps.length === 0) return;

        this.isActive = true;
        this.currentStep = 0;
        this.initialize();
        this.showStep(this.currentStep);

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

    async showStep(index) {
        if (index < 0 || index >= this.options.steps.length) return;

        const step = this.options.steps[index];

        if (step.element) {
            const targetElement = typeof step.element === 'string' 
                ? document.querySelector(step.element) 
                : step.element;

            if (targetElement) {

                if (this.options.smoothScroll) {
                    await this.scrollToElement(targetElement);
                }

                this.highlightElement(targetElement);
            } else {

                this.elements.spotlight.style.display = 'none';
            }
        } else {

            this.elements.spotlight.style.display = 'none';
        }

        this.showPopover(step);
    }

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

    showPopover(step) {
        const popover = this.elements.popover;
        popover.innerHTML = '';
        popover.classList.remove('show');

        if (step.popover && step.popover.title) {
            const title = document.createElement('div');
            title.className = 'tour-popover-title';
            title.textContent = step.popover.title;
            popover.appendChild(title);
        }

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

        if (step.popover && step.popover.description) {
            const description = document.createElement('div');
            description.className = 'tour-popover-description';
            description.textContent = step.popover.description;
            popover.appendChild(description);
        }

        const buttons = document.createElement('div');
        buttons.className = 'tour-buttons';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'tour-button tour-prev';
        prevBtn.textContent = 'Prev';  
        prevBtn.disabled = this.currentStep === 0;
        prevBtn.addEventListener('click', () => this.previous());

        const nextBtn = document.createElement('button');
        nextBtn.className = 'tour-button tour-next';
        nextBtn.textContent = this.currentStep === this.options.steps.length - 1 ? 'Done' : 'Next';  
        nextBtn.addEventListener('click', () => this.next());

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

        this.positionPopover(step);

        setTimeout(() => {
            popover.classList.add('show');
        }, 50);
    }

    positionPopover(step) {
        const popover = this.elements.popover;

        if (!step.element) {

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
        const padding = this.options.stagePadding;

        const side = step.popover?.side || 'bottom';
        const align = step.popover?.align || 'center';

        const existingArrow = popover.querySelector('.tour-arrow');
        if (existingArrow) existingArrow.remove();

        const arrow = document.createElement('div');
        arrow.className = `tour-arrow ${side}`;
        popover.appendChild(arrow);

        popover.style.position = 'fixed';
        popover.style.top = '0';
        popover.style.left = '0';
        popover.style.visibility = 'hidden';
        popover.style.display = 'block';

        const popoverRect = popover.getBoundingClientRect();

        let top, left;

        switch (side) {
            case 'top':
                top = targetRect.top - popoverRect.height - padding - 10;
                break;
            case 'bottom':
                top = targetRect.bottom + padding + 10;
                break;
            case 'left':
                left = targetRect.left - popoverRect.width - padding - 10;
                top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2);
                break;
            case 'right':
                left = targetRect.right + padding + 10;
                top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2);
                break;
        }

        if (side === 'top' || side === 'bottom') {
            switch (align) {
                case 'start':
                    left = targetRect.left;
                    arrow.style.left = '20px';
                    break;
                case 'center':
                    left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2);
                    arrow.style.left = '50%';
                    arrow.style.marginLeft = '-10px';
                    break;
                case 'end':
                    left = targetRect.right - popoverRect.width;
                    arrow.style.right = '20px';
                    break;
            }
        } else if (side === 'left' || side === 'right') {
            switch (align) {
                case 'start':
                    top = targetRect.top;
                    arrow.style.top = '20px';
                    break;
                case 'center':

                    arrow.style.top = '50%';
                    arrow.style.marginTop = '-10px';
                    break;
                case 'end':
                    top = targetRect.bottom - popoverRect.height;
                    arrow.style.bottom = '20px';
                    break;
            }
        }

        popover.style.top = top + 'px';
        popover.style.left = left + 'px';
        popover.style.visibility = 'visible';

        this.ensureInViewport(popover);
    }

    ensureInViewport(popover) {
        const rect = popover.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let offsetX = 0;
        let offsetY = 0;

        if (rect.left < 10) {
            offsetX = 10 - rect.left;
        } else if (rect.right > viewportWidth - 10) {
            offsetX = viewportWidth - rect.right - 10;
        }

        if (rect.top < 10) {
            offsetY = 10 - rect.top;
        } else if (rect.bottom > viewportHeight - 10) {
            offsetY = viewportHeight - rect.bottom - 10;
        }

        if (offsetX !== 0 || offsetY !== 0) {
            const currentTop = parseInt(popover.style.top, 10);
            const currentLeft = parseInt(popover.style.left, 10);

            popover.style.top = (currentTop + offsetY) + 'px';
            popover.style.left = (currentLeft + offsetX) + 'px';

            const arrow = popover.querySelector('.tour-arrow');
            if (arrow) {
                if (arrow.classList.contains('top') || arrow.classList.contains('bottom')) {
                    const arrowLeft = arrow.style.left;
                    if (arrowLeft && !arrowLeft.includes('%')) {
                        arrow.style.left = (parseInt(arrowLeft, 10) - offsetX) + 'px';
                    }
                }
            }
        }
    }

    scrollToElement(element) {
        return new Promise(resolve => {
            const rect = element.getBoundingClientRect();

            const isInViewport = (
                rect.top >= 70 && 
                rect.left >= 0 &&
                rect.bottom <= window.innerHeight &&
                rect.right <= window.innerWidth
            );

            if (!isInViewport) {

                const scrollTop = rect.top + window.scrollY - (window.innerHeight / 3);

                window.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth'
                });

                setTimeout(resolve, 500);
            } else {
                resolve();
            }
        });
    }

    next() {
        if (this.currentStep < this.options.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.close();
        }
    }

    previous() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    close() {
        if (!this.isActive) return;

        this.elements.overlay.remove();
        this.elements.spotlight.remove();
        this.elements.popover.remove();

        this.isActive = false;
    }
}

function createTour(options) {
    return new TourSystem(options);
}

document.addEventListener('DOMContentLoaded', function() {

    const tourButton = document.getElementById('startTour');

    if (tourButton) {
        tourButton.addEventListener('click', function() {

            this.disabled = true;
            this.textContent = 'Tour in Progress...';

            const tour = createTour({
                showProgress: true,
                animate: true,
                smoothScroll: true,
                autoScroll: true,
                allowClose: true,
                overlayClickNext: false,
                stagePadding: 4,
                stageRadius: 10,
                steps: [
                    { 
                        element: '.logo',
                        popover: { 
                            title: 'Welcome!', 
                            description: 'Let me guide you through my professional portfolio.', 
                            side: "bottom", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#languageToggle',
                        popover: { 
                            title: 'Language Toggle', 
                            description: 'Switch between English and Spanish here.', 
                            side: "bottom", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '.hero-content',
                        popover: { 
                            title: 'Professional Summary', 
                            description: 'I\'m a Backend Developer specializing in automation and software development.', 
                            side: "bottom", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '#about .section-title',
                        popover: { 
                            title: 'About Me', 
                            description: 'Learn about who I am and what I do.', 
                            side: "top", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '#whoTitle',
                        popover: { 
                            title: 'Who I Am', 
                            description: 'A passionate developer focused on automation and system design.', 
                            side: "right", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#whatTitle',
                        popover: { 
                            title: 'What I Do', 
                            description: 'I create efficient, scalable technological solutions.', 
                            side: "right", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#whyTitle',
                        popover: { 
                            title: 'Why Work With Me', 
                            description: 'Technical expertise with strong problem-solving skills.', 
                            side: "right", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#projects .section-title',
                        popover: { 
                            title: 'My Projects', 
                            description: 'Key projects showcasing my technical abilities.', 
                            side: "top", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '.project-card:nth-child(1)',
                        popover: { 
                            title: 'SyncTube API', 
                            description: 'REST API for multimedia synchronization with Python and FastAPI.', 
                            side: "left", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '.project-card:nth-child(2)',
                        popover: { 
                            title: 'POS System', 
                            description: 'Modular point-of-sale system with Clean Architecture.', 
                            side: "left", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '.project-card:nth-child(3)',
                        popover: { 
                            title: 'JavaCodeBox', 
                            description: 'Utility package for automation in Java.', 
                            side: "left", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '#skills .section-title',
                        popover: { 
                            title: 'Skills & Experience', 
                            description: 'My technical skills and background.', 
                            side: "top", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '#techSkillsTitle',
                        popover: { 
                            title: 'Technical Skills', 
                            description: 'Proficient in Java, Python, SQL, and various frameworks.', 
                            side: "right", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '.skill-item:nth-child(2)',
                        popover: { 
                            title: 'Java Expertise', 
                            description: 'Experience in OOP, concurrency, and frameworks.', 
                            side: "right", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#workExpTitle',
                        popover: { 
                            title: 'Technical Training', 
                            description: 'Training in backend, architecture, and databases.', 
                            side: "left", 
                            align: 'start' 
                        }
                    },
                    { 
                        element: '#contact .section-title',
                        popover: { 
                            title: 'Get In Touch', 
                            description: 'Here\'s how you can reach me.', 
                            side: "top", 
                            align: 'center' 
                        }
                    },
                    { 
                        element: '.contact-info',
                        popover: { 
                            title: 'Contact Info', 
                            description: 'Email me or connect via GitHub for inquiries.', 
                            side: "left", 
                            align: 'center' 
                        }
                    },
                    { 
                        popover: { 
                            title: 'Thank You!', 
                            description: 'I hope this tour gave you a good overview. Looking forward to working together!' 
                        } 
                    }
                ]
            });

            tour.drive();

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