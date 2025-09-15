# ===== Build Stage =====
# Alpineのマイナー指定で更新を取り込みやすく
FROM node:20-alpine3.20 AS build

WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm i
COPY . .

# サブパスで配信
ENV VITE_BASE=/textTool/
RUN npm run build

# ===== Run Stage (Nginx, 非root) =====
FROM nginx:1.27-alpine3.20

# 非root実行ユーザー（nginx公式はuid:gid 101:101）
USER 101

# SPA向け設定
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

# 成果物の配置（所有権を合わせる）
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html/textTool

EXPOSE 80

# 追加ハードニング（任意）
# read-only FS だと一部ディレクトリに書けずエラーになることがあるため必要に応じて
# RUN mkdir -p /tmp/nginx && chown -R 101:101 /tmp/nginx
# VOLUME ["/tmp/nginx"]
# この行は read-only を使う場合のみ:
# RUN sed -i 's|/var/run/nginx.pid|/tmp/nginx/nginx.pid|g' /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]
