// js/analytics-charts.js - Chart.js Analytics Dashboard
class AnalyticsCharts {
    constructor() {
        this.charts = new Map();
        this.colors = {
            primary: '#1E4D8C',
            secondary: '#28a745',
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8',
            light: '#f8f9fa',
            dark: '#343a40'
        };
        this.init();
    }

    init() {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            this.loadChartJS();
        } else {
            this.setupCharts();
        }
    }

    loadChartJS() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = () => this.setupCharts();
        document.head.appendChild(script);
    }

    setupCharts() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not loaded');
            return;
        }

        // Set default chart options
        Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        Chart.defaults.color = '#333';
        Chart.defaults.borderColor = '#e0e0e0';
        
        // Initialize all charts
        this.initRevenueChart();
        this.initCustomerGrowthChart();
        this.initPackageDistributionChart();
        this.initGeographicChart();
        this.initPerformanceChart();
        this.initServiceUsageChart();
    }

    initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        this.charts.set('revenue', new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Revenue (KES)',
                    data: [45000, 52000, 48000, 61000, 58000, 67000, 72000, 69000, 75000, 82000, 78000, 85000],
                    borderColor: this.colors.primary,
                    backgroundColor: this.hexToRgba(this.colors.primary, 0.1),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                return 'Revenue: KES ' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'KES ' + value.toLocaleString();
                            }
                        },
                        grid: {
                            borderDash: [5, 5]
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        }));
    }

    initCustomerGrowthChart() {
        const ctx = document.getElementById('customerGrowthChart');
        if (!ctx) return;

        this.charts.set('customerGrowth', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'New Customers',
                    data: [12, 19, 15, 25, 22, 30, 28, 35, 32, 38, 35, 42],
                    backgroundColor: this.hexToRgba(this.colors.secondary, 0.8),
                    borderColor: this.colors.secondary,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }, {
                    label: 'Total Customers',
                    data: [120, 139, 154, 179, 201, 231, 259, 294, 326, 364, 399, 441],
                    type: 'line',
                    borderColor: this.colors.info,
                    backgroundColor: this.hexToRgba(this.colors.info, 0.1),
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.colors.info,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [5, 5]
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        }));
    }

    initPackageDistributionChart() {
        const ctx = document.getElementById('packageDistributionChart');
        if (!ctx) return;

        this.charts.set('packageDistribution', new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Basic', 'Standard', 'Premium', 'Business', 'Enterprise'],
                datasets: [{
                    data: [120, 180, 95, 35, 11],
                    backgroundColor: [
                        this.hexToRgba(this.colors.primary, 0.8),
                        this.hexToRgba(this.colors.secondary, 0.8),
                        this.hexToRgba(this.colors.info, 0.8),
                        this.hexToRgba(this.colors.warning, 0.8),
                        this.hexToRgba(this.colors.danger, 0.8)
                    ],
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        }));
    }

    initGeographicChart() {
        const ctx = document.getElementById('geographicChart');
        if (!ctx) return;

        this.charts.set('geographic', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Nairobi', 'Kiambu', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kisii', 'Thika'],
                datasets: [{
                    label: 'Customers by County',
                    data: [185, 92, 68, 45, 32, 28, 21, 18],
                    backgroundColor: this.hexToRgba(this.colors.primary, 0.8),
                    borderColor: this.colors.primary,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return 'Customers: ' + context.parsed.x;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [5, 5]
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        }));
    }

    initPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        this.charts.set('performance', new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Response Time', 'Uptime', 'Customer Satisfaction', 'Network Speed', 'Support Response', 'Service Quality'],
                datasets: [{
                    label: 'Current Month',
                    data: [85, 98, 92, 88, 90, 94],
                    backgroundColor: this.hexToRgba(this.colors.primary, 0.2),
                    borderColor: this.colors.primary,
                    borderWidth: 2,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.colors.primary
                }, {
                    label: 'Previous Month',
                    data: [78, 96, 88, 85, 87, 91],
                    backgroundColor: this.hexToRgba(this.colors.secondary, 0.2),
                    borderColor: this.colors.secondary,
                    borderWidth: 2,
                    pointBackgroundColor: this.colors.secondary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.colors.secondary
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.r + '%';
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        },
                        grid: {
                            borderDash: [5, 5]
                        }
                    }
                }
            }
        }));
    }

    initServiceUsageChart() {
        const ctx = document.getElementById('serviceUsageChart');
        if (!ctx) return;

        this.charts.set('serviceUsage', new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
                datasets: [{
                    label: 'Internet Usage (GB)',
                    data: [15, 12, 45, 78, 92, 85, 35],
                    borderColor: this.colors.info,
                    backgroundColor: this.hexToRgba(this.colors.info, 0.1),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.colors.info,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }, {
                    label: 'Active Users',
                    data: [120, 95, 280, 420, 380, 320, 180],
                    type: 'bar',
                    backgroundColor: this.hexToRgba(this.colors.warning, 0.8),
                    borderColor: this.colors.warning,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.yAxisID === 'y1') {
                                    return context.dataset.label + ': ' + context.parsed.y;
                                }
                                return context.dataset.label + ': ' + context.parsed.y + ' GB';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Usage (GB)'
                        },
                        grid: {
                            borderDash: [5, 5]
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Active Users'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        }));
    }

    // Update chart data
    updateChart(chartName, newData) {
        const chart = this.charts.get(chartName);
        if (!chart) return;

        if (newData.labels) {
            chart.data.labels = newData.labels;
        }
        
        if (newData.datasets) {
            newData.datasets.forEach((dataset, index) => {
                if (chart.data.datasets[index]) {
                    Object.assign(chart.data.datasets[index], dataset);
                }
            });
        }

        chart.update('active');
    }

    // Add data to existing chart
    addDataToChart(chartName, label, data) {
        const chart = this.charts.get(chartName);
        if (!chart) return;

        chart.data.labels.push(label);
        
        if (Array.isArray(data)) {
            data.forEach((value, index) => {
                if (chart.data.datasets[index]) {
                    chart.data.datasets[index].data.push(value);
                }
            });
        } else {
            if (chart.data.datasets[0]) {
                chart.data.datasets[0].data.push(data);
            }
        }

        chart.update('active');
    }

    // Export chart as image
    exportChart(chartName, format = 'png') {
        const chart = this.charts.get(chartName);
        if (!chart) return null;

        const canvas = chart.canvas;
        const url = canvas.toDataURL(`image/${format}`);
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${chartName}-chart.${format}`;
        link.href = url;
        link.click();

        return url;
    }

    // Utility function to convert hex to rgba
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Refresh all charts with new data
    async refreshCharts() {
        try {
            const response = await fetch('/api/analytics/dashboard');
            const data = await response.json();

            if (data.success) {
                // Update revenue chart
                if (data.data.revenue.trend) {
                    this.updateChart('revenue', {
                        labels: data.data.revenue.trend.map(item => item._id),
                        datasets: [{
                            data: data.data.revenue.trend.map(item => item.revenue)
                        }]
                    });
                }

                // Update customer growth chart
                if (data.data.customers.acquisitionTrend) {
                    this.updateChart('customerGrowth', {
                        labels: data.data.customers.acquisitionTrend.map(item => item._id),
                        datasets: [{
                            data: data.data.customers.acquisitionTrend.map(item => item.customers)
                        }]
                    });
                }

                // Update package distribution
                if (data.data.packages.distribution) {
                    this.updateChart('packageDistribution', {
                        labels: data.data.packages.distribution.map(item => item._id),
                        datasets: [{
                            data: data.data.packages.distribution.map(item => item.count)
                        }]
                    });
                }

                // Update geographic distribution
                if (data.data.geographic) {
                    this.updateChart('geographic', {
                        labels: data.data.geographic.map(item => item._id),
                        datasets: [{
                            data: data.data.geographic.map(item => item.count)
                        }]
                    });
                }
            }
        } catch (error) {
            console.error('Error refreshing charts:', error);
        }
    }

    // Destroy all charts
    destroyCharts() {
        this.charts.forEach(chart => {
            chart.destroy();
        });
        this.charts.clear();
    }
}

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsCharts = new AnalyticsCharts();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsCharts;
}
