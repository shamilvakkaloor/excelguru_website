document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const institutionSelect = document.getElementById('institution');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');

    // Credentials Database
    const credentials = {
        'edublitz_learning': {
            user: 'abc',
            pass: '123',
            link: 'index.html' // Redirect to home for now
        },
        'excelguru_offline': {
            user: '123',
            pass: '123',
            link: 'index.html' // Redirect to home for now
        },
        'excelguru_workshop': {
            user: '123',
            pass: '123',
            link: 'index.html' // Redirect to home for now
        },
        'jamia_ainul_huda': {
            user: 'alihsan',
            pass: '123',
            link: 'https://drive.google.com/drive/folders/1nWuNueuFq80JcekpWhuYaw6UYGINrlgn?usp=sharing'
        },
        'jamia_ashariyya': {
            user: 'cac',
            pass: '123',
            link: 'index.html' // Redirect to home for now
        },
        'mastered_skill': {
            user: 'mastered',
            pass: '123',
            link: 'index.html' // Redirect to home for now
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const selectedInst = institutionSelect.value;
            const inputUser = usernameInput.value.trim().toLowerCase(); // Case insensitive
            const inputPass = passwordInput.value.trim().toLowerCase(); // Case insensitive

            if (!credentials[selectedInst]) {
                showError("Please select a valid institution.");
                return;
            }

            const correctCreds = credentials[selectedInst];

            if (inputUser === correctCreds.user && inputPass === correctCreds.pass) {
                // Successful Login
                window.location.href = correctCreds.link;
            } else {
                // Failed Login
                showError("Invalid username or password.");
            }
        });
    }

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        // Shake animation could be added here
        usernameInput.style.borderColor = '#ef4444';
        passwordInput.style.borderColor = '#ef4444';

        // Reset styles after interaction
        usernameInput.addEventListener('input', resetError);
        passwordInput.addEventListener('input', resetError);
        institutionSelect.addEventListener('change', resetError);
    }

    function resetError() {
        errorMsg.style.display = 'none';
        usernameInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        passwordInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    }
});
