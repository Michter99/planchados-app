const { ipcRenderer } = require("electron");

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
        <button type="button" class="btn btn-danger" onclick="deleteRow(this)">Eliminar</button>
      </td>
    `;

  // Set the innerHTML of the newly created row
  row.innerHTML = newRow;

  // Add an event listener to the "importe" input that updates the total whenever it changes
  row
    .querySelector('input[name="importe"]')
    .addEventListener("input", updateTotal);

  // Append the row to the table body
  tableBody.appendChild(row);
}

// Function to delete a row from the table
function deleteRow(button) {
  const row = button.closest("tr");
  row.remove();
  updateTotal();
}

// Function to update the total
function updateTotal() {
  let total = 0;
  const rows = document.querySelectorAll("#services-table tr");

  // Iterate through each row and add the "importe" value to the total
  rows.forEach((row) => {
    let importe = row.querySelector('input[name="importe"]');
    if (importe) {
      total += parseFloat(importe.value) || 0;
    }
  });

  // If the IVA checkbox is checked, multiply the total by 1.16
  if (document.getElementById("iva").checked) {
    total *= 1.16;
  }

  // Set the total input value to the total sum (toFixed(2) ensures two decimal places)
  document.getElementById("total").value = total.toFixed(2);

  // Also update the saldo whenever the total changes
  updateSaldo();
}

document.getElementById("iva").addEventListener("change", () => updateTotal());

// Function to update the saldo
function updateSaldo() {
  let total = parseFloat(document.getElementById("total").value) || 0;
  let anticipo = parseFloat(document.getElementById("anticipo").value) || 0;

  let saldo = total - anticipo;

  document.getElementById("saldo").value = saldo.toFixed(2);
}

// Update the saldo whenever the total or anticipo values change
document.getElementById("total").addEventListener("input", updateSaldo);
document.getElementById("anticipo").addEventListener("input", updateSaldo);

window.onload = function () {
  updateTotal();
  updateSaldo();
};

// Data submit
document
  .getElementById("vender-form")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // prevent form from being submitted to the server

    const fechaRecepcion = document.getElementById("fecha-recepcion");
    const cliente = document.getElementById("cliente");
    const telefono = document.getElementById("telefono");
    const domicilio = document.getElementById("domicilio");

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

    const fechaEntrega = document.getElementById("fecha-entrega");
    const iva = document.getElementById("iva");
    const total = document.getElementById("total");
    const anticipo = document.getElementById("anticipo");
    const saldo = document.getElementById("saldo");

    const formData = {
      fechaRecepcion: fechaRecepcion.value,
      cliente: cliente.value,
      telefono: telefono.value,
      domicilio: domicilio.value,
      services: data,
      fechaEntrega: fechaEntrega.value,
      iva: iva.checked,
      total: parseFloat(total.value) || 0,
      anticipo: parseFloat(anticipo.value) || 0,
      saldo: parseFloat(saldo.value) || 0,
    };

    ipcRenderer
      .invoke("submit-form", formData)
      .then((result) => {
        // clear form inputs after successful submission
        fechaRecepcion.value = "";
        cliente.value = "";
        telefono.value = "";
        domicilio.value = "";
        fechaEntrega.value = "";
        iva.checked = false;
        total.value = "";
        anticipo.value = "";
        saldo.value = "";

        // remove all service rows
        rows.forEach((row) => row.parentNode.removeChild(row));

        alert("Remisión generada exitosamente");

        // add a new service row
        addRow();
      })
      .catch((err) => {
        console.error("Error inserting data:", err.message);
      });
  });
