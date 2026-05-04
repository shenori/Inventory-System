FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    curl \
    git \
    && docker-php-ext-install pdo pdo_pgsql zip bcmath

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8000

CMD php artisan config:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000
