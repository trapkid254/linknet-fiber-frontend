// client-service.js - Client Service Page Logic

document.addEventListener('DOMContentLoaded', async () => {
    // Load packages from backend
    await loadPackages();
    // Load client profile to check current service
    await loadCurrentService();
});

async function loadPackages() {
    const plansGrid = document.getElementById('available-plans-grid');
    if (!plansGrid) return;

    try {
        const packages = await fetchPackages();
        
        if (packages.length === 0) {
            plansGrid.innerHTML = '<p class="no-data">No packages available at the moment.</p>';
            return;
        }

        plansGrid.innerHTML = packages.map(pkg => `
            <div class="plan-card ${pkg.isPopular ? 'plan-card-featured' : ''}">
                ${pkg.isPopular ? '<div class="plan-card-badge">Popular</div>' : ''}
                <div class="plan-card-header">
                    <div class="plan-card-name">${pkg.name}</div>
                    <div class="plan-card-speed">${pkg.speed}</div>
                </div>
                <div class="plan-card-price">KES ${pkg.price}<span>/month</span></div>
                <div class="plan-card-features">
                    ${pkg.features.map(feature => `
                        <div class="plan-card-feature">
                            <i class="fas fa-check"></i> ${feature}
                        </div>
                    `).join('')}
                </div>
                <button class="btn ${pkg.isPopular ? 'btn-primary' : 'btn-outline'} btn-block" 
                        onclick="selectPlan('${pkg._id}', '${pkg.name}')">
                    Select Plan
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading packages:', error);
        plansGrid.innerHTML = '<p class="error-message">Failed to load packages. Please try again later.</p>';
    }
}

async function loadCurrentService() {
    const currentPlanContent = document.getElementById('current-plan-content');
    if (!currentPlanContent) return;

    try {
        const clientProfile = await fetchClientProfile();
        
        if (!clientProfile || !clientProfile.package) {
            // No active service
            currentPlanContent.innerHTML = `
                <div class="no-service-message">
                    <i class="fas fa-wifi-slash"></i>
                    <h3>No Active Service</h3>
                    <p>You don't have an active service yet. Choose a plan from the available plans below to get started.</p>
                </div>
            `;
            return;
        }

        // Load package details
        const packages = await fetchPackages();
        const currentPackage = packages.find(p => p._id === clientProfile.package._id);

        if (currentPackage) {
            currentPlanContent.innerHTML = `
                <div class="plan-details">
                    <div class="plan-header">
                        <div class="plan-name">${currentPackage.name}</div>
                        <div class="plan-badge status-active">Active</div>
                    </div>
                    <div class="plan-speed">${currentPackage.speed}</div>
                    <div class="plan-price">KES ${currentPackage.price} / month</div>
                    <div class="plan-features">
                        ${currentPackage.features.map(feature => `
                            <div class="plan-feature">
                                <i class="fas fa-check"></i> ${feature}
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary" onclick="window.location.href='../request.html'">
                        <i class="fas fa-arrow-up"></i> Upgrade Plan
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading current service:', error);
        currentPlanContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load current service. Please try again later.</p>
            </div>
        `;
    }
}

function selectPlan(packageId, packageName) {
    // Store selected plan and redirect to request page
    localStorage.setItem('selectedPackageId', packageId);
    localStorage.setItem('selectedPackageName', packageName);
    window.location.href = '../request.html';
}
