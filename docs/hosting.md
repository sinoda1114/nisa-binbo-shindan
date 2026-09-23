# 診断をブラウザで開く

公開URLは https://nisa-binbo-shindan.vercel.app です。ログインは不要です。回答は端末の外に保存しません。

公開の正本は GitHub です。`sinoda1114/nisa-binbo-shindan` の `main` への push が、Vercel プロジェクト `nisa-binbo-shindan`（scope `sinoda1114s-projects`）の Production になります。本番ブランチは `main` です。

Framework は Vite、Build Command は `npm test && npm run build`、Output は `dist`（`vercel.json` と同じ）です。Clerk / Turso / Mantine は使いません。サーバレス関数は足しません。

## ローカル

```bash
npm install
npm test
npm run dev
```

表示された URL（通常は `http://localhost:5173/`）を開きます。

## Pages から移した理由

GitHub Pages の REST は 403 でサイトを作れませんでした。公開 URL は Vercel が正本です。Pages の workflow はリポジトリから外します。
