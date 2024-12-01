import { RequestMethod, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import bodyParser from 'body-parser';
import { bold } from 'colorette';
import compression from 'compression';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { ErrorType, ILoggerAdapter } from '@/infra/logger';
import { ISecretsAdapter } from '@/infra/secrets';
import { ExceptionHandlerFilter } from '@/observables/filters';
import {
  ExceptionHandlerInterceptor,
  HttpLoggerInterceptor,
  RequestTimeoutInterceptor
} from '@/observables/interceptors';

import { description, name, version } from '../package.json';
import { AuthAppModule } from './modules/modules';

async function bootstrap() {
  const app = await NestFactory.create(AuthAppModule);

  const {
    APPS: {
      AUTH: { HOST, PORT }
    },
    ENV,
    IS_PRODUCTION,
    POSTGRES: { POSTGRES_URL, POSTGRES_PGADMIN_URL }
  } = app.get(ISecretsAdapter);
  const logger = app.get(ILoggerAdapter);

  logger.setApplication(name);
  app.useLogger(logger);

  app.useGlobalFilters(new ExceptionHandlerFilter(logger));

  app.useGlobalInterceptors(
    new RequestTimeoutInterceptor(new Reflector(), logger),
    new ExceptionHandlerInterceptor(),
    new HttpLoggerInterceptor(logger)
  );

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.GET }
    ]
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'blob:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`]
        }
      }
    })
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl && req.originalUrl.split('/').pop() === 'favicon.ico') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(compression());

  app.use(bodyParser.urlencoded({ extended: true }));

  app.enableVersioning({ type: VersioningType.URI });

  process.on('uncaughtException', (error) => {
    logger.error(error as ErrorType);
  });

  process.on('unhandledRejection', (error) => {
    logger.error(error as ErrorType);
  });

  if (!IS_PRODUCTION) {
    const config = new DocumentBuilder()
      .setTitle(name)
      .setDescription(description)
      .addBearerAuth()
      .setVersion(version)
      .addServer(HOST)
      .addTag('Swagger Documentation')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(PORT, () => {
    logger.log(`🟢 ${name} listening at ${bold(PORT)} on ${bold(ENV?.toUpperCase())} 🟢`);
    if (!IS_PRODUCTION) logger.log(`🟢 Swagger listening at ${bold(`${HOST}/docs`)} 🟢`);
  });

  logger.log(`🔵 Postgres listening at ${bold(POSTGRES_URL)}`);
  logger.log(`🔶 PgAdmin listening at ${bold(POSTGRES_PGADMIN_URL)}\n`);
}
bootstrap();
