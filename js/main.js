document.addEventListener('DOMContentLoaded', () => {
    const loadingEl = document.getElementById('loading');
    const chartsContainerEl = document.getElementById('charts-container');
    const errorEl = document.getElementById('error-message');

    // Show loading spinner
    loadingEl.classList.remove('d-none');
    chartsContainerEl.classList.add('d-none');
    errorEl.classList.add('d-none');

    fetch('data/prices.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Hide loading spinner and show charts
            loadingEl.classList.add('d-none');
            chartsContainerEl.classList.remove('d-none');

            const vegetableData = {};
            const meatData = {};

            // Define item categories
            const vegetableItems = ['キャベツ', 'だいこん']; // Example items
            const meatItems = ['国産牛肉', '国産豚肉']; // Example items

            for (const key in data) {
                if (vegetableItems.includes(key)) {
                    vegetableData[key] = data[key];
                } else if (meatItems.includes(key)) {
                    meatData[key] = data[key];
                }
            }

            if (Object.keys(vegetableData).length > 0) {
                createChart('vegetable-chart', '青果物価格', vegetableData);
            }
            if (Object.keys(meatData).length > 0) {
                createChart('meat-chart', '畜産物価格', meatData);
            }
        })
        .catch(error => {
            console.error('Error fetching or parsing data:', error);
            // Hide loading spinner and show error message
            loadingEl.classList.add('d-none');
            errorEl.classList.remove('d-none');
        });
});

function createChart(canvasId, chartLabel, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const datasets = Object.keys(data).map(key => {
        return {
            label: key,
            data: data[key].prices,
            borderColor: getRandomColor(),
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            tension: 0.1,
            fill: true
        };
    });

    // Use the labels from the first dataset as representative
    const labels = data[Object.keys(data)[0]]?.labels || [];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false, // The card title serves as the chart title
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function getRandomColor() {
    const colors = [
        '#0d6efd', '#6610f2', '#6f42c1', '#d63384',
        '#dc3545', '#fd7e14', '#ffc107', '#198754',
        '#20c997', '#0dcaf0'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}