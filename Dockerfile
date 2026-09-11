# Build TypeScript
FROM node:20 AS build
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig.json ./
COPY jest.config.js ./
COPY src ./src
RUN npm install
RUN npm run build

# Install deps & build image
FROM node:20
WORKDIR /usr/src/app
VOLUME /usr/src/app/data
COPY package*.json ./
RUN npm install --only=production
COPY --from=build /usr/src/app/out ./out

RUN mkdir -p /usr/src/app/data \
    && chown -R node:node /usr/src/app/data

ENV NODE_ENV=production

USER node

CMD [ "node", "out/bin/main.js" ]
