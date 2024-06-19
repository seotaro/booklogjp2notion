const fs = require('fs').promises;
const parse = require('csv-parse/sync');
const iconv = require('iconv-lite');
const moment = require('moment-timezone');
const { Client } = require("@notionhq/client");


if (process.argv.length !== 5) {
  console.log('usage: node main.js notion_token page_id filename');
  console.log('');
  console.log('Example usage:');
  console.log('  node main.js xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx filename.csv');
  process.exit(-1);
}

const NOTION_TOKEN = process.argv[2];
const PAGE_ID = process.argv[3];
const FILENAME = process.argv[4];

const notion = new Client({ auth: NOTION_TOKEN, });

// CSV のカラム名
const COLUMNS = [
  'サービスID',
  'アイテムID',
  '13桁ISBN',
  'カテゴリ',
  '評価',
  '読書状況',
  'レビュー',
  'タグ',
  '読書メモ(非公開)',
  '登録日時',
  '読了日',
  'タイトル',
  '作者名',
  '出版社名',
  '発行年',
  'ジャンル',
  'ページ数',
];

(async () => {
  // データベースを作成する
  const database_id = await (() => {
    return notion.databases.create({
      parent: { page_id: PAGE_ID },
      title: [
        {
          type: 'text',
          text: {
            content: 'imported from booklog.jp',
          },
        },
      ],
      properties: {
        'サービスID': { type: 'number', number: { format: 'number' }, },
        'アイテムID': { type: 'rich_text', rich_text: {} },
        '13桁ISBN': { type: 'number', number: { format: 'number' }, },
        'カテゴリ': { type: 'select', select: { options: [] }, },
        '評価': { type: 'number', number: { format: 'number' }, },
        '読書状況': { type: 'select', select: { options: [] }, },
        'レビュー': { type: 'rich_text', rich_text: {} },
        'タグ': { type: 'multi_select', multi_select: { options: [] }, },
        '読書メモ(非公開)': { type: 'rich_text', rich_text: {} },
        '登録日時': { type: 'date', date: {}, },
        '読了日': { type: 'date', date: {}, },
        'タイトル': { type: 'title', title: {} },
        '作者名': { type: 'rich_text', rich_text: {} },
        '出版社名': { type: 'rich_text', rich_text: {} },
        '発行年': { type: 'number', number: { format: 'number' }, },
        'ジャンル': { type: 'select', select: { options: [] }, },
        'ページ数': { type: 'number', number: { format: 'number' }, },
      },
    })
      .then(response => {
        console.log('create database:', response.id);
        return response.id;
      })
  })();;

  if (!database_id) {
    process.exit(-1);
  }

  // CSV ファイルからNotionにインポートする。
  fs.readFile(FILENAME)
    .then(async (fileContent) => {
      const utf8Content = iconv.decode(fileContent, 'Shift_JIS');
      const rows = parse.parse(utf8Content, {
        columns: COLUMNS,
        skip_empty_lines: true
      });

      // rate limit があるので順番に処理していく
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          const properties = {
            'サービスID': { number: Number(row['サービスID']), },
            'アイテムID': { rich_text: [{ text: { content: row['アイテムID'] } }] },
            '13桁ISBN': { number: Number(row['13桁ISBN']), },
            'レビュー': { rich_text: [{ text: { content: row['レビュー'] } }] },
            '読書メモ(非公開)': { rich_text: [{ text: { content: row['読書メモ(非公開)'] } }] },
            'タイトル': { title: [{ text: { content: row['タイトル'] } }] },
            '作者名': { rich_text: [{ text: { content: row['作者名'] } }] },
            '出版社名': { rich_text: [{ text: { content: row['出版社名'] } }] },
            '発行年': { number: Number(row['発行年']), },
            'ページ数': { number: Number(row['ページ数']), },
          }
          if (row['ジャンル'] !== '') {
            properties['ジャンル'] = { select: { name: row['ジャンル'] } };
          }
          if (row['カテゴリ'] !== '') {
            properties['カテゴリ'] = { select: { name: row['カテゴリ'] } };
          }
          if (row['タグ'] !== '') {
            properties['タグ'] = { multi_select: row['タグ'].split(',').map(tag => ({ name: tag })) };
          }
          if (row['評価'] !== '') {
            properties['評価'] = { number: Number(row['評価']), };
          }
          if (row['読書状況'] !== '') {
            properties['読書状況'] = { select: { name: row['読書状況'] } };
          }
          if (row['登録日時'] !== '') {
            properties['登録日時'] = { date: { start: moment.tz(row['登録日時'], 'YYYY-MM-DD HH:mm:ss', 'Asia/Tokyo').toISOString(), } };
          }
          if (row['読了日'] !== '') {
            properties['読了日'] = { date: { start: moment.tz(row['読了日'], 'YYYY-MM-DD HH:mm:ss', 'Asia/Tokyo').toISOString(), } };
          }

          const response = await notion.pages.create({ parent: { database_id }, properties })
          console.log(`${i + 1}/${rows.length}. ${row['タイトル']}`);

        } catch (err) {
          console.error(`${i + 1}/${rows.length}. ${row['タイトル']}, ${err.message}`);
        }
      };
    });
})();
