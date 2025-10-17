# # ใช้ Node.js (เลือก version ที่ตรงกับเครื่อง เช่น 20 LTS)
# FROM node:20-alpine

# WORKDIR /app

# # ติดตั้ง dependencies
# COPY package*.json ./
# RUN npm install

# # คัดลอก source code ทั้งหมด
# COPY . .

# # เปิด port Vite dev server
# EXPOSE 5173

# # รัน dev server (hot reload)
# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---------- Stage 1: Build ----------
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# ---------- Stage 2: Serve ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

