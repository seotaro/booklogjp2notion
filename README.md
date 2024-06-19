# booklog2notion

[ブクログ](https://booklog.jp/)から[Notion](https://www.notion.so/ja-jp)にインポートする。
ISBN13コードがあればamazonのリンクを補う。

## Requirements

- Node.js
- yarn

## エクスポート

ブクログの[エクスポート](https://booklog.jp/export)からCSVファイルを出力する。

![image](https://github.com/seotaro/booklogjp2notion/assets/46148606/c589d595-4ddd-492a-a55a-a7b4983247ac)

## Notion

[私のインテグレーション](https://www.notion.so/my-integrations)から新しくインテグレーションを作成して、インテグレーションシークレットを取得する。

ページを作成してコネクトの接続先に作成したインテグレーションを指定する。
ページのURLにpage_idが埋め込まれている。

## インポート

### Install

```bash
yarn
```

### Run

```bash
node main.js notion_token page_id filename 
```

notion_token: インテグレーションシークレット
page_id: 作成したページのURLにある
filename: ブクログからエクスポートしたcsvファイル
