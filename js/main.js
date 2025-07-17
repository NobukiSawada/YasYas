document.addEventListener('DOMContentLoaded', () => {
    // DOMContentLoadedイベントリスナー: HTMLの読み込みが完了した後に実行される。
    // ページ上の主要な要素への参照を取得。
    const loadingEl = document.getElementById('loading'); // ローディングスピナーの要素
    const chartsContainerEl = document.getElementById('charts-container'); // グラフを動的に追加するコンテナ
    const errorEl = document.getElementById('error-message'); // エラーメッセージの要素
    const timeRangeSelector = document.getElementById('time-range-selector'); // 表示期間選択プルダウン
    const todayDateEl = document.getElementById('today-date'); // 今日日付を表示する要素

    let originalData = {}; // 読み込んだ全期間のオリジナルデータを保持する変数
    let chartInstances = {}; // Chart.jsのインスタンスを保持するオブジェクト（再描画時に破棄するため）

    // 品目のカテゴリ定義: 農産物と畜産物に分類。
    const categories = {
        '農産物': ['キャベツ', 'だいこん'],
        '畜産物': ['国産牛肉', '国産豚肉']
    };

    // グラフの色定義: 華やかで統一感のある色調の配列。
    const chartColors = [
        '#0d6efd', // Primary blue
        '#6610f2', // Indigo
        '#6f42c1', // Purple
        '#d63384', // Pink
        '#dc3545', // Red
        '#fd7e14', // Orange
        '#ffc107', // Yellow
        '#198754', // Green
        '#20c997', // Teal
        '#0dcaf0'  // Cyan
    ];
    let colorIndex = 0; // グラフの色を順番に割り当てるためのインデックス。

    // 次のグラフの色を取得する関数。
    function getNextColor() {
        const color = chartColors[colorIndex % chartColors.length]; // 配列の範囲内で色を循環。
        colorIndex++;
        return color;
    }

    // ローディングスピナーを表示し、グラフとエラーメッセージを非表示にする関数。
    function showLoading() {
        loadingEl.classList.remove('d-none');
        chartsContainerEl.classList.add('d-none');
        errorEl.classList.add('d-none');
    }

    // グラフコンテナを表示し、ローディングスピナーとエラーメッセージを非表示にする関数。
    function showCharts() {
        loadingEl.classList.add('d-none');
        chartsContainerEl.classList.remove('d-none');
    }

    // エラーメッセージを表示し、ローディングスピナーを非表示にする関数。
    function showError() {
        loadingEl.classList.add('d-none');
        errorEl.classList.remove('d-none');
    }

    // 品目データの価格変動（昨日比、1年前比）を計算する関数。
    function calculatePriceChanges(itemData) {
        const prices = itemData.prices; // 価格データの配列
        const labels = itemData.labels; // 日付ラベルの配列

        let yesterdayChange = 0;
        // 昨日の価格と比較（データが2日分以上ある場合）。
        if (prices.length >= 2) {
            yesterdayChange = prices[prices.length - 1] - prices[prices.length - 2];
        }

        let yearAgoChange = 0;
        // 1年前の価格と比較（データが366日分以上ある場合）。
        // 366日目（今日） - 1日目（365日前） = 365日間のデータが必要。
        if (prices.length >= 366) {
            yearAgoChange = prices[prices.length - 1] - prices[prices.length - 366];
        }

        return { yesterdayChange, yearAgoChange };
    }

    // グラフの日付ラベルをフォーマットする関数。
    // 週次・月次では「〇月〇日」、それ以外は「YYYY-MM-DD」形式。
    function formatDateForChart(dateString, timeRange) {
        const date = new Date(dateString);
        if (timeRange === '7' || timeRange === '30') {
            return `${date.getMonth() + 1}月${date.getDate()}日`;
        } else {
            return dateString; // YYYY-MM-DD for all or 365 days
        }
    }

    // グラフを生成または更新するメイン関数。
    // timeRange: 表示期間（'all', '7', '30', '365'）。
    function createOrUpdateCharts(timeRange) {
        chartsContainerEl.innerHTML = ''; // 既存のグラフをクリア。
        chartInstances = {}; // Chart.jsインスタンスをリセット。
        colorIndex = 0; // 色のインデックスをリセット。

        // 各カテゴリ（農産物、畜産物）ごとに処理。
        for (const categoryName in categories) {
            const categoryItems = categories[categoryName]; // カテゴリ内の品目リスト。
            let itemsForCategory = []; // このカテゴリに属する品目データと変動情報を格納。

            // カテゴリ内の各品目について、データと価格変動を計算。
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

            // 品目を昨日比の価格下落が大きい順にソート。
            itemsForCategory.sort((a, b) => a.yesterdayChange - b.yesterdayChange);

            // カテゴリセクション（見出しと区切り線）を作成し、コンテナに追加。
            const categorySection = document.createElement('div');
            categorySection.className = 'col-12 mb-5';
            categorySection.innerHTML = `<h2 class="text-primary fw-bold">${categoryName}</h2><hr>`;
            chartsContainerEl.appendChild(categorySection);

            // カテゴリ内のグラフを配置するための行コンテナを作成。
            const categoryRow = document.createElement('div');
            categoryRow.className = 'row';
            categorySection.appendChild(categoryRow);

            // カテゴリ内の各品目についてグラフを作成。
            itemsForCategory.forEach(item => {
                const itemName = item.name;
                const itemData = item.data;
                const yesterdayChange = item.yesterdayChange;
                const yearAgoChange = item.yearAgoChange;

                let filteredLabels = itemData.labels;
                let filteredPrices = itemData.prices;

                // 選択された期間に基づいてデータをフィルタリング。
                if (timeRange !== 'all') {
                    const days = parseInt(timeRange, 10);
                    filteredLabels = itemData.labels.slice(-days);
                    filteredPrices = itemData.prices.slice(-days);
                }

                // グラフ表示用に日付ラベルをフォーマット。
                const formattedLabels = filteredLabels.map(label => formatDateForChart(label, timeRange));

                // グラフのカードコンテナとキャンバス要素を作成。
                const chartCol = document.createElement('div');
                chartCol.className = 'col-lg-6 mb-4';
                const chartCard = document.createElement('div');
                chartCard.className = 'card shadow-sm h-100';
                const cardBody = document.createElement('div');
                cardBody.className = 'card-body d-flex flex-column';

                // カードヘッダー（品目名と価格変動表示）を作成。
                const cardHeader = document.createElement('div');
                cardHeader.className = 'd-flex justify-content-between align-items-center mb-2';
                const cardTitle = document.createElement('h5');
                cardTitle.className = 'card-title mb-0';
                cardTitle.textContent = itemName;
                cardHeader.appendChild(cardTitle);

                // 価格変動表示（昨日比、1年前比）を作成。
                const changeDisplay = document.createElement('div');
                changeDisplay.className = 'text-end';
                changeDisplay.innerHTML = `
                    <span class="d-block fs-4 fw-bold ${yesterdayChange < 0 ? 'text-success' : 'text-danger'}">${yesterdayChange}円</span>
                    <small class="text-muted">昨日比</small>
                `;
                // 1年前比のデータがあれば表示（データが366日分以上ある場合）。
                if (itemData.labels.length >= 366) {
                    changeDisplay.innerHTML += `
                        <span class="d-block fs-6 ${yearAgoChange < 0 ? 'text-success' : 'text-danger'}">${yearAgoChange}円</span>
                        <small class="text-muted">1年前比</small>
                    `;
                }
                cardHeader.appendChild(changeDisplay);
                cardBody.appendChild(cardHeader);

                // キャンバスコンテナとキャンバス要素をカードに追加。
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

                // Chart.jsでグラフを生成。
                const ctx = canvas.getContext('2d');
                const borderColor = getNextColor(); // 定義された色を順番に取得。
                chartInstances[itemName] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: formattedLabels,
                        datasets: [{
                            label: itemName,
                            data: filteredPrices,
                            borderColor: borderColor,
                            backgroundColor: `${borderColor}1A`, // 10%透明度の背景色。
                            tension: 0.1,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false // 凡例は表示しない（品目名はカードタイトルで表示）。
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false // X軸のグリッド線は非表示。
                                }
                            },
                            y: {
                                beginAtZero: false // Y軸は0から開始しない。
                            }
                        }
                    }
                });
            });
        }
    }

    // 今日の日付を表示するロジック。
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    todayDateEl.textContent = `今日の日付: ${today.toLocaleDateString('ja-JP', options)}`;

    // ページ読み込み時の初期処理。
    showLoading(); // ローディングスピナーを表示。

    // data/prices.jsonからデータをフェッチ（取得）。
    fetch('data/prices.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            originalData = data; // 取得したデータを保存。
            showCharts(); // グラフコンテナを表示。
            createOrUpdateCharts('all'); // 全期間で初期グラフを生成。
        })
        .catch(error => {
            console.error('Error fetching or parsing data:', error);
            showError(); // エラーメッセージを表示。
        });

    // 表示期間プルダウンの変更イベントリスナー。
    timeRangeSelector.addEventListener('change', (event) => {
        createOrUpdateCharts(event.target.value); // 選択された期間でグラフを更新。
    });
});
