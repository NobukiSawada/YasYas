document.addEventListener('DOMContentLoaded', () => {
    const loadingEl = document.getElementById('loading');
    const chartsContainerEl = document.getElementById('charts-container');
    const errorEl = document.getElementById('error-message');
    const timeRangeSelector = document.getElementById('time-range-selector');

    let originalData = {};
    let chartInstances = {};

    function showLoading() {
        loadingEl.classList.remove('d-none');
        chartsContainerEl.classList.add('d-none');
        errorEl.classList.add('d-none');
    }

    function showCharts() {
        loadingEl.classList.add('d-none');
        chartsContainerEl.classList.remove('d-none');
    }

    function showError() {
        loadingEl.classList.add('d-none');
        errorEl.classList.remove('d-none');
    }

    function createOrUpdateCharts(timeRange) {
        chartsContainerEl.innerHTML = ''; // Clear existing charts
        chartInstances = {};

        for (const itemName in originalData) {
            const itemData = originalData[itemName];
            let filteredLabels = itemData.labels;
            let filteredPrices = itemData.prices;

            if (timeRange !== 'all') {
                const days = parseInt(timeRange, 10);
                filteredLabels = itemData.labels.slice(-days);
                filteredPrices = itemData.prices.slice(-days);
            }

            // Create container and canvas for the chart
            const chartCol = document.createElement('div');
            chartCol.className = 'col-lg-6 mb-4';
            const chartCard = document.createElement('div');
            chartCard.className = 'card shadow-sm h-100';
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body d-flex flex-column';
            const cardTitle = document.createElement('h5');
            cardTitle.className = 'card-title';
            cardTitle.textContent = itemName;
            const canvasContainer = document.createElement('div');
            canvasContainer.className = 'flex-grow-1';
            const canvas = document.createElement('canvas');
            const canvasId = `chart-${itemName.replace(/\s+/g, '-')}`;
            canvas.id = canvasId;

            canvasContainer.appendChild(canvas);
            cardBody.appendChild(cardTitle);
            cardBody.appendChild(canvasContainer);
            chartCard.appendChild(cardBody);
            chartCol.appendChild(chartCard);
            chartsContainerEl.appendChild(chartCol);

            // Create the chart
            const ctx = canvas.getContext('2d');
            chartInstances[itemName] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: filteredLabels,
                    datasets: [{
                        label: itemName,
                        data: filteredPrices,
                        borderColor: getRandomColor(),
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }

    showLoading();

    fetch('data/prices.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            originalData = data;
            showCharts();
            createOrUpdateCharts('all'); // Initial render
        })
        .catch(error => {
            console.error('Error fetching or parsing data:', error);
            showError();
        });

    timeRangeSelector.addEventListener('change', (event) => {
        createOrUpdateCharts(event.target.value);
    });
});

function getRandomColor() {
    const colors = [
        '#0d6efd', '#6610f2', '#6f42c1', '#d63384',
        '#dc3545', '#fd7e14', '#ffc107', '#198754',
        '#20c997', '#0dcaf0'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}
