FROM node:lts-alpine

WORKDIR /usr/src/app

# Copy resources
COPY package.json ./
COPY yarn.lock ./
COPY src ./src
COPY .babelrc ./

# install
RUN yarn install
# Compile app sources
RUN yarn build

CMD ["node", "build/index.js"]
