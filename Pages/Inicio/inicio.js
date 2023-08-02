const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", function () {
  ipcRenderer
    .invoke("fetch-group")
    .then((results) => {
      console.log(results);
      showDailySummary(results);
    })
    .catch((error) => {
      console.error("Error fetching remisiones count by date:", error.message);
    });

  ipcRenderer
    .invoke("fetch-linechart")
    .then((results) => {
      showLineChart(results);
    })
    .catch((error) => {
      console.error("Error fetching remisiones count by date:", error.message);
    });

  ipcRenderer
    .invoke("fetch-piechart")
    .then((results) => {
      showPieChart(results);
    })
    .catch((error) => {
      console.error("Error fetching remisiones count by date:", error.message);
    });

  ipcRenderer
    .invoke("fetch-stackedBarChart")
    .then((results) => {
      showStackedBarChart(results);
    })
    .catch((error) => {
      console.error("Error fetching remisiones count by date:", error.message);
    });
});

function showDailySummary(results) {
  const planchado = document.getElementById("planchado");
  const tintoreria = document.getElementById("tintoreria");
  const lavado = document.getElementById("lavado");
  planchado.innerText = results[0].Cantidad ? results[0].Cantidad : 0;
  tintoreria.innerText = results[1].Cantidad ? results[1].Cantidad : 0;
  lavado.innerText = results[2].Cantidad ? results[2].Cantidad : 0;
}

function showLineChart(results) {
  const labels = results.map((result) => {
    switch (new Date(result.day).getDay()) {
      case 0:
        return "Domingo";
      case 1:
        return "Lunes";
      case 2:
        return "Martes";
      case 3:
        return "Miércoles";
      case 4:
        return "Jueves";
      case 5:
        return "Viernes";
      case 6:
        return "Sábado";
    }
  });
  const data = results.map((result) => result.count);

  const ctx = document.getElementById("lineChart");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Número de órdenes",
          data: data,
          borderWidth: 3,
          pointStyle: "circle",
          pointRadius: 5,
          pointHoverRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function showPieChart(results) {
  const labels = results.map((result) => result.servicio);
  const data = results.map((result) => result.total);

  const ctx = document.getElementById("pieChart");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            fontSize: 20,
          },
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.label + ": " + tooltipItem.parsed + "%";
            },
          },
        },
      },
    },
  });
}

function showStackedBarChart(results) {
  const clientes = results.map((result) => result.cliente);
  const importes = results.map((result) => result.importe);
  const remisiones = results.map((result) => result.remisiones);

  const ctx = document.getElementById("stackedBarChart");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: clientes,
      datasets: [
        {
          label: "Importe",
          data: importes,
          stack: "combined",
          type: "bar",
        },
        {
          label: "Num. remisiones",
          data: remisiones,
          stack: "combined",
          borderWidth: 3,
          pointStyle: "circle",
          pointRadius: 5,
          pointHoverRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          stacked: true,
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              var label = context.dataset.label || "";

              if (label === "Importe") {
                label += ": $" + context.parsed.y;
              } else if (label === "Num. remisiones") {
                label += ": " + context.parsed.y;
              }
              return label;
            },
          },
        },
      },
    },
  });
}
