document.addEventListener('DOMContentLoaded', () => {
    fetch('data/prices.json')
        .then(response => response.json())
        .then(data => {
            const vegetableData = {};
            const meatData = {};

            for (const key in data) {
                if (['キャベツ', 'だいこん'].includes(key)) {
                    vegetableData[key] = data[key];
                } else if (['国産牛肉', '国産豚肉'].includes(key)) {
                    meatData[key] = data[key];
                }
            }

            createChart('vegetable-chart', '青果物価格', vegetableData);
            createChart('meat-chart', '畜産物価格', meatData);
        })
        .catch(error => console.error('Error fetching data:', error));
});

function createChart(canvasId, label, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const datasets = Object.keys(data).map(key => {
        return {
            label: key,
            data: data[key].prices,
            borderColor: getRandomColor(),
            tension: 0.1
        };
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data[Object.keys(data)[0]].labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: label
                }
            }
        }
    });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
