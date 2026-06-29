# Imagem do frontend Kayser One (Next.js)
FROM node:20-bookworm-slim

WORKDIR /app

# A URL da API é embutida no build (variável NEXT_PUBLIC_*).
# Ajuste o build-arg se o backend não estiver em localhost:3001.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
