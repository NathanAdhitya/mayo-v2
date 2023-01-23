FROM node:lts
WORKDIR /srv/app/

COPY package*.json ./
RUN yarn install

COPY . .
RUN yarn build

CMD ["node", "."]