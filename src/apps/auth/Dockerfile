FROM node:18

ADD . /app

WORKDIR /app

RUN ls /app -al

# RUN yarn && yarn install:prd && yarn build @app/auth
RUN yarn && yarn build @app/auth

COPY src/apps/auth/package.json dist/apps/auth/
COPY src/apps/auth/tsconfig.json dist/apps/auth/

EXPOSE 5000

RUN ls dist/apps/auth -al

RUN ls /app -al

RUN yarn

CMD yarn start:auth:prd