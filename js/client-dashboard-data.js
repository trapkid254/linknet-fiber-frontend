// client-dashboard-data.js - Client Dashboard Data Loading

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        const clientProfile = await fetchClientProfile();
        
        if (clientProfile) {
            // Update package info
            if (clientProfile.package) {
                const packages = await fetchPackages();
                const currentPackage = packages.find(p => p._id === clientProfile.package._id);
                
                if (currentPackage) {
                    document.getElementById('current-package').textContent = currentPackage.name;
                    document.getElementById('package-speed').textContent = currentPackage.speed;
                    document.getElementById('connection-status').textContent = 'Active';
                    document.getElementById('connection-status').classList.add('status-active');
                }
            } else {
                document.getElementById('current-package').textContent = 'No Package';
                document.getElementById('package-speed').textContent = '-';
                document.getElementById('connection-status').textContent = 'Inactive';
            }
            
            // Update billing info
            if (clientProfile.nextBillingDate) {
                document.getElementById('next-billing').textContent = new Date(clientProfile.nextBillingDate).toLocaleDateString();
                if (clientProfile.package) {
                    document.getElementById('billing-amount').textContent = `KES ${clientProfile.package.price}`;
                }
            } else {
                document.getElementById('next-billing').textContent = 'No Data';
                document.getElementById('billing-amount').textContent = '-';
            }
            
            // Update usage data
            if (clientProfile.usage) {
                document.getElementById('total-used').textContent = `${clientProfile.usage.used} GB`;
                document.getElementById('remaining').textContent = `${clientProfile.usage.remaining} GB`;
                document.getElementById('data-cap').textContent = clientProfile.usage.cap;
                
                const percentage = (clientProfile.usage.used / clientProfile.usage.cap) * 100;
                document.getElementById('usage-progress').style.width = `${percentage}%`;
            } else {
                document.getElementById('total-used').textContent = 'No Data';
                document.getElementById('remaining').textContent = 'No Data';
                document.getElementById('data-cap').textContent = 'No Data';
                document.getElementById('usage-progress').style.width = '0%';
            }
            
            // Load recent activity
            await loadRecentActivity(clientProfile._id);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadRecentActivity(clientId) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    try {
        const activities = await fetchClientActivity();
        
        if (activities && activities.length > 0) {
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-desc">${activity.description}</div>
                        <div class="activity-date">${formatDate(activity.createdAt)}</div>
                    </div>
                </div>
            `).join('');
        } else {
            activityList.innerHTML = '<div class="no-data">No recent activity</div>';
        }
    } catch (error) {
        console.error('Error loading activity:', error);
        activityList.innerHTML = '<div class="no-data">No recent activity</div>';
    }
}

function getActivityIcon(type) {
    const icons = {
        'payment': 'fa-check-circle',
        'upgrade': 'fa-wifi',
        'installation': 'fa-tools',
        'ticket': 'fa-ticket-alt',
        'support': 'fa-headset'
    };
    return icons[type] || 'fa-circle';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
}
