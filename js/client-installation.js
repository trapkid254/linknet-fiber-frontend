// client-installation.js - Client Installation Page Logic

document.addEventListener('DOMContentLoaded', async () => {
    await loadInstallationStatus();
    setupModal();
    await loadPackagesForForm();
});

function setupModal() {
    const modal = document.getElementById('installation-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const form = document.getElementById('installation-request-form');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    if (form) {
        form.addEventListener('submit', handleInstallationSubmit);
    }
}

async function loadPackagesForForm() {
    const packageSelect = document.getElementById('install-package');
    if (!packageSelect) return;

    try {
        const packages = await fetchPackages();
        packages.forEach(pkg => {
            const option = document.createElement('option');
            option.value = pkg._id;
            option.textContent = `${pkg.name} - ${pkg.speed} (KES ${pkg.price}/month)`;
            packageSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading packages:', error);
    }
}

async function loadInstallationStatus() {
    const installationContent = document.getElementById('installation-content');
    if (!installationContent) return;

    try {
        const clientProfile = await fetchClientProfile();
        
        // Check if client has an installation request
        if (!clientProfile || clientProfile.installationStatus === 'pending' || !clientProfile.installationAddress) {
            // No installation request - show request button
            installationContent.innerHTML = `
                <div class="card">
                    <div class="card-body" style="text-align: center; padding: 60px 20px;">
                        <div class="no-installation-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                        <h3>No Installation Request</h3>
                        <p style="margin: 16px 0 24px; color: #64748B;">You haven't requested an installation yet. Click the button below to get started.</p>
                        <button class="btn btn-primary btn-large" id="open-modal-btn">
                            <i class="fas fa-plus"></i> Request Installation
                        </button>
                    </div>
                </div>
            `;
            
            // Add click handler to open modal
            document.getElementById('open-modal-btn').addEventListener('click', openInstallationModal);
            return;
        }

        // Load installation details from requests API
        const requests = await fetchClientRequests();
        const installationRequest = requests.find(r => r.clientId === clientProfile._id && r.status !== 'completed');

        if (!installationRequest) {
            // Installation completed or no active request
            installationContent.innerHTML = `
                <div class="card">
                    <div class="card-body" style="text-align: center; padding: 60px 20px;">
                        <div class="installation-completed-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h3>Installation Completed</h3>
                        <p style="margin: 16px 0 24px; color: #64748B;">Your installation has been completed successfully.</p>
                        <button class="btn btn-primary" onclick="window.location.href='/client/service/'">
                            <i class="fas fa-wifi"></i> View My Service
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Show installation status
        const statusConfig = {
            'pending': { label: 'Pending', class: 'status-pending', icon: 'fa-clock' },
            'approved': { label: 'Approved', class: 'status-active', icon: 'fa-check' },
            'survey_scheduled': { label: 'Survey Scheduled', class: 'status-pending', icon: 'fa-calendar' },
            'installation_scheduled': { label: 'Installation Scheduled', class: 'status-pending', icon: 'fa-tools' },
            'installed': { label: 'Installed', class: 'status-active', icon: 'fa-check-circle' }
        };

        const status = statusConfig[installationRequest.status] || statusConfig['pending'];

        installationContent.innerHTML = `
            <!-- Installation Status Card -->
            <div class="card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <h2><i class="fas fa-tools"></i> Current Installation</h2>
                </div>
                <div class="card-body">
                    <div class="installation-status">
                        <div class="installation-header">
                            <div class="installation-id">Request ID: ${installationRequest.requestId}</div>
                            <div class="installation-badge ${status.class}">${status.label}</div>
                        </div>
                        
                        <div class="installation-details">
                            <div class="installation-detail">
                                <div class="detail-label">Package</div>
                                <div class="detail-value">${installationRequest.packageName || 'Not specified'}</div>
                            </div>
                            <div class="installation-detail">
                                <div class="detail-label">Installation Address</div>
                                <div class="detail-value">${installationRequest.address || clientProfile.installationAddress}</div>
                            </div>
                            <div class="installation-detail">
                                <div class="detail-label">Request Date</div>
                                <div class="detail-value">${new Date(installationRequest.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div class="installation-detail">
                                <div class="detail-label">County</div>
                                <div class="detail-value">${installationRequest.county || 'Not specified'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Installation Steps -->
            <div class="card">
                <div class="card-header">
                    <h2><i class="fas fa-list-check"></i> Installation Progress</h2>
                </div>
                <div class="card-body">
                    <div class="installation-steps">
                        ${getInstallationSteps(installationRequest.status)}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading installation status:', error);
        installationContent.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load installation status. Please try again later.</p>
            </div>
        `;
    }
}

async function openInstallationModal() {
    const modal = document.getElementById('installation-modal');
    const clientProfile = await fetchClientProfile();
    
    if (clientProfile) {
        // Auto-fill form with client details
        document.getElementById('install-fullname').value = `${clientProfile.firstName} ${clientProfile.lastName}`;
        document.getElementById('install-email').value = clientProfile.email;
        document.getElementById('install-phone').value = clientProfile.phone || clientProfile.mpesaNumber || '';
    }
    
    modal.style.display = 'block';
}

async function handleInstallationSubmit(e) {
    e.preventDefault();
    
    const token = getClientToken();
    if (!token) {
        alert('Please login to submit installation request');
        return;
    }

    const formData = {
        fullName: document.getElementById('install-fullname').value,
        email: document.getElementById('install-email').value,
        phone: document.getElementById('install-phone').value,
        county: document.getElementById('install-county').value,
        estate: document.getElementById('install-estate').value,
        address: document.getElementById('install-address').value,
        packageId: document.getElementById('install-package').value,
        preferredDate: document.getElementById('install-date').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Installation request submitted successfully!');
            document.getElementById('installation-modal').style.display = 'none';
            document.getElementById('installation-request-form').reset();
            await loadInstallationStatus();
        } else {
            alert('Failed to submit request: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error submitting installation request:', error);
        alert('Failed to submit request. Please try again.');
    }
}

async function fetchClientRequests() {
    return await fetchClientRequests();
}

function getInstallationSteps(currentStatus) {
    const steps = [
        { title: 'Request Submitted', desc: 'Your installation request has been received', status: 'completed' },
        { title: 'Request Approved', desc: 'Your request has been approved', status: 'pending' },
        { title: 'Site Survey', desc: 'Technician will visit your location for assessment', status: 'pending' },
        { title: 'Installation Scheduled', desc: 'Installation date will be confirmed', status: 'pending' },
        { title: 'Fiber Installation', desc: 'Fiber cable will be installed and connected', status: 'pending' },
        { title: 'Configuration & Testing', desc: 'Router configured and connection tested', status: 'pending' }
    ];

    const statusOrder = ['pending', 'approved', 'survey_scheduled', 'installation_scheduled', 'installed', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    steps.forEach((step, index) => {
        if (index <= currentIndex) {
            step.status = 'completed';
        }
    });

    return steps.map(step => `
        <div class="step step-${step.status}">
            <div class="step-icon">
                <i class="fas ${step.status === 'completed' ? 'fa-check-circle' : 'fa-circle'}"></i>
            </div>
            <div class="step-content">
                <div class="step-title">${step.title}</div>
                <div class="step-desc">${step.desc}</div>
            </div>
        </div>
    `).join('');
}
