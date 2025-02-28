document.addEventListener('DOMContentLoaded', () => {
    StorageManager.initializeStorage();
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    const tabIndicator = document.querySelector('.tab-indicator');

    // Tab switching with smooth animation
    tabBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            // Update tab indicator
            tabIndicator.style.left = `${index * 50}%`;
            
            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}Form`).classList.add('active');
        });
    });

    // Form validation and submission
    const showError = (element, message) => {
        element.textContent = message;
        element.parentElement.classList.add('error-shake');
        setTimeout(() => {
            element.parentElement.classList.remove('error-shake');
        }, 500);
    };

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('loginName').value.trim();
        const phone = document.getElementById('loginPhone').value.trim();
        const errorElement = document.getElementById('loginError');

        // Secret doctor login (hidden from UI)
        if (StorageManager.isDoctor(name, phone)) {
            StorageManager.setItem('currentUser', {
                isDoctor: true,
                ...StorageManager.DOCTOR_CREDENTIALS
            });
            
            // Add loading state
            const btn = loginForm.querySelector('.submit-btn');
            btn.innerHTML = '<span class="btn-text">Signing in...</span>';
            btn.disabled = true;

            // Simulate loading for smooth transition
            setTimeout(() => {
                window.location.href = 'pages/doctor.html';
            }, 800);
            return;
        }

        // Patient login
        const patients = StorageManager.getItem('patients') || [];
        const patient = patients.find(p => 
            p.name.toLowerCase() === name.toLowerCase() && 
            p.phone === phone
        );

        if (!patient) {
            showError(errorElement, 'Invalid credentials. Please try again.');
            return;
        }

        // Add loading state
        const btn = loginForm.querySelector('.submit-btn');
        btn.innerHTML = '<span class="btn-text">Signing in...</span>';
        btn.disabled = true;

        // Simulate loading for smooth transition
        setTimeout(() => {
            StorageManager.setItem('currentUser', patient);
            window.location.href = 'pages/patient.html';
        }, 800);
    });

    // Registration Form Handler
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('regName').value.trim();
        const age = document.getElementById('regAge').value;
        const phone = document.getElementById('regPhone').value.trim();
        const errorElement = document.getElementById('registerError');

        // Validate phone number
        if (!/^\d{10}$/.test(phone)) {
            showError(errorElement, 'Please enter a valid 10-digit phone number.');
            return;
        }

        // Check if patient exists
        const patients = StorageManager.getItem('patients') || [];
        if (patients.some(p => p.phone === phone)) {
            showError(errorElement, 'This phone number is already registered.');
            return;
        }

        // Create new patient
        const newPatient = {
            id: Date.now(),
            name,
            age: parseInt(age),
            phone,
            registrationDate: new Date().toISOString()
        };

        // Add loading state
        const btn = registerForm.querySelector('.submit-btn');
        btn.innerHTML = '<span class="btn-text">Creating account...</span>';
        btn.disabled = true;

        // Simulate loading for smooth transition
        setTimeout(() => {
            patients.push(newPatient);
            StorageManager.setItem('patients', patients);
            StorageManager.setItem('currentUser', newPatient);
            window.location.href = 'pages/patient.html';
        }, 800);
    });
}); 