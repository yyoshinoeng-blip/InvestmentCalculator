<?php

header("Content-Type: application/json");

// POSTデータ取得
$data = json_decode(file_get_contents("php://input"), true);

$principal = $data["principal"] ?? 0;
$monthly   = $data["monthly"] ?? 0;
$rate      = $data["rate"] ?? 0;
$years     = $data["years"] ?? 0;


$monthlyRate = $rate / 100 / 12;

$total = $principal;

$result = [];


for ($i = 1; $i <= $years * 12; $i++) {

  $total = $total * (1 + $monthlyRate) + $monthly;

  $result[] = round($total);
}


echo json_encode([
  "success" => true,
  "data" => $result
]);
