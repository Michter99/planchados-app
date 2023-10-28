const { ipcRenderer } = require("electron");

// Function to render the table
function renderTable(results) {
  const tbody = document.getElementById("descriptions-body");

  // First, clear out any existing rows in the table
  tbody.innerHTML = "";

  // Then, create new rows for each item in the results
  results.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
          <td>${item.id_remision}</td>
          <td>${item.codigo}</td>
          <td>${item.descripcion}</td>
          <td>
            <select class="form-select estado-select">
              <option value="Pendiente" ${
                item.estado === "Pendiente" ? "selected" : ""
              }>Pendiente</option>
              <option value="Listo" ${
                item.estado === "Listo" ? "selected" : ""
              }>Listo</option>
              <option value="Entregado" ${
                item.estado === "Entregado" ? "selected" : ""
              }>Entregado</option>
            </select>
          </td>
        `;

    tbody.appendChild(row);

    const estadoSelect = row.querySelector(".estado-select");
    estadoSelect.addEventListener("change", function () {
      const updatedEstado = this.value;
      ipcRenderer
        .invoke("update-estado", {
          id: item.id_descripcion,
          estado: updatedEstado,
        })
        .catch((error) => {
          console.error("Error updating estado:", error.message);
        });
    });
  });
}

// JavaScript code to run when the page loads
document.addEventListener("DOMContentLoaded", function () {
  ipcRenderer
    .invoke("fetch-descriptions")
    .then(renderTable)
    .catch((error) => {
      console.error("Error fetching descriptions:", error.message);
    });
});

const inputRemision = document.getElementById("remision-search");
const inputCodigo = document.getElementById("codigo-search");
const inputDescripcion = document.getElementById("desc-search");
const inputEstado = document.getElementById("estado-search");

inputRemision.addEventListener("input", () => {
  inputCodigo.value = "";
  inputDescripcion.value = "";
  inputEstado.value = "";
});

inputCodigo.addEventListener("input", () => {
  inputRemision.value = "";
  inputDescripcion.value = "";
  inputEstado.value = "";
});

inputDescripcion.addEventListener("input", () => {
  inputRemision.value = "";
  inputCodigo.value = "";
  inputEstado.value = "";
});

inputEstado.addEventListener("change", () => {
  inputRemision.value = "";
  inputCodigo.value = "";
  inputDescripcion.value = "";
});

document.getElementById("btn-search").addEventListener("click", (e) => {
  if (inputRemision.value !== "") {
    ipcRenderer
      .invoke("search-by-remision", inputRemision.value)
      .then(renderTable)
      .catch((err) => console.error("Error searching by remision:", err));
  } else if (inputCodigo.value !== "") {
    ipcRenderer
      .invoke("search-by-codigo", inputCodigo.value)
      .then(renderTable)
      .catch((err) => console.error("Error searching by codigo:", err));
  } else if (inputDescripcion.value !== "") {
    ipcRenderer
      .invoke("search-by-descripcion", inputDescripcion.value)
      .then(renderTable)
      .catch((err) => console.error("Error searching by descripcion:", err));
  } else if (inputEstado.value !== "") {
    console.log(inputEstado.value);
    ipcRenderer
      .invoke("search-by-estado", inputEstado.value)
      .then(renderTable)
      .catch((err) => console.error("Error searching by estado:", err));
  } else {
    ipcRenderer
      .invoke("fetch-descriptions")
      .then(renderTable)
      .catch((error) => {
        console.error("Error fetching descriptions:", error.message);
      });
  }
  inputRemision.value = "";
  inputCodigo.value = "";
  inputDescripcion.value = "";
  inputEstado.value = "";
});
