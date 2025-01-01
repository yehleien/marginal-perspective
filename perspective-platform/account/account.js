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
    // ... existing initialization code ...

    // Add tab handling for all tabs
    document.getElementById('perspectivesTab').addEventListener('click', function() {
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.getElementById('perspectivesContent').classList.add('active');
        this.classList.add('active');
    });

    document.getElementById('profileTab').addEventListener('click', function() {
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.getElementById('profileContent').classList.add('active');
        this.classList.add('active');
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

    loadPerspectives();
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
        }
    };

    await saveProfile(formData);
});

async function loadEmails() {
    try {
        const response = await fetch('/account/emails', {
            credentials: 'include'
        });
        const emails = await response.json();
        
        const emailsList = document.getElementById('emailsList');
        emailsList.innerHTML = '';
        
        emails.forEach(email => {
            const emailEntry = document.createElement('div');
            emailEntry.className = `email-entry ${email.isPrimary ? 'primary' : ''}`;
            
            emailEntry.innerHTML = `
                <span class="email-text">${email.email}</span>
                <span class="verification-badge ${email.isVerified ? 'verified' : ''}">
                    ${email.isVerified ? 'Verified' : 'Pending'}
                </span>
                ${email.isPrimary ? '<span class="primary-badge">Primary</span>' : ''}
            `;
            
            emailsList.appendChild(emailEntry);
        });
    } catch (error) {
        console.error('Error loading emails:', error);
    }
}

document.getElementById('addEmailBtn').addEventListener('click', async () => {
    const newEmail = document.getElementById('newEmail').value.trim();
    if (!newEmail) return;
    
    try {
        const response = await fetch('/account/add-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email: newEmail })
        });
        
        if (response.ok) {
            document.getElementById('newEmail').value = '';
            await loadEmails();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to add email');
        }
    } catch (error) {
        console.error('Error adding email:', error);
        alert('Failed to add email');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadEmails();
    // ... existing code ...
});

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
            method: 'POST',
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
    }
}

