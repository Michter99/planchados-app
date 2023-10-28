const { ipcRenderer } = require("electron");

// Get the input fields and search buttons
const idInput = document.getElementById("id-search");
const clienteInput = document.getElementById("cliente-search");
const searchButton = document.getElementById("btn-search");

// Add click events to the search buttons
idInput.addEventListener("input", function () {
  clienteInput.value = "";
});

clienteInput.addEventListener("input", function () {
  idInput.value = "";
});

searchButton.addEventListener("click", function () {
  if (idInput.value === "") {
    ipcRenderer
      .invoke("search-by-cliente", clienteInput.value)
      .then((results) => {
        renderResults(results);
      })
      .catch((error) => {
        console.error("Error searching data:", error.message);
      });
  } else if (clienteInput.value === "") {
    ipcRenderer
      .invoke("search-by-id", idInput.value)
      .then((results) => {
        renderResults(results);
      })
      .catch((error) => {
        console.error("Error searching data:", error.message);
      });
  }
});

// This function attaches event listeners to the "Detalles" anc Descripciones buttons
function attachButtonListeners() {
  const detailsButtons = document.querySelectorAll(".details-button");
  detailsButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const remisionId = button.getAttribute("data-id");
      openDetailsModal(remisionId);
    });
  });

  const descripcionButtons = document.querySelectorAll(".desc-button");
  descripcionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const remisionId = button.getAttribute("data-id");
      openDescripcionModal(remisionId);
    });
  });
}

// This function will take a list of results and update the table
function renderResults(results) {
  // Clear the existing table contents
  const tbody = document.getElementById("rem-body");
  tbody.innerHTML = "";

  // Add a row to the table for each result
  results.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.id_remision}</td>
      <td>${item.cliente}</td>
      <td>${new Date(item.fh_recepcion).toLocaleDateString()}</td>
      <td>${new Date(item.fh_entrega).toLocaleDateString()}</td>
      <td>$${item.total.toFixed(2)}</td>
      <td>$${item.anticipo.toFixed(2)}</td>
      <td>$${item.saldo.toFixed(2)}</td>
      <td>
        <button class="btn details-button" data-id="${
          item.id_remision
        }">Detalles</button>
      </td>
      <td>
        <button class="btn desc-button" data-id="${
          item.id_remision
        }">Modificar</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Attach event listeners to the buttons in the new rows
  attachButtonListeners();
}

// Add this JavaScript code after fetching the data and creating the table rows
ipcRenderer
  .invoke("fetch-report-data")
  .then((results) => {
    renderResults(results);
  })
  .catch((error) => {
    console.error("Error fetching data:", error.message);
  });

// Attach button listeners after initial fetch
attachButtonListeners();

function openDescripcionModal(remisionId) {
  // Get the modal element
  const modalElement = document.getElementById("descripcionesModal");

  // Create the modal content
  const modalContent = `
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content">
      <div class="modal-header">
            <h5 class="modal-title" id="detailsModalLabel">Folio ${remisionId}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
        <div class="modal-body">
          <div style="max-height: 500px; overflow-y: auto;">
            <table class="table table-bordered table-lg">
              <thead>
                <tr>
                  <th class="w-25">Código</th>
                  <th>Descripción</th>
                  <th class="w-25">Estado</th>
                  <th class="w-25">Acción</th>
                </tr>
              </thead>
              <tbody id="descripcion-table">
                <!-- Contenido de la tabla -->
              </tbody>
            </table>
          </div>
          <button class="btn btn-outline-primary" id="add-row-button">
            Añadir fila
          </button>
          <button class="btn btn-outline-danger" id="canc-desc">
            Cancelar
          </button>
          <button class="btn btn-outline-success" id="submit-desc">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  `;

  // Set the modal's innerHTML
  modalElement.innerHTML = modalContent;

  // Initialize the modal
  const bootstrapModal = new bootstrap.Modal(modalElement);
  bootstrapModal.show();

  // Fetch existing descriptions when the modal opens
  ipcRenderer
    .invoke("fetch-descriptions-by-remisionId", remisionId)
    .then((descriptions) => {
      const descripcionTable = document.getElementById("descripcion-table");
      descriptions.forEach((desc) => {
        const row = document.createElement("tr");

        row.innerHTML = `
        <td><input class="form-control codigo" type="number" value="${
          desc.codigo
        }"></td>
        <td><input class="form-control descripcion" type="text" value="${
          desc.descripcion
        }"></td>
        <td>
          <select class="form-select estado">
            <option value="Pendiente" ${
              desc.estado === "Pendiente" ? "selected" : ""
            }>Pendiente</option>
            <option value="Listo" ${
              desc.estado === "Listo" ? "selected" : ""
            }>Listo</option>
            <option value="Entregado" ${
              desc.estado === "Entregado" ? "selected" : ""
            }>Entregado</option>
          </select>
        </td>
        <td><button class="btn btn-delete">Eliminar</button></td>
    `;

        descripcionTable.appendChild(row);

        // Add event listener to delete button
        const deleteButton = row.querySelector(".btn-delete");
        deleteButton.addEventListener("click", function () {
          descripcionTable.removeChild(row);
        });
      });
    })
    .catch((error) => {
      console.error("Error fetching descriptions:", error.message);
    });

  // Add event listener to the "Añadir fila" button
  const addRowButton = document.getElementById("add-row-button");
  addRowButton.addEventListener("click", function () {
    addRowToDescripcionTable();
  });

  // Cancelar event listener
  const cancelButtonDesc = document.getElementById("canc-desc");
  cancelButtonDesc.addEventListener("click", function () {
    bootstrapModal.hide();
  });

  // Confirmar event listener
  const confirmButtonDesc = document.getElementById("submit-desc");
  confirmButtonDesc.addEventListener("click", function () {
    let codigos = document.querySelectorAll(".codigo");
    let descripciones = document.querySelectorAll(".descripcion");
    let estados = document.querySelectorAll(".estado");

    codigos = [...codigos].map((codigo) => codigo.value);
    descripciones = [...descripciones].map((descripcion) => descripcion.value);
    estados = [...estados].map((estado) => estado.value);

    const dataDesc = {
      idRemision: remisionId,
      codigos: codigos,
      descripciones: descripciones,
      estados: estados,
    };

    ipcRenderer
      .invoke("insert-descriptions", dataDesc)
      .then((results) => {
        console.log("Inserted descriptions:", results);
      })
      .catch((error) => {
        console.error("Error inserting descriptions:", error.message);
      });

    bootstrapModal.hide();
  });
}

function addRowToDescripcionTable() {
  const tableBody = document.getElementById("descripcion-table");

  // Create a new row and cells
  const newRow = document.createElement("tr");
  const codigoCell = document.createElement("td");
  const descripcionCell = document.createElement("td");
  const estadoCell = document.createElement("td");
  const deleteCell = document.createElement("td"); // New delete cell

  // Create input elements
  const codigoInput = document.createElement("input");
  codigoInput.classList.add("form-control", "codigo");
  codigoInput.type = "number";

  const descripcionInput = document.createElement("input");
  descripcionInput.classList.add("form-control", "descripcion");
  descripcionInput.type = "text";

  // Create select element
  const estadoSelect = document.createElement("select");
  estadoSelect.classList.add("form-select", "estado");

  const option1 = document.createElement("option");
  option1.value = "Pendiente";
  option1.text = "Pendiente";
  estadoSelect.appendChild(option1);

  const option2 = document.createElement("option");
  option2.value = "Listo";
  option2.text = "Listo";
  estadoSelect.appendChild(option2);

  const option3 = document.createElement("option");
  option3.value = "Entregado";
  option3.text = "Entregado";
  estadoSelect.appendChild(option3);

  // Create delete button
  const deleteButton = document.createElement("button");
  deleteButton.classList.add("btn-delete", "btn");
  deleteButton.innerText = "Eliminar";
  deleteButton.addEventListener("click", function () {
    tableBody.removeChild(newRow);
  });
  deleteCell.appendChild(deleteButton); // Add delete button to the delete cell

  // Add the inputs to the cells
  codigoCell.appendChild(codigoInput);
  descripcionCell.appendChild(descripcionInput);
  estadoCell.appendChild(estadoSelect);

  // Add the cells to the row
  newRow.appendChild(codigoCell);
  newRow.appendChild(descripcionCell);
  newRow.appendChild(estadoCell);
  newRow.appendChild(deleteCell); // Add delete cell to the row

  // Add the row to the table body
  tableBody.appendChild(newRow);
}

// Function to open the Bootstrap modal with details for the selected remission
function openDetailsModal(remisionId) {
  // Get the Bootstrap modal element
  const modalElement = document.getElementById("detailsModal");

  // Fetch the details of the specific remision with the provided ID
  ipcRenderer
    .invoke("fetch-remision-details", remisionId)
    .then((remisionDetails) => {
      // Populate the modal with the remision details
      const productRows = remisionDetails
        .map((product) => {
          const services = [
            "Planchado regular",
            "Planchado",
            "Tintorería regular",
            "Tintorería",
            "Lavado",
            "Edredón individual",
            "Edredón matrimonial",
            "Edredón queen",
            "Edredón king",
            "Edredón pluma",
            "Almohada",
            "Reparación",
            "Tapete",
            "Otros",
          ];
          const serviceOptions = services
            .map(
              (service) =>
                `<option value="${service}" ${
                  service === product.servicio ? "selected" : ""
                }>${service}</option>`
            )
            .join("");
          return `
            <tr>
              <td>
                <select class="form-select" name="servicio" disabled>
                  ${serviceOptions}
                </select>
              </td>
              <td>
                <input type="number" step="0.01" class="form-control" name="cantidad" value="${product.cantidad}" required disabled>
              </td>
              <td class="input-group">
                <span class="input-group-text">$</span>
                <input type="number" step="0.01" class="form-control" name="importe" value="${product.importe}" required disabled>
              </td>
              <td>
                <button type="button" class="btn btn-danger btn-delete me-3" onclick="deleteRow(this)" disabled>Eliminar</button>
              </td>
            </tr>
          `;
        })
        .join("");

      modalElement.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="detailsModalLabel">Folio ${
              remisionDetails[0].id_remision
            }</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="edit-form">
              <div class="row">
                <div class="mb-3 col-6">

                  <label for="cliente"><b>Cliente</b></label>
                  <input
                    type="text"
                    id="cliente"
                    name="cliente"
                    class="form-control mb-3"
                    value="${remisionDetails[0].cliente}"
                    disabled
                    required
                  />

                  <label for="fecha-recepcion"><b>Fecha de recepción</b></label>
                  <input
                    type="date"
                    id="fecha-recepcion"
                    name="fecha-recepcion"
                    class="form-control mb-3"
                    value="${
                      new Date(remisionDetails[0].fh_recepcion)
                        .toISOString()
                        .split("T")[0]
                    }"
                    disabled
                    required
                  />

                  <label for="telefono"><b>Teléfono</b></label>
                  <input
                    type="text"
                    id="telefono"
                    name="telefono"
                    class="form-control mb-3"
                    value="${remisionDetails[0].telefono}"
                    disabled
                    required
                  />

                  <label for="domicilio"><b>Domicilio</b></label>
                  <input
                    type="text"
                    id="domicilio"
                    name="domicilio"
                    class="form-control"
                    value="${remisionDetails[0].domicilio}"
                    disabled
                    required
                  />

                  <div class="form-check mt-4">
                    <input class="form-check-input" type="checkbox" value="" id="iva" ${
                      remisionDetails[0].iva === 1 ? "checked" : ""
                    } disabled/>
                    <label class="form-check-label" for="iva">Agregar IVA</label>
                  </div>


                </div>

                <div class="mb-3 col-6">

                  <label for="fecha-entrega"><b>Fecha de entrega</b></label>
                  <input
                    type="date"
                    id="fecha-entrega"
                    name="fecha-entrega"
                    class="form-control mb-3"
                    value="${
                      new Date(remisionDetails[0].fh_entrega)
                        .toISOString()
                        .split("T")[0]
                    }"
                    disabled
                    required
                  />

                  <label for="total"><b>Total</b></label>
                  <div class="input-group mb-3">
                  <span class="input-group-text">$</span>
                  <input
                    type="text"
                    id="total"
                    name="total"
                    class="form-control"
                    value="${remisionDetails[0].total}"
                    disabled
                    required
                  />
                  </div>

                  <label for="anticipo"><b>Anticipo</b></label>
                  <div class="input-group mb-3">
                  <span class="input-group-text">$</span>
                  <input
                    type="text"
                    id="anticipo"
                    name="anticipo"
                    class="form-control"
                    value="${remisionDetails[0].anticipo}"
                    disabled
                    required
                  />
                  </div>

                  <label for="saldo"><b>Saldo</b></label>
                  <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    type="text"
                    id="saldo"
                    name="saldo"
                    class="form-control"
                    value="${remisionDetails[0].saldo}"
                    disabled
                    required
                  />
                  </div>

                </div>

                <table class="table table-detail mt-3">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Cantidad</th>
                      <th>Importe</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody id="services-table">
                    ${productRows}
                  </tbody>
                </table>

                <button
                  id="btn-add"
                  type="button"
                  class="btn btn-outline-primary"
                  onclick="addRow()"
                >
                  Agregar Fila
                </button>

              </div>
            </form>
            
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" id="edit-button">Editar</button>
            <button type="button" class="btn btn-primary" id="confirm-button" style="display: none;">Confirmar</button>
            <button type="button" class="btn btn-secondary" id="cancel-button" style="display: none;">Cancelar</button>
          </div>
        </div>
      </div>
      `;

      // Show the modal
      const bootstrapModal = new bootstrap.Modal(modalElement);
      bootstrapModal.show();

      // Add event listeners after the modal is shown
      const editButton = document.getElementById("edit-button");
      const confirmButton = document.getElementById("confirm-button");
      const cancelButton = document.getElementById("cancel-button");
      const inputs = document.querySelectorAll("#edit-form input");
      const selects = document.querySelectorAll("select");
      const deleteButtons = document.querySelectorAll(".btn-delete");
      const ivaChecks = document.querySelectorAll(".form-check-input");
      const addColBtn = document.getElementById("btn-add");
      const importeInputs = document.querySelectorAll('input[name="importe"]');
      const ivaCheckbox = document.getElementById("iva");
      const anticipoInput = document.getElementById("anticipo");

      // When the 'Edit' button is clicked...
      editButton.addEventListener("click", function () {
        // Enable form

        inputs.forEach((input) => {
          if (input.id != "total" && input.id != "saldo")
            input.disabled = false;
        });

        selects.forEach((select) => {
          select.disabled = false;
        });

        deleteButtons.forEach((button) => {
          button.disabled = false;
        });

        ivaChecks.forEach((check) => {
          check.disabled = false;
        });

        // Hide the 'Edit' button and show the 'Confirm' and 'Cancel' buttons
        editButton.style.display = "none";
        confirmButton.style.display = "inline-block";
        cancelButton.style.display = "inline-block";
        addColBtn.style.display = "inline-block";

        // Attach event listeners
        importeInputs.forEach((input) => {
          input.addEventListener("input", calculateAndUpdate);
        });
        ivaCheckbox.addEventListener("change", calculateAndUpdate);
        anticipoInput.addEventListener("input", calculateAndUpdate);

        // Perform initial calculation
        calculateAndUpdate();
      });

      // When the 'Confirm' button is clicked...
      confirmButton.addEventListener("click", function () {
        // TODO: Perform validation and send updated data to server
        const cliente = document.getElementById("cliente");
        const fh_recepcion = document.getElementById("fecha-recepcion");
        const telefono = document.getElementById("telefono");
        const domicilio = document.getElementById("domicilio");
        const fh_entrega = document.getElementById("fecha-entrega");
        const iva = document.getElementById("iva");
        const total = document.getElementById("total");
        const anticipo = document.getElementById("anticipo");
        const saldo = document.getElementById("saldo");
        const rows = document.querySelectorAll("#services-table tr");
        const data = Array.from(rows).map((row) => {
          const servicio = row.querySelector('select[name="servicio"]');
          const cantidad = row.querySelector('input[name="cantidad"]');
          const importe = row.querySelector('input[name="importe"]');
          return {
            servicio: servicio ? servicio.value : null,
            cantidad: cantidad ? parseFloat(cantidad.value) || 0 : null,
            importe: importe ? parseFloat(importe.value) || 0 : null,
          };
        });

        const formData = {
          idRemision: remisionDetails[0].id_remision,
          fechaRecepcion: fh_recepcion.value,
          cliente: cliente.value,
          telefono: telefono.value,
          domicilio: domicilio.value,
          services: data,
          fechaEntrega: fh_entrega.value,
          iva: iva.checked,
          total: parseFloat(total.value) || 0,
          anticipo: parseFloat(anticipo.value) || 0,
          saldo: parseFloat(saldo.value) || 0,
        };

        ipcRenderer
          .invoke("update-form", formData)
          .then((result) => {
            // Fetch the updated data and re-render the table
            ipcRenderer
              .invoke("fetch-report-data")
              .then((results) => {
                renderResults(results);
                bootstrapModal.hide();
              })
              .catch((error) => {
                console.error("Error fetching data:", error.message);
              });
          })
          .catch((err) => {
            console.error("Error inserting data:", err.message);
          });
      });

      // When the 'Cancel' button is clicked...
      cancelButton.addEventListener("click", function () {
        bootstrapModal.hide();
      });
    })
    .catch((error) => {
      console.error("Error fetching remision details:", error);
    });
}

// Create a function to calculate and update total and saldo
function calculateAndUpdate() {
  const totalElement = document.getElementById("total");
  const anticipoInput = document.getElementById("anticipo");
  const saldoElement = document.getElementById("saldo");
  const importeInputs = document.querySelectorAll('input[name="importe"]');
  const ivaCheckbox = document.getElementById("iva");

  let total = 0;
  for (const importeInput of importeInputs) {
    total += Number(importeInput.value);
  }
  if (ivaCheckbox.checked) {
    total *= 1.16;
  }
  totalElement.value = total.toFixed(2);
  const saldo = total - Number(anticipoInput.value);
  saldoElement.value = saldo.toFixed(2);
}

function addRow() {
  const tableBody = document.getElementById("services-table");

  // Create a new row
  const row = document.createElement("tr");

  // Define the innerHTML of the row
  const newRow = `
      <td>
        <select class="form-select" name="servicio">
          <option value="Planchado regular">Planchado regular</option>
          <option value="Planchado">Planchado</option>
          <option value="Tintorería regular">Tintorería regular</option>
          <option value="Tintorería">Tintorería</option>
          <option value="Lavado">Lavado</option>
          <option value="Edredón individual">Edredón individual</option>
          <option value="Edredón matrimonial">Edredón matrimonial</option>
          <option value="Edredón queen">Edredón queen</option>
          <option value="Edredón king">Edredón king</option>
          <option value="Edredón pluma">Edredón pluma</option>
          <option value="Almohada">Almohada</option>
          <option value="Reparación">Reparación</option>
          <option value="Tapete">Tapete</option>
          <option value="Otros">Otros</option>
        </select>
      </td>
      <td>
        <input type="number" step="0.01" class="form-control" name="cantidad" required>
      </td>
      <td class="input-group">
        <span class="input-group-text">$</span>
        <input type="number" step="0.01" class="form-control" name="importe" required>
      </td>
      <td>
        <button type="button" class="btn btn-danger btn-delete me-3" onclick="deleteRow(this)">Eliminar</button>
      </td>
    `;

  // Set the innerHTML of the newly created row
  row.innerHTML = newRow;

  // Add an event listener to the "importe" input that updates the total whenever it changes
  row
    .querySelector('input[name="importe"]')
    .addEventListener("input", calculateAndUpdate);

  // Append the row to the table body
  tableBody.appendChild(row);
}

// Function to delete a row from the table
function deleteRow(button) {
  const row = button.closest("tr");
  row.remove();
  calculateAndUpdate();
}
