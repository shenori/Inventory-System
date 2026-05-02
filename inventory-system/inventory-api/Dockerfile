FROM dunglas/frankenphp

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    curl \
    git \
    && docker-php-ext-install pdo pdo_pgsql zip bcmath opcache

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8000

ENV SERVER_NAME=:8000
ENV APP_ENV=production

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]