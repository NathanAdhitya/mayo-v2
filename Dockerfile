FROM node:18-alpine
WORKDIR /srv/app/

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["node", "."]