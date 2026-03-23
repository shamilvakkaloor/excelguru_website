document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const institutionSelect = document.getElementById('institution');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');

    // Credentials Database
    let credentials = {};

    // Fetch and parse the CSV file
    fetch('downloads_data.csv')
        .then(response => response.text())
        .then(csvText => {
            const lines = csvText.split('\n');
            // Skip the header (index 0)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Split by comma
                const [name, pass, link] = line.split(',');

                if (name && pass && link) {
                    const id = 'inst_' + i;
                    credentials[id] = {
                        name: name.trim(),
                        pass: pass.trim(),
                        link: link.trim()
                    };

                    // Add to dropdown
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = name.trim();
                    institutionSelect.appendChild(option);
                }
            }
        })
        .catch(error => {
            console.error('Error loading downloads data:', error);
        });

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const selectedInst = institutionSelect.value;
            const inputPass = passwordInput.value.trim().toLowerCase(); // Case insensitive

            if (!selectedInst || !credentials[selectedInst]) {
                showError("Please select a valid institution.");
                return;
            }

            const correctCreds = credentials[selectedInst];

            // Case insensitive match for password
            if (inputPass === correctCreds.pass.toLowerCase()) {
                // Successful Login
                window.location.href = correctCreds.link;
            } else {
                // Failed Login
                showError("Invalid password.");
            }
        });
    }

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        // Shake animation could be added here
        passwordInput.style.borderColor = '#ef4444';

        // Reset styles after interaction
        passwordInput.addEventListener('input', resetError);
        institutionSelect.addEventListener('change', resetError);
    }

    function resetError() {
        errorMsg.style.display = 'none';
        passwordInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    }
});
