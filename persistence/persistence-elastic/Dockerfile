FROM node:12-alpine as build
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM scbexperimental/persistence-sdk-nodejs:latest
WORKDIR /home/app/persistence-wrapper/persistence/
COPY --from=build --chown=app:app /home/app/node_modules/ ./node_modules/
COPY --chown=app:app ./persist.js ./persist.js
