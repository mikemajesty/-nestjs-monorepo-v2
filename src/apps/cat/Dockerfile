FROM node:18

ADD . /app

WORKDIR /app

RUN ls /app -al

# RUN yarn && yarn install:prd && yarn build @app/cat
RUN yarn && yarn build @app/cat

COPY src/apps/cat/package.json dist/apps/cat/
COPY src/apps/cat/tsconfig.json dist/apps/cat/

EXPOSE 4000

RUN ls dist/apps/cat -al

RUN ls /app -al

RUN yarn

CMD yarn start:cat:prd