FROM node:16

RUN apt-get update -y && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends libnss3-dev libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev

ARG GITHUB_TOKEN

WORKDIR /workspace

COPY package.json yarn.lock .npmrc ./

RUN yarn install

COPY ./brain ./brain

RUN cd brain && npx tsc

ENV NODE_ENV=production

CMD ["node", "brain/dist/src/brain.js"]
