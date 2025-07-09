FROM node:20-alpine3.18


WORKDIR /app

COPY . . 

RUN npm i -g pnpm
RUN apk add --no-cache openssl
RUN pnpm install
RUN pnpm build 



CMD ["pnpm", "start"]

