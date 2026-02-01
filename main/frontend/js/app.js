let chart;
let scenarios = [];

/* 初期化 */
document.addEventListener("DOMContentLoaded", () => {

  loadFromStorage();
  renderScenarioList();

  document
    .getElementById("runBtn")
    .addEventListener("click", addScenario);

});


/* シナリオ追加 */
function addScenario() {

  const data = getFormData();

  if (!validate(data)) {
    alert("正しく入力してください");
    return;
  }

  scenarios.push(data);

  saveToStorage();

  renderScenarioList();

  runSimulation();
}


/* フォーム取得 */
function getFormData() {

  return {
    principal: Number(principal.value),
    monthly: Number(monthly.value),
    rate: Number(rate.value),
    years: Number(years.value)
  };
}


/* 入力チェック */
function validate(d) {

  if (d.principal < 0) return false;
  if (d.monthly < 0) return false;
  if (d.rate < 0) return false;
  if (d.years <= 0) return false;

  return true;
}


/* 保存 */
function saveToStorage() {
  localStorage.setItem("scenarios", JSON.stringify(scenarios));
}


/* 読込 */
function loadFromStorage() {

  const data = localStorage.getItem("scenarios");

  if (data) {
    scenarios = JSON.parse(data);
  }
}


/* 一覧描画 */
function renderScenarioList() {

  const ul = document.getElementById("scenarioList");

  ul.innerHTML = "";

  scenarios.forEach((s, i) => {

    const li = document.createElement("li");

    li.className = "border p-2 mb-2";

    li.innerHTML = `
      <b>パターン${i + 1}</b><br>
      元本:${s.principal.toLocaleString()} /
      積立:${s.monthly.toLocaleString()} /
      利率:${s.rate}% /
      ${s.years}年
      <button onclick="removeScenario(${i})"
        class="ml-2 text-red-500">削除</button>
    `;

    ul.appendChild(li);

  });
}


/* 削除 */
function removeScenario(i) {

  scenarios.splice(i, 1);

  saveToStorage();

  renderScenarioList();

  runSimulation();
}


/* 計算実行 */
function runSimulation() {

  if (scenarios.length === 0) return;

  const labels = [];
  const datasets = [];

  const maxMonths = Math.max(
    ...scenarios.map(s => s.years * 12)
  );


  for (let m = 1; m <= maxMonths; m++) {
    labels.push(m + "ヶ月");
  }


  scenarios.forEach((s, idx) => {

    let total = s.principal;

    const rate = s.rate / 100 / 12;

    const data = [];


    for (let i = 1; i <= s.years * 12; i++) {

      total = total * (1 + rate) + s.monthly;

      data.push(Math.round(total));
    }

    datasets.push({
      label: "パターン" + (idx + 1),
      data: data,
      borderWidth: 2,
      fill: false
    });

  });


  drawChart(labels, datasets);
}


/* グラフ */
function drawChart(labels, datasets) {

  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();


  chart = new Chart(ctx, {

    type: "line",

    data: {
      labels,
      datasets
    },

    options: {
      responsive: true
    }

  });

}
