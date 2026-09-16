# 把團購清單掛成公開網址

親友用手機打開就能貼網址、選規格、看總金額。  
**一定要有代理**（`/proxy`），否則瀏覽器會被官網擋住，讀不到價格。

下面兩種都是免費方案。不會寫程式也可以做第一種。

---

## 方法 A：Cloudflare Workers（建議，約 3 分鐘）

會得到類似：`https://papazao-groupbuy.你的帳號.workers.dev`

1. 用 Email 註冊 [Cloudflare](https://dash.cloudflare.com/sign-up)
2. 左側進 **Workers & Pages** → **Create** → **Start with Hello World!** → 部署
3. 打開這個 Worker → 右上角 **Edit code**
4. 把編輯器裡的程式全部刪掉，改貼 `worker.standalone.js` 的完整內容
5. **Deploy**
6. 回到 Overview 複製網址，傳給親友即可

之後要改畫面：再貼一次更新後的 `worker.standalone.js` 然後 Deploy。

用電腦命令列也可以：

```bash
npx wrangler login
npx wrangler deploy
```

會使用資料夾裡的 `wrangler.toml`、`worker.js` 和 `index.html`。

---

## 方法 B：Netlify（可拖曳資料夾）

會得到類似：`https://隨機名字.netlify.app`

1. 註冊 [Netlify](https://app.netlify.com/signup)
2. 進 **Sites** → **Add new site** → **Import an existing project**
   - 若已把這個資料夾放到 GitHub：選 repo 即可，會自動讀 `netlify.toml`
3. 沒有 GitHub 時：把整個 `papazao-groupbuy` 資料夾壓成 zip，用 Netlify 的 **Deploy manually** 上傳  
   （手動拖曳若沒帶到 functions，請改走 GitHub 匯入，這樣 `/proxy` 才會生效）

`netlify.toml` 已把 `/proxy` 指到函式，前端不用改。

---

## 方法 C：Cloudflare Pages + Functions

1. 把這個資料夾丟上 GitHub
2. Cloudflare → Workers & Pages → **Create** → **Pages** → 連 GitHub repo
3. Build 設定可留空，Output directory 填 `/` 或留空
4. 部署後會自動有 `functions/proxy.js` → 網址路徑 `/proxy`

---

## 傳給親友時建議這樣寫

> 這是我們這次趴趴灶團購的清單工具（不是官網結帳頁）  
> 1. 打開：https://你的網址  
> 2. 貼商品連結 → 讀取  
> 3. 選口味、填數量、在「誰要買」寫名字  
> 4. 下面會出現總金額，也可以按「複製給群組」

實際下單仍回 [papazao.tw](https://www.papazao.tw/) 結帳。這個頁只負責對帳。

---

## 檢查代理有沒有成功

瀏覽器打開：

`https://你的網址/proxy?handle=sigang-farmers-sesame-oil-balm-mint`

若看到 JSON（裡面有 `"title":"【西港區農會】麻油達..."`）就成功了。
