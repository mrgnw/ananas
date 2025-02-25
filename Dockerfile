# Node + Bun
FROM node:23 AS bun-base
RUN npm install -g bun
WORKDIR /app

FROM bun-base AS dev
COPY package*.json ./
RUN bun install

COPY . .

ENV NODE_ENV=development
ENV HOST=0.0.0.0
EXPOSE 5173

CMD ["bun", "run", "dev", "--host"]
