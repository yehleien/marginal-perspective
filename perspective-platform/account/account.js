// perspective-platform/account.js

const DEFAULT_PERSPECTIVES = {
    'Age': {
        type: 'demographic',
        inputType: 'date',
        value: null,
        categoryType: 'demographic',
        verificationMethod: 'self-reported'
    },
    'Gender': {
        type: 'demographic',
        options: ['male', 'female', 'non-binary', 'other', 'prefer-not-to-say'],
        categoryType: 'demographic',
        verificationMethod: 'self-reported'
    },
    'Education Level': {
        type: 'sociographic',
        options: ['High School', 'Some College', 'Associates', 'Bachelors', 'Masters', 'Doctorate'],
        categoryType: 'sociographic',
        verificationMethod: 'self-reported'
    },
    'Industry': {
        type: 'professional',
        options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail'],
        categoryType: 'professional',
        verificationMethod: 'self-reported'
    },
    'Income Range': {
        type: 'economic',
        options: ['Under $30k', '$30k-$50k', '$50k-$75k', '$75k-$100k', '$100k-$150k', '$150k+'],
        categoryType: 'economic',
        verificationMethod: 'self-reported'
    },
    'Location Type': {
        type: 'geographic',
        options: ['Urban', 'Suburban', 'Rural'],
        categoryType: 'geographic',
        verificationMethod: 'self-reported'
    }
};

async function loadPerspectives() {
    try {
        const response = await fetch('/UserPerspective/list', {
            credentials: 'include'
        });
        const perspectives = await response.json();
        
        const tbody = document.querySelector('#perspectivesTable tbody');
        tbody.innerHTML = '';
        
        if (Array.isArray(perspectives)) {
            perspectives.forEach(p => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${p.name || ''}</td>
                    <td>${p.value || ''}</td>
                    <td>${p.source || ''}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            console.error('Unexpected perspectives data:', perspectives);
        }
    } catch (error) {
        console.error('Error loading perspectives:', error);
    }
}

function handleDateChange(name, value) {
    if (value) {
        const age = calculateAge(new Date(value));
        const row = document.querySelector(`tr:has(td:first-child:contains("${name}"))`);
        row.querySelector('.age-display').textContent = `Age: ${age}`;
        handleChange(name, value, age);
    }
}

function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function handleChange(name, value, age = null) {
    console.log('Saving perspective:', name, value);
    const data = {
        userId: window.userId,
        perspectiveName: name,
        value: value,
        type: DEFAULT_PERSPECTIVES[name].type,
        categoryType: DEFAULT_PERSPECTIVES[name].categoryType
    };
    if (age !== null) {
        data.age = age;
    }
    
    fetch('/UserPerspective/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            const row = document.querySelector(`tr:has(td:first-child:contains("${name}"))`);
            if (row) {
                const statusEl = row.querySelector('.status');
                if (statusEl) {
                    statusEl.textContent = 'Saved';
                    // Add visual feedback
                    statusEl.style.color = 'green';
                    setTimeout(() => {
                        statusEl.style.color = '';
                    }, 2000);
                }
            }
        }
    })
    .catch(error => {
        console.error('Error updating perspective:', error);
        // Show error to user
        const row = document.querySelector(`tr:has(td:first-child:contains("${name}"))`);
        if (row) {
            const statusEl = row.querySelector('.status');
            if (statusEl) {
                statusEl.textContent = 'Error saving';
                statusEl.style.color = 'red';
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    
    // Get all add email buttons
    const addEmailBtns = document.querySelectorAll('.add-email-button');
    
    addEmailBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            console.log('Add email button clicked');
            const emailInput = btn.previousElementSibling;
            const email = emailInput.value;

            if (!email) {
                alert('Please enter an email address');
                return;
            }

            try {
                const response = await fetch('/account/add-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ email })
                });

                const result = await response.json();
                
                if (result.success) {
                    emailInput.value = '';
                    const codeSent = await sendVerificationCode(email);
                    if (!codeSent) {
                        alert('Email added but failed to send verification code');
                    }
                    await loadEmails(); // Refresh the list
                } else {
                    alert(result.error || 'Failed to add email');
                }
            } catch (error) {
                console.error('Error adding email:', error);
                alert('Failed to add email');
            }
        });
    });

    // Initial load of emails
    console.log('Loading initial emails...');
    await loadEmails();

    // Add tab handling for profile tab
    document.getElementById('profileTab').addEventListener('click', async function() {
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.getElementById('profileContent').classList.add('active');
        this.classList.add('active');
        await loadEmails(); // Only load emails when profile tab is active
    });

    // Add tab handling for perspectives tab
    document.getElementById('perspectivesTab').addEventListener('click', function() {
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.getElementById('perspectivesContent').classList.add('active');
        this.classList.add('active');
        loadPerspectives(); // Only load perspectives when perspectives tab is active
    });

    document.getElementById('activityTab').addEventListener('click', function() {
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.getElementById('activityContent').classList.add('active');
        this.classList.add('active');
    });

    document.getElementById('integrationsTab').addEventListener('click', function() {
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.getElementById('integrationsContent').classList.add('active');
        this.classList.add('active');
    });

    // Load user profile
    await loadUserProfile();

    // Sidebar navigation logic
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            // Hide all sections
            document.querySelectorAll('.profile-section').forEach(section => section.style.display = 'none');
            // Remove active class from all sidebar items
            document.querySelectorAll('.sidebar-item').forEach(sidebarItem => sidebarItem.classList.remove('active'));
            // Show the selected section
            const sectionId = item.getAttribute('data-section');
            document.getElementById(`section-${sectionId}`).style.display = 'block';
            // Add active class to the clicked sidebar item
            item.classList.add('active');
        });
    });

    // Show the first section by default
    document.querySelector('.sidebar-item').click();
});

async function loadUserProfile() {
    try {
        const response = await fetch('/account/profile', {
            credentials: 'include'
        });
        const profile = await response.json();
        
        // Set values and lock fields if they exist
        const fields = {
            'primaryEmail': profile.email,
            'phoneNumber': profile.phoneNumber,
            'birthDate': profile.birthDate,
            'gender': profile.gender,
            'politicalAffiliation': profile.politicalAffiliation,
            'maritalStatus': profile.maritalStatus,
            'numberOfChildren': profile.numberOfChildren,
            'city': profile.address?.city,
            'state': profile.address?.state,
            'zipCode': profile.address?.zipCode,
            'hsGraduated': profile.education?.highSchool?.graduated,
            'hsName': profile.education?.highSchool?.schoolName,
            'hsYear': profile.education?.highSchool?.graduationYear,
            'ugGraduated': profile.education?.undergraduate?.graduated,
            'ugName': profile.education?.undergraduate?.schoolName,
            'ugYear': profile.education?.undergraduate?.graduationYear,
            'ugDegree': profile.education?.undergraduate?.degree,
            'ugMajor': profile.education?.undergraduate?.major,
            'gradGraduated': profile.education?.graduate?.graduated,
            'gradName': profile.education?.graduate?.schoolName,
            'gradYear': profile.education?.graduate?.graduationYear,
            'gradDegree': profile.education?.graduate?.degree,
            'gradField': profile.education?.graduate?.field
        };

        for (const [id, value] of Object.entries(fields)) {
            const field = document.getElementById(id);
            if (field && value) {
                field.value = id === 'birthDate' ? new Date(value).toISOString().split('T')[0] : value;
                field.readOnly = true;
                if (id === 'gender') {
                    field.disabled = true;
                } else {
                    field.classList.add('readonly-input');
                }
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Add form submission handler
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        phoneNumber: document.getElementById('phoneNumber').value,
        birthDate: document.getElementById('birthDate').value,
        gender: document.getElementById('gender').value,
        politicalAffiliation: document.getElementById('politicalAffiliation').value,
        maritalStatus: document.getElementById('maritalStatus').value,
        numberOfChildren: parseInt(document.getElementById('numberOfChildren').value) || 0,
        education: {
            highSchool: {
                graduated: document.getElementById('hsGraduated').checked,
                schoolName: document.getElementById('hsName').value,
                graduationYear: parseInt(document.getElementById('hsYear').value) || null
            },
            undergraduate: {
                graduated: document.getElementById('ugGraduated').checked,
                schoolName: document.getElementById('ugName').value,
                graduationYear: parseInt(document.getElementById('ugYear').value) || null,
                degree: document.getElementById('ugDegree').value,
                major: document.getElementById('ugMajor').value
            },
            graduate: {
                graduated: document.getElementById('gradGraduated').checked,
                schoolName: document.getElementById('gradName').value,
                graduationYear: parseInt(document.getElementById('gradYear').value) || null,
                degree: document.getElementById('gradDegree').value,
                field: document.getElementById('gradField').value
            }
        },
        address: {
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zipCode').value,
            country: 'United States'
        },
        // Employment History
        employmentHistory: Array.from(document.querySelectorAll('.employment-entry')).map(entry => ({
            companyName: entry.querySelector('.company-name').value,
            jobTitle: entry.querySelector('.job-title').value,
            startDate: entry.querySelector('.start-date').value,
            endDate: entry.querySelector('.end-date').value,
            salary: entry.querySelector('.salary').value
        })),
        // Financial Information
        incomeRange: document.getElementById('incomeRange').value,
        investments: Array.from(document.querySelectorAll('.investment-entry')).map(entry => ({
            type: entry.querySelector('.investment-type').value,
            symbol: entry.querySelector('.investment-symbol').value,
            quantity: entry.querySelector('.investment-quantity').value,
            purchasePrice: entry.querySelector('.investment-price').value
        })),
        mortgages: Array.from(document.querySelectorAll('.mortgage-entry')).map(entry => ({
            propertyAddress: entry.querySelector('.property-address').value,
            loanAmount: entry.querySelector('.loan-amount').value,
            interestRate: entry.querySelector('.interest-rate').value,
            startDate: entry.querySelector('.mortgage-start').value,
            loanTerm: entry.querySelector('.loan-term').value
        })),
        vehicles: Array.from(document.querySelectorAll('.vehicle-entry')).map(entry => ({
            make: entry.querySelector('.vehicle-make').value,
            model: entry.querySelector('.vehicle-model').value,
            year: entry.querySelector('.vehicle-year').value,
            vin: entry.querySelector('.vehicle-vin').value
        })),
        // Additional Personal Information
        religion: document.getElementById('religion').value,
        votingHistory: Array.from(document.querySelectorAll('.voting-entry')).map(entry => ({
            election: entry.querySelector('.election-name').value,
            date: entry.querySelector('.election-date').value,
            method: entry.querySelector('.voting-method').value,
            jurisdiction: entry.querySelector('.voting-jurisdiction').value
        }))
    };

    await saveProfile(formData);
});

async function loadEmails() {
    const emailsList = document.getElementById('emailsList');
    
    try {
        const response = await fetch('/account/emails', {
            credentials: 'include'
        });
        const emails = await response.json();
        
        emailsList.innerHTML = '';
        
        emails.forEach(email => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${email.email}</td>
                <td><span class="verification-badge ${email.isVerified ? 'verified' : 'pending'}">${email.isVerified ? 'Verified' : 'Pending'}</span></td>
                <td>${email.isPrimary ? '<span class="primary-badge">Primary</span>' : ''}</td>
                <td>
                    <div class="verification-actions">
                        ${!email.isVerified ? `
                            <input type="text" class="verification-code-input" placeholder="Enter code">
                            <button onclick="sendVerificationCode('${email.email}')" class="verify-btn">Send Code</button>
                            <button onclick="verifyCode('${email.email}', this.previousElementSibling.previousElementSibling.value)" class="verify-btn">Verify</button>
                        ` : ''}
                        ${!email.isPrimary ? `<button onclick="deleteEmail('${email.email}')" class="delete-btn">Delete</button>` : ''}
                    </div>
                </td>
            `;
            emailsList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading emails:', error);
    }
}

async function verifyCode(email, code) {
    try {
        const response = await fetch('/auth/email/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, code })
        });

        const result = await response.json();
        
        if (result.success) {
            await loadEmails(); // Refresh the list
        } else {
            alert(result.error || 'Invalid verification code');
        }
    } catch (error) {
        console.error('Error verifying email:', error);
        alert('Failed to verify email');
    }
}

async function sendVerificationCode(email) {
    try {
        console.log('Attempting to send verification code to:', email);
        const response = await fetch('/auth/email/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        console.log('Send verification response:', result);
        
        if (!response.ok) throw new Error('Failed to send code');
        return true;
    } catch (error) {
        console.error('Error sending verification code:', error);
        return false;
    }
}

async function generatePerspectives() {
    try {
        console.log('Starting perspective generation');
        const profileResponse = await fetch('/account/profile', {
            credentials: 'include'
        });
        const profile = await profileResponse.json();
        console.log('Profile data in generate:', profile);

        const perspectives = [];

        // Political Affiliation perspective
        if (profile.politicalAffiliation) {
            console.log('Adding political perspective:', profile.politicalAffiliation);
            perspectives.push({
                name: 'Political Affiliation',
                value: profile.politicalAffiliation,
                type: 'demographic',
                categoryType: 'demographic',
                source: 'profile'
            });
        }

        // Marital Status perspective
        if (profile.maritalStatus) {
            perspectives.push({
                name: 'Marital Status',
                value: profile.maritalStatus,
                type: 'demographic',
                categoryType: 'demographic',
                source: 'profile'
            });
        }

        // Parent Status perspective
        if (profile.numberOfChildren !== undefined) {
            perspectives.push({
                name: 'Parent Status',
                value: profile.numberOfChildren > 0 ? `Parent of ${profile.numberOfChildren}` : 'Not a Parent',
                type: 'demographic',
                categoryType: 'demographic',
                source: 'profile'
            });
        }

        // High School Alumni
        if (profile.education?.highSchool?.graduated) {
            perspectives.push({
                name: `${profile.education.highSchool.schoolName} Alumni`,
                value: `High School Class of ${profile.education.highSchool.graduationYear}`,
                type: 'education',
                categoryType: 'sociographic',
                source: 'profile'
            });
        }

        // Undergraduate Alumni
        if (profile.education?.undergraduate?.graduated) {
            perspectives.push({
                name: `${profile.education.undergraduate.schoolName} Alumni`,
                value: `${profile.education.undergraduate.degree} in ${profile.education.undergraduate.major}, Class of ${profile.education.undergraduate.graduationYear}`,
                type: 'education',
                categoryType: 'sociographic',
                source: 'profile'
            });
        }

        // Graduate Alumni
        if (profile.education?.graduate?.graduated) {
            perspectives.push({
                name: `${profile.education.graduate.schoolName} Alumni`,
                value: `${profile.education.graduate.degree} in ${profile.education.graduate.field}, Class of ${profile.education.graduate.graduationYear}`,
                type: 'education',
                categoryType: 'sociographic',
                source: 'profile'
            });
        }

        console.log('Perspectives to send:', perspectives);

        if (perspectives.length > 0) {
            const response = await fetch('/UserPerspective/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ perspectives })
            });

            const result = await response.json();
            console.log('Generation response:', result);
        }
    } catch (error) {
        console.error('Error generating perspectives:', error);
    }
}

// Add event listener
document.getElementById('generatePerspectivesBtn').addEventListener('click', generatePerspectives);

async function saveProfile(formData) {
    try {
        console.log('Form data being sent:', formData);
        const response = await fetch('/account/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        console.log('Save profile response:', result);
        
        await generatePerspectives();
    } catch (error) {
        console.error('Error saving profile:', error);
    }
}

function connectLinkedIn() {
    // Simulate token generation and data saving
    const token = 'simulated-linkedin-token';
    const data = {
        status: 'Connected',
        lastSynced: new Date().toLocaleString()
    };

    // Save token and data (simulated)
    console.log('LinkedIn token:', token);
    console.log('LinkedIn data:', data);

    // Update UI
    document.getElementById('linkedinStatus').textContent = data.status;
    document.getElementById('linkedinLastSynced').textContent = data.lastSynced;
}

function connectInstagram() {
    // Simulate token generation and data saving
    const token = 'simulated-instagram-token';
    const data = {
        status: 'Connected',
        lastSynced: new Date().toLocaleString()
    };

    // Save token and data (simulated)
    console.log('Instagram token:', token);
    console.log('Instagram data:', data);

    // Update UI
    document.getElementById('instagramStatus').textContent = data.status;
    document.getElementById('instagramLastSynced').textContent = data.lastSynced;
}

function connectFacebook() {
    // Simulate token generation and data saving
    const token = 'simulated-facebook-token';
    const data = {
        status: 'Connected',
        lastSynced: new Date().toLocaleString()
    };

    // Save token and data (simulated)
    console.log('Facebook token:', token);
    console.log('Facebook data:', data);

    // Update UI
    document.getElementById('facebookStatus').textContent = data.status;
    document.getElementById('facebookLastSynced').textContent = data.lastSynced;
}

function connectIdMe() {
    // Redirect to ID.me authentication
    const idmeUrl = 'https://groups.id.me/?client_id=9b1da5b436e632efe996a25950e36baa&redirect_uri=https://marginalperspective.com/idme/callback&response_type=code&scope=student';
    window.location.href = idmeUrl;
}

// Function to handle ID.me callback and update UI
async function handleIdMeCallback() {
    try {
        const response = await fetch('/idme/callback', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('idmeStatus').textContent = 'Connected';
            document.getElementById('idmeLastSynced').textContent = new Date().toLocaleString();
        }
    } catch (error) {
        console.error('Error handling ID.me callback:', error);
        document.getElementById('idmeStatus').textContent = 'Connection Failed';
    }
}

// Employment History Handlers
document.getElementById('addEmploymentBtn').addEventListener('click', () => {
    const employmentList = document.getElementById('employmentList');
    const employmentEntry = document.createElement('div');
    employmentEntry.className = 'employment-entry';
    employmentEntry.innerHTML = `
        <div class="form-group">
            <input type="text" placeholder="Company Name" class="company-name">
            <input type="text" placeholder="Title" class="job-title">
            <input type="date" class="start-date">
            <input type="date" class="end-date">
            <input type="number" placeholder="Annual Salary" class="salary">
            <button type="button" class="verify-btn" data-field="employment">Verify Employment</button>
            <button type="button" class="remove-btn">Remove</button>
        </div>
    `;
    employmentList.appendChild(employmentEntry);
});

// Investment Holdings Handlers
document.getElementById('addInvestmentBtn').addEventListener('click', () => {
    const investmentList = document.getElementById('investmentList');
    const investmentEntry = document.createElement('div');
    investmentEntry.className = 'investment-entry';
    investmentEntry.innerHTML = `
        <div class="form-group">
            <select class="investment-type">
                <option value="">Select Type</option>
                <option value="stocks">Stocks</option>
                <option value="bonds">Bonds</option>
                <option value="mutual-funds">Mutual Funds</option>
                <option value="etfs">ETFs</option>
                <option value="crypto">Cryptocurrency</option>
            </select>
            <input type="text" placeholder="Symbol/Description" class="investment-symbol">
            <input type="number" placeholder="Quantity" class="investment-quantity">
            <input type="number" placeholder="Purchase Price" class="investment-price">
            <button type="button" class="verify-btn" data-field="investment">Verify Holdings</button>
            <button type="button" class="remove-btn">Remove</button>
        </div>
    `;
    investmentList.appendChild(investmentEntry);
});

// Mortgage Information Handlers
document.getElementById('addMortgageBtn').addEventListener('click', () => {
    const mortgageList = document.getElementById('mortgageList');
    const mortgageEntry = document.createElement('div');
    mortgageEntry.className = 'mortgage-entry';
    mortgageEntry.innerHTML = `
        <div class="form-group">
            <input type="text" placeholder="Property Address" class="property-address">
            <input type="number" placeholder="Loan Amount" class="loan-amount">
            <input type="number" placeholder="Interest Rate" class="interest-rate" step="0.01">
            <input type="date" placeholder="Start Date" class="mortgage-start">
            <input type="number" placeholder="Term (years)" class="loan-term">
            <button type="button" class="verify-btn" data-field="mortgage">Verify Mortgage</button>
            <button type="button" class="remove-btn">Remove</button>
        </div>
    `;
    mortgageList.appendChild(mortgageEntry);
});

// Vehicle Ownership Handlers
document.getElementById('addVehicleBtn').addEventListener('click', () => {
    const vehicleList = document.getElementById('vehicleList');
    const vehicleEntry = document.createElement('div');
    vehicleEntry.className = 'vehicle-entry';
    vehicleEntry.innerHTML = `
        <div class="form-group">
            <input type="text" placeholder="Make" class="vehicle-make">
            <input type="text" placeholder="Model" class="vehicle-model">
            <input type="number" placeholder="Year" class="vehicle-year">
            <input type="text" placeholder="VIN" class="vehicle-vin">
            <button type="button" class="verify-btn" data-field="vehicle">Verify Vehicle</button>
            <button type="button" class="remove-btn">Remove</button>
        </div>
    `;
    vehicleList.appendChild(vehicleEntry);
});

// Voting History Handlers
document.getElementById('addVotingBtn').addEventListener('click', () => {
    const votingList = document.getElementById('votingList');
    const votingEntry = document.createElement('div');
    votingEntry.className = 'voting-entry';
    votingEntry.innerHTML = `
        <div class="form-group">
            <input type="text" placeholder="Election" class="election-name">
            <input type="date" placeholder="Date" class="election-date">
            <select class="voting-method">
                <option value="">Select Method</option>
                <option value="in-person">In Person</option>
                <option value="mail">Mail</option>
                <option value="early">Early Voting</option>
            </select>
            <input type="text" placeholder="Jurisdiction" class="voting-jurisdiction">
            <button type="button" class="verify-btn" data-field="voting">Verify Voting Record</button>
            <button type="button" class="remove-btn">Remove</button>
        </div>
    `;
    votingList.appendChild(votingEntry);
});

// Add remove button handlers
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
        e.target.closest('.form-group').remove();
    }
});

// Add verification modal HTML to account.html
const verificationModal = document.createElement('div');
verificationModal.id = 'verificationModal';
verificationModal.className = 'modal';
verificationModal.innerHTML = `
    <div class="modal-content">
        <h2>Verify Email</h2>
        <p>Enter the 6-digit code sent to your email:</p>
        <input type="text" id="verificationCode" maxlength="6" pattern="[0-9]*">
        <button onclick="submitVerificationCode()">Submit</button>
        <button onclick="closeVerificationModal()">Cancel</button>
    </div>
`;
document.body.appendChild(verificationModal);

let currentEmailVerifying = null;

async function submitVerificationCode() {
    const code = document.getElementById('verificationCode').value;
    if (await verifyCode(currentEmailVerifying, code)) {
        closeVerificationModal();
        loadEmails(); // Refresh the email list
    } else {
        alert('Invalid verification code');
    }
}

function closeVerificationModal() {
    document.getElementById('verificationModal').style.display = 'none';
    currentEmailVerifying = null;
}

async function deleteEmail(email) {
    try {
        const response = await fetch(`/account/emails/${encodeURIComponent(email)}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            await loadEmails(); // Refresh the list
        } else {
            throw new Error('Failed to delete email');
        }
    } catch (error) {
        console.error('Error deleting email:', error);
        alert('Failed to delete email');
    }
}

