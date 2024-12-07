FROM node:18

ADD . /app

WORKDIR /app

RUN ls /app -al

# RUN yarn && yarn install:prd && yarn build @app/user
RUN yarn && yarn build @app/user

COPY src/apps/user/package.json dist/apps/user/
COPY src/apps/user/tsconfig.json dist/apps/user/

EXPOSE 3000

RUN ls dist/apps/user -al

RUN ls /app -al

RUN yarn

CMD yarn start:user:prd