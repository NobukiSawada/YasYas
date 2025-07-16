document.addEventListener('DOMContentLoaded', () => {
    const loadingEl = document.getElementById('loading');
    const chartsContainerEl = document.getElementById('charts-container');
    const errorEl = document.getElementById('error-message');
    const timeRangeSelector = document.getElementById('time-range-selector');

    let originalData = {};
    let chartInstances = {};

    // Define categories for items
    const categories = {
        '農産物': ['キャベツ', 'だいこん'],
        '畜産物': ['国産牛肉', '国産豚肉']
    };

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

    function calculatePriceChanges(itemData) {
        const prices = itemData.prices;
        const labels = itemData.labels;

        let yesterdayChange = 0;
        if (prices.length >= 2) {
            yesterdayChange = prices[prices.length - 1] - prices[prices.length - 2];
        }

        let yearAgoChange = 0;
        // For 1-month data, we can't calculate 1-year ago change. 
        // This part will be relevant when we have 1-year data.
        // For now, we'll just set it to 0 or a placeholder.
        if (prices.length >= 365) { // Assuming 365 days for a year
            yearAgoChange = prices[prices.length - 1] - prices[prices.length - 365];
        }

        return { yesterdayChange, yearAgoChange };
    }

    function createOrUpdateCharts(timeRange) {
        chartsContainerEl.innerHTML = ''; // Clear existing charts
        chartInstances = {};

        // Process data for each category
        for (const categoryName in categories) {
            const categoryItems = categories[categoryName];
            let itemsForCategory = [];

            // Filter and calculate changes for items in this category
            categoryItems.forEach(itemName => {
                if (originalData[itemName]) {
                    const itemData = originalData[itemName];
                    const { yesterdayChange, yearAgoChange } = calculatePriceChanges(itemData);
                    itemsForCategory.push({
                        name: itemName,
                        data: itemData,
                        yesterdayChange: yesterdayChange,
                        yearAgoChange: yearAgoChange
                    });
                }
            });

            // Sort items by yesterdayChange (descending for price drop)
            itemsForCategory.sort((a, b) => a.yesterdayChange - b.yesterdayChange);

            // Create category section
            const categorySection = document.createElement('div');
            categorySection.className = 'col-12 mb-5';
            categorySection.innerHTML = `<h2>${categoryName}</h2><hr>`;
            chartsContainerEl.appendChild(categorySection);

            const categoryRow = document.createElement('div');
            categoryRow.className = 'row';
            categorySection.appendChild(categoryRow);

            // Create charts for each item in the category
            itemsForCategory.forEach(item => {
                const itemName = item.name;
                const itemData = item.data;
                const yesterdayChange = item.yesterdayChange;
                const yearAgoChange = item.yearAgoChange;

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

                // Card Header with Item Name and Price Change
                const cardHeader = document.createElement('div');
                cardHeader.className = 'd-flex justify-content-between align-items-center mb-2';
                const cardTitle = document.createElement('h5');
                cardTitle.className = 'card-title mb-0';
                cardTitle.textContent = itemName;
                cardHeader.appendChild(cardTitle);

                const changeDisplay = document.createElement('div');
                changeDisplay.className = 'text-end';
                changeDisplay.innerHTML = `
                    <span class="d-block fs-4 fw-bold ${yesterdayChange < 0 ? 'text-success' : 'text-danger'}">${yesterdayChange}円</span>
                    <small class="text-muted">昨日比</small>
                `;
                // Add 1-year change if data is available (currently not for 1-month dummy data)
                // if (itemData.labels.length >= 365) {
                //     changeDisplay.innerHTML += `
                //         <span class="d-block fs-6 ${yearAgoChange < 0 ? 'text-success' : 'text-danger'}">${yearAgoChange}円</span>
                //         <small class="text-muted">1年前比</small>
                //     `;
                // }
                cardHeader.appendChild(changeDisplay);
                cardBody.appendChild(cardHeader);

                const canvasContainer = document.createElement('div');
                canvasContainer.className = 'flex-grow-1';
                const canvas = document.createElement('canvas');
                const canvasId = `chart-${itemName.replace(/\s+/g, '-')}`;
                canvas.id = canvasId;

                canvasContainer.appendChild(canvas);
                cardBody.appendChild(canvasContainer);
                chartCard.appendChild(cardBody);
                chartCol.appendChild(chartCard);
                categoryRow.appendChild(chartCol);

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