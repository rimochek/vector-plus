import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.use(cookieParser());

  // Enable validation pipe
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 5000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
