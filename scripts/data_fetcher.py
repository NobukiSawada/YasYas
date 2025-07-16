import os
import json
import requests
import pandas as pd
from datetime import date, timedelta

# APIキーを環境変数から取得
API_KEY = os.environ.get('WAGRI_API_KEY', 'YOUR_API_KEY')

# 取得対象の品目と市場のコードを定義
TARGET_ITEMS = {
    'vegetable': ['0111', '0112'],  # キャベツ, だいこん
    'meat': ['0501', '0502']  # 国産牛肉, 国産豚肉
}
TARGET_MARKET = '51300'  # 東京市場

# 取得期間（過去30日）
END_DATE = date.today()
START_DATE = END_DATE - timedelta(days=30)


def fetch_wagri_data(api_endpoint, target_date, item_code):
    headers = {
        'Authorization': f'Bearer {API_KEY}'
    }
    params = {
        '$filter': f"MarketCode eq '{TARGET_MARKET}' and ItemCode eq '{item_code}'"
    }
    url = f'{api_endpoint}/GetByDays/{target_date}'
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()  # エラーの場合は例外を発生
    return response.json()

def main():
    all_data = {}

    for category, item_codes in TARGET_ITEMS.items():
        api_endpoint = f'https://api.wagri.net/market/v1/{
            'vegetable': 'vegetable',
            'meat': 'meat'
        }[category]'

        for item_code in item_codes:
            item_data = {'labels': [], 'prices': []}
            for i in range((END_DATE - START_DATE).days + 1):
                current_date = START_DATE + timedelta(days=i)
                date_str = current_date.strftime('%Y-%m-%d')
                try:
                    data = fetch_wagri_data(api_endpoint, date_str, item_code)
                    if data and data['results']:
                        # 最初の結果の価格を使用
                        price = data['results'][0]['Price']
                        item_data['labels'].append(date_str)
                        item_data['prices'].append(price)
                except requests.exceptions.RequestException as e:
                    print(f'Error fetching data for {date_str}, {item_code}: {e}')

            # 品目名を取得（本来はコードから名前に変換する処理が必要）
            item_name = f'{category}_{item_code}' # 仮の品目名
            all_data[item_name] = item_data

    # データをdata/prices.jsonに保存
    with open('data/prices.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
