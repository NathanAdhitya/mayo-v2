FROM node:18-alpine
WORKDIR /srv/app/

COPY package*.json ./
RUN yarn install

COPY . .
RUN yarn build && rm -r src

CMD ["node", "."]