document.addEventListener('DOMContentLoaded', () => {
    // Get all learn more buttons
    const learnMoreButtons = document.querySelectorAll('.learn-more');
    
    // Get all info sections
    const infoSections = document.querySelectorAll('.info-section');
    
    // Add click handlers to buttons
    learnMoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the section to show
            const sectionId = button.getAttribute('data-section');
            
            // Hide all sections first
            infoSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the selected section
            const sectionToShow = document.getElementById(sectionId);
            if (sectionToShow) {
                sectionToShow.classList.add('active');
                
                // Smooth scroll to the section
                sectionToShow.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll reveal animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
        observer.observe(card);
    });
}); 