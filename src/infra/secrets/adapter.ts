export abstract class ISecretsAdapter {
  ENV!: string;

  LOG_LEVEL!: string;

  DATE_FORMAT!: string;

  APPS!: {
    USER: {
      PORT: number | string;
      HOST: string;
    };
    AUTH: {
      PORT: number | string;
      HOST: string;
    };
  };

  TZ!: string;

  MONGO!: {
    MONGO_URL: string;
    MONGO_EXPRESS_URL: string;
  };

  POSTGRES!: {
    POSTGRES_URL: string;
    POSTGRES_PGADMIN_URL: string;
  };

  EMAIL!: {
    HOST: string;
    PORT: number;
    USER: string;
    PASS: string;
    FROM: string;
  };

  REDIS_URL!: string;

  TOKEN_EXPIRATION!: number | string;
  REFRESH_TOKEN_EXPIRATION!: number | string;

  JWT_SECRET_KEY!: string;

  IS_LOCAL!: boolean;

  IS_PRODUCTION!: boolean;
}
