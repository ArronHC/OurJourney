# Journey Tracker

一个基于 Next.js 的异地恋见面记录网站，用来记录机票、火车票、酒店订单，并通过 Gemini 识别截图内容。

## 技术栈

- Next.js App Router
- Tailwind CSS
- SQLite + better-sqlite3
- SWR
- Framer Motion
- Leaflet
- Gemini API

## 本地开发

```bash
npm install
cp .env.example .env.local
```

编辑 `.env.local`：

```env
GEMINI_API_KEY=your_gemini_api_key
```

启动开发环境：

```bash
npm run dev
```

构建与测试：

```bash
npm run build
npm test
```

## 运行方式

生产环境启动：

```bash
npm start
```

默认端口为 `3000`。

## 数据目录

运行时数据保存在：

- `data/journey.db`
- `data/uploads/`

部署或迁移服务器时，这个目录必须保留。

## GitHub 上传

在项目目录执行：

```bash
git init
git add .
git commit -m "feat: initial journey tracker site"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

如果仓库已经创建但 `main` 非空，先确认远端内容，再决定是否 `pull --rebase` 或强推。

## 服务器部署

下面是基于 `Node.js + PM2 + Nginx` 的部署方式。

### 1. 安装环境

Ubuntu/Debian 示例：

```bash
sudo apt update
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

确认版本：

```bash
node -v
npm -v
pm2 -v
nginx -v
```

### 2. 拉取项目

```bash
cd /var/www
sudo git clone <YOUR_GITHUB_REPO_URL> journey-tracker
sudo chown -R $USER:$USER /var/www/journey-tracker
cd /var/www/journey-tracker
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
GEMINI_API_KEY=your_real_gemini_key
```

### 4. 安装依赖并构建

```bash
npm ci
mkdir -p data/uploads
npm run build
```

### 5. 用 PM2 启动

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

查看状态：

```bash
pm2 status
pm2 logs journey-tracker
```

### 6. 配置 Nginx 反向代理

创建配置文件：

```bash
sudo nano /etc/nginx/sites-available/journey-tracker
```

写入：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/journey-tracker /etc/nginx/sites-enabled/journey-tracker
sudo nginx -t
sudo systemctl reload nginx
```

### 7. 配 HTTPS

如果域名已经解析到服务器，可用 Certbot：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 8. 后续更新

每次更新代码后：

```bash
cd /var/www/journey-tracker
git pull
npm ci
npm run build
pm2 restart journey-tracker
```

## 注意事项

- `.env.local` 不要提交到 GitHub。
- `data/` 不要删，否则数据库和截图会丢失。
- 这个项目用 SQLite，适合个人或小规模自用，不适合多实例横向扩容。
