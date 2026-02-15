// グローバル変数
let scenarios = [];
let chart = null;

// 増額セクションの表示切り替え
function toggleIncreaseSection() {
  const section = document.getElementById('increaseSection');
  const enabled = document.getElementById('enableIncrease').checked;
  section.classList.toggle('hidden', !enabled);
}

// シミュレーション実行
function runSimulation() {
  const principal = parseFloat(document.getElementById('principal').value);
  const monthly = parseFloat(document.getElementById('monthly').value);
  const rate = parseFloat(document.getElementById('rate').value);
  const years = parseInt(document.getElementById('years').value);
  
  // 入力値検証
  if (!principal || !monthly || !rate || !years) {
    alert('すべての項目を入力してください');
    return;
  }

  if (years <= 0) {
    alert('運用年数は1年以上を指定してください');
    return;
  }

  // 増額設定を取得
  let increaseConfig = null;
  if (document.getElementById('enableIncrease').checked) {
    const increaseType = document.querySelector('input[name="increaseType"]:checked').value;
    if (increaseType === 'fixed') {
      increaseConfig = {
        type: 'fixed',
        amount: parseFloat(document.getElementById('increaseAmount').value)
      };
    } else {
      increaseConfig = {
        type: 'percent',
        percent: parseFloat(document.getElementById('increasePercent').value)
      };
    }
  }

  // シナリオを生成
  const scenario = {
    principal,
    monthly,
    rate,
    years,
    increaseConfig,
    id: Date.now()
  };

  // 計算実行
  const result = calculateSimulation(scenario);
  
  // シナリオリストに追加
  scenarios.push({
    ...scenario,
    result
  });

  // UI更新
  updateResults(result, principal);
  updateScenarioList();
  updateChart();

  // ローカルストレージに保存
  saveScenarios();
}

// シミュレーション計算
function calculateSimulation(scenario) {
  const { principal, monthly, rate, years, increaseConfig } = scenario;
  
  const monthlyRate = rate / 100 / 12;
  let total = principal;
  const data = [];
  let totalContribution = 0;

  for (let month = 0; month < years * 12; month++) {
    const monthlyAmount = getMonthlyAmount(monthly, increaseConfig, month);
    total = total * (1 + monthlyRate) + monthlyAmount;
    totalContribution += monthlyAmount;
    data.push(Math.round(total));
  }

  const finalAmount = data[data.length - 1];
  const totalInterest = finalAmount - principal - totalContribution;

  return {
    data,
    finalAmount: Math.round(finalAmount),
    totalContribution: Math.round(totalContribution),
    totalInterest: Math.round(totalInterest)
  };
}

// 月ごとの積立額を計算
function getMonthlyAmount(baseMonthly, increaseConfig, monthIndex) {
  if (!increaseConfig) {
    return baseMonthly;
  }

  const yearsPassed = Math.floor(monthIndex / 12);

  if (increaseConfig.type === 'fixed') {
    return baseMonthly + (increaseConfig.amount * yearsPassed);
  } else if (increaseConfig.type === 'percent') {
    return baseMonthly * Math.pow(1 + increaseConfig.percent / 100, yearsPassed);
  }

  return baseMonthly;
}

// 結果を表示
function updateResults(result, principal) {
  document.getElementById('resultAmount').textContent = 
    result.finalAmount.toLocaleString('ja-JP');
  document.getElementById('resultPrincipal').textContent = 
    principal.toLocaleString('ja-JP');
  document.getElementById('resultContribution').textContent = 
    result.totalContribution.toLocaleString('ja-JP');
  document.getElementById('resultInterest').textContent = 
    result.totalInterest.toLocaleString('ja-JP');
}

// シナリオリストを更新
function updateScenarioList() {
  const list = document.getElementById('scenarioList');
  list.innerHTML = '';

  scenarios.forEach((scenario, index) => {
    const li = document.createElement('li');
    li.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200';
    
    let configText = '増額なし';
    if (scenario.increaseConfig) {
      if (scenario.increaseConfig.type === 'fixed') {
        configText = `毎年+${scenario.increaseConfig.amount.toLocaleString()}円/月`;
      } else {
        configText = `毎年${scenario.increaseConfig.percent}%増加`;
      }
    }

    li.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <p class="font-semibold text-gray-800">パターン ${index + 1}</p>
          <p class="text-xs text-gray-500 mt-1">
            ${scenario.result.finalAmount.toLocaleString()}円
          </p>
          <p class="text-xs text-blue-600 mt-1">${configText}</p>
        </div>
        <button onclick="removeScenario(${index})" class="btn-secondary">
          削除
        </button>
      </div>
    `;

    list.appendChild(li);
  });
}

// シナリオを削除
function removeScenario(index) {
  scenarios.splice(index, 1);
  updateScenarioList();
  
  if (scenarios.length > 0) {
    const result = scenarios[0].result;
    const principal = scenarios[0].principal;
    updateResults(result, principal);
    updateChart();
  } else {
    clearResults();
  }

  saveScenarios();
}

// グラフを更新
function updateChart() {
  const ctx = document.getElementById('chart').getContext('2d');
  
  // グラフデータを準備
  const labels = [];
  const datasets = [];
  
  // 最大ヶ月数を計算
  const maxMonths = Math.max(...scenarios.map(s => s.years * 12));
  
  for (let m = 1; m <= maxMonths; m++) {
    // 3ヶ月ごと、または年初（1月、13月、25月...）に表示
    if (m % 3 === 1 && m % 12 === 1) {
      const year = Math.floor((m - 1) / 12);
      labels.push(`${year}年`);
    } else if (m % 3 === 1 && m % 12 !== 1) {
      const year = Math.floor((m - 1) / 12);
      const month = ((m - 1) % 12) + 1;
      labels.push(`${year}年${month}月`);
    } else {
      labels.push('');
    }
  }

  // 各シナリオのデータセットを作成
  const colors = [
    { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
  ];

  scenarios.forEach((scenario, idx) => {
    const color = colors[idx % colors.length];
    
    datasets.push({
      label: `パターン ${idx + 1}`,
      data: scenario.result.data,
      borderColor: color.border,
      backgroundColor: color.bg,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointBackgroundColor: color.border,
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    });
  });

  // 既存のグラフを破棄
  if (chart) {
    chart.destroy();
  }

  // 新しいグラフを作成
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 12, weight: 'bold' },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y.toLocaleString('ja-JP') + '円';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            callback: function(value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              }
              return value.toLocaleString('ja-JP');
            },
            font: { size: 11, weight: '500' },
            color: '#9ca3af',
            padding: 8
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: { size: 12, weight: 'bold' },
            color: '#4b5563',
            maxRotation: 45,
            minRotation: 0,
            padding: 8
          }
        }
      }
    }
  });
}

// 結果をクリア
function clearResults() {
  document.getElementById('resultAmount').textContent = '---';
  document.getElementById('resultPrincipal').textContent = '---';
  document.getElementById('resultContribution').textContent = '---';
  document.getElementById('resultInterest').textContent = '---';
}

// シナリオを保存
function saveScenarios() {
  const data = scenarios.map(s => ({
    principal: s.principal,
    monthly: s.monthly,
    rate: s.rate,
    years: s.years,
    increaseConfig: s.increaseConfig
  }));
  localStorage.setItem('investmentScenarios', JSON.stringify(data));
}

// シナリオを読込
function loadScenarios() {
  const data = localStorage.getItem('investmentScenarios');
  if (data) {
    const saved = JSON.parse(data);
    saved.forEach(scenario => {
      const result = calculateSimulation(scenario);
      scenarios.push({
        ...scenario,
        id: Date.now(),
        result
      });
    });
    
    if (scenarios.length > 0) {
      updateScenarioList();
      updateResults(scenarios[0].result, scenarios[0].principal);
      updateChart();
    }
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  loadScenarios();
});
