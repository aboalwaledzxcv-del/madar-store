FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/madar.sqlite

EXPOSE 4000

CMD ["npm", "start"]
