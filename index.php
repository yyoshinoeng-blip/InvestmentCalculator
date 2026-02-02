<?php
// 初期設定
require_once 'vendor/autoload.php';

// ルーティング例
if ($_SERVER['REQUEST_URI'] === '/') {
    echo "Hello, PHP!";
} else {
    http_response_code(404);
    echo "Not Found";
}