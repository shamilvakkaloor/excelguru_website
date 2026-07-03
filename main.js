document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (nav && nav.classList.contains('active') && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
            nav.classList.remove('active');
        }
    });

    // Close menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav && nav.classList.contains('active')) {
                nav.classList.remove('active');
            }
        });
    });

    // Sticky Header Scroll Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            header.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
        } else {
            header.style.boxShadow = 'none';
            header.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
        }
    });

    // Quick Request Form Handler
    const quickRequestForm = document.getElementById('quickRequestForm');
    if (quickRequestForm) {
        quickRequestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('requestName').value;
            const org = document.getElementById('requestOrg').value;
            
            let message = `Hi, I am interested in training based on your website form.\nMy Name: ${name}`;
            if (org) {
                message += `\nOrganization: ${org}`;
            }
            
            const encodedMessage = encodeURIComponent(message);
            window.location.href = `https://wa.me/918590010981?text=${encodedMessage}`;
        });
    }
});
