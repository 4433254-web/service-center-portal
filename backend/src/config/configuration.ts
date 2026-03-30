export default () => ({
  app: {
    name: process.env.APP_NAME,
    env: process.env.NODE_ENV,
    port: Number(process.env.PORT ?? 3001),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucket: process.env.S3_BUCKET,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  },
});
