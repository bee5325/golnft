# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app

# npm packages
RUN npm install -g pnpm
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install -P --frozen-lockfile

# Actual codes
COPY public ./public
COPY src ./src
COPY index.html ./
COPY *config.ts ./
COPY .env ./
RUN npm run build

# production stage
FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80

# Setting default timezone
ENV TZ=Asia/Kuala_Lumpur

# nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
