# PHP + Apache の公式イメージ
FROM php:8.2-apache

# Apache のドキュメントルートを変更（main/frontend/views を公開ディレクトリにする）
WORKDIR /var/www/html

# プロジェクト全体をコンテナにコピー
COPY . /var/www/html/

# PHP ファイルを使うために必要なモジュール（必要に応じて追加）
RUN docker-php-ext-install pdo pdo_mysql

# Apache の設定（.htaccess を使えるように）
RUN a2enmod rewrite