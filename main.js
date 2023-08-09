const { app, BrowserWindow, ipcMain } = require("electron");
const mysql = require("mysql");
const fs = require("fs");

let mainWindow;
let connection; // Declare the connection variable

app.on("ready", () => {
  // Create the MySQL connection
  connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Planchados123$",
    database: "planchados_db",
  });

  // Connect to the database
  connection.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL database:", err.message);
    } else {
      console.log("Connected to MySQL database");
      createMainWindow();
    }
  });
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("./Pages/Login/login.html");

  mainWindow.on("closed", () => {
    // Close the MySQL connection when the app window is closed
    connection.end((err) => {
      if (err) {
        console.error("Error closing MySQL connection:", err.message);
      } else {
        console.log("MySQL connection closed");
      }
    });
    mainWindow = null;
  });
}

// Submit vender data to the database
ipcMain.handle("submit-form", async (event, formData) => {
  const id_remision = Date.now();

  formData.idRemision = id_remision;

  fs.writeFileSync(
    `./tickets/${id_remision}.txt`,
    generateTicket(formData),
    "utf8"
  );

  const query = `INSERT INTO remisiones (id_remision, fh_recepcion, cliente, telefono, domicilio, fh_entrega, iva, total, anticipo, saldo) VALUES (?)`;
  const values = [
    id_remision,
    formData.fechaRecepcion,
    formData.cliente,
    formData.telefono,
    formData.domicilio,
    formData.fechaEntrega,
    formData.iva ? 1 : 0,
    formData.total,
    formData.anticipo,
    formData.saldo,
  ];

  try {
    await new Promise((resolve, reject) => {
      connection.query(query, [values], function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const queryServices = `INSERT INTO remision_productos (servicio, cantidad, importe, id_remision) VALUES (?)`;

    await Promise.all(
      formData.services.map((service) => {
        let valuesServices = [
          service.servicio,
          service.cantidad,
          service.importe,
          id_remision,
        ];
        return new Promise((resolve, reject) => {
          connection.query(
            queryServices,
            [valuesServices],
            function (err, result) {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });
      })
    );
  } catch (error) {
    console.error(error);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Function to fetch the data from the database to reportes
ipcMain.handle("fetch-report-data", async (event) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * 
      FROM remisiones
      ORDER BY id_remision DESC
      LIMIT 50
    `;

    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
});

// Handle the 'fetch-remision-details' event for detalles in reportes
ipcMain.handle("fetch-remision-details", (event, remisionId) => {
  return new Promise((resolve, reject) => {
    // Run the SQL query
    connection.query(
      `
      SELECT *
      FROM remisiones AS A
      JOIN remision_productos AS B
      ON A.id_remision = B.id_remision
      WHERE A.id_remision = ?
    `,
      [remisionId],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
});

// Update vender data to the database
ipcMain.handle("update-form", async (event, formData) => {
  new Promise((resolve, reject) => {
    const deleteQuery = `DELETE FROM remisiones WHERE id_remision = ?`;
    connection.query(
      deleteQuery,
      [formData.idRemision],
      (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });

  const query = `INSERT INTO remisiones (id_remision, fh_recepcion, cliente, telefono, domicilio, fh_entrega, iva, total, anticipo, saldo) VALUES (?)`;
  const values = [
    formData.idRemision,
    formData.fechaRecepcion,
    formData.cliente,
    formData.telefono,
    formData.domicilio,
    formData.fechaEntrega,
    formData.iva ? 1 : 0,
    formData.total,
    formData.anticipo,
    formData.saldo,
  ];
  new Promise((resolve, reject) => {
    connection.query(query, [values], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  const queryServices = `INSERT INTO remision_productos (servicio, cantidad, importe, id_remision) VALUES (?)`;
  formData.services.forEach((service) => {
    let valuesServices = [
      service.servicio,
      service.cantidad,
      service.importe,
      formData.idRemision,
    ];
    new Promise((resolve, reject) => {
      connection.query(queryServices, [valuesServices], function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
});

ipcMain.handle("search-by-id", (event, id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM remisiones WHERE id_remision LIKE ? ORDER BY id_remision DESC LIMIT 50`;
    connection.query(query, [`%${id}%`], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle("search-by-cliente", (event, cliente) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM remisiones WHERE cliente LIKE ? ORDER BY id_remision DESC LIMIT 50`;
    connection.query(query, [`%${cliente}%`], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle(
  "fetch-descriptions-by-remisionId",
  async (event, remisionId) => {
    return new Promise((resolve, reject) => {
      const query = `
      SELECT * 
      FROM descripciones
      WHERE id_remision = ?
    `;
      connection.query(query, [remisionId], function (err, results) {
        if (err) {
          console.error(
            `Error fetching descriptions by remisionId: ${err.message}`
          );
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }
);

ipcMain.handle("insert-descriptions", (event, dataDesc) => {
  new Promise((resolve, reject) => {
    const deleteQuery = `DELETE FROM descripciones WHERE id_remision = ?`;
    connection.query(
      deleteQuery,
      [dataDesc.idRemision],
      (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });

  // Create a query to insert a row into the 'descripciones' table for each description
  const query = `
    INSERT INTO descripciones (descripcion, codigo, id_remision, estado) 
    VALUES ?
  `;
  const descriptionRows = dataDesc.codigos.map((codigo, index) => [
    dataDesc.descripciones[index],
    codigo,
    dataDesc.idRemision,
    dataDesc.estados[index],
  ]);

  return new Promise((resolve, reject) => {
    connection.query(query, [descriptionRows], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle("fetch-descriptions", (event) => {
  const query = "SELECT * FROM descripciones";

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle("update-estado", (event, { id, estado }) => {
  return new Promise((resolve, reject) => {
    const query = `UPDATE descripciones SET estado = ? WHERE id_descripcion = ?`;

    connection.query(query, [estado, id], function (err, result) {
      if (err) {
        console.error(`Error updating estado: ${err.message}`);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
});

ipcMain.handle("search-by-remision", (event, searchTerm) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id_descripcion, descripcion, codigo, id_remision
      FROM descripciones
      WHERE id_remision LIKE ?
      LIMIT 50
    `;
    connection.query(query, [`%${searchTerm}%`], function (err, results) {
      if (err) {
        console.error(
          `Error searching descriptions by remision: ${err.message}`
        );
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle("search-by-codigo", (event, searchTerm) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id_descripcion, descripcion, codigo, id_remision
      FROM descripciones
      WHERE codigo LIKE ?
      LIMIT 50
    `;
    connection.query(query, [`%${searchTerm}%`], function (err, results) {
      if (err) {
        console.error(`Error searching descriptions by codigo: ${err.message}`);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle("search-by-descripcion", (event, searchTerm) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id_descripcion, descripcion, codigo, id_remision
      FROM descripciones
      WHERE descripcion LIKE ?
      LIMIT 50
    `;
    connection.query(query, [`%${searchTerm}%`], function (err, results) {
      if (err) {
        console.error(
          `Error searching descriptions by descripcion: ${err.message}`
        );
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle("fetch-group", (event) => {
  const query = `
  SELECT 'Planchado', SUM(cantidad) AS Cantidad FROM remision_productos
  WHERE (servicio = 'Planchado' OR servicio = 'Planchado regular') 
  AND DATE(FROM_UNIXTIME(id_remision / 1000)) = CURDATE()
  UNION
  SELECT 'Tintorería', SUM(cantidad) AS Cantidad FROM remision_productos
  WHERE (servicio = 'Tintorería' OR servicio = 'Tintorería regular') 
  AND DATE(FROM_UNIXTIME(id_remision / 1000)) = CURDATE()
  UNION
  SELECT 'Lavado', ROUND(SUM(cantidad), 1) AS Cantidad FROM remision_productos
  WHERE servicio = 'Lavado'
  AND DATE(FROM_UNIXTIME(id_remision / 1000)) = CURDATE()
  `;

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle("fetch-linechart", (event) => {
  const query = `SELECT DATE(fh_recepcion) AS 'day', COUNT(*) as 'count'
                 FROM remisiones
                 WHERE YEARWEEK(fh_recepcion) = YEARWEEK(CURDATE())
                 GROUP BY DATE(fh_recepcion)
                 ORDER BY DATE(fh_recepcion)`;

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle("fetch-piechart", (event) => {
  const query = `
SELECT 
  CASE 
    WHEN servicio IN ('Edredón king', 'Edredón queen', 'Edredón matrimonial', 'Edredón individual', 'Edredón pluma') THEN 'Edredones'
    WHEN servicio IN ('Planchado', 'Planchado regular') THEN 'Planchado'
    WHEN servicio IN ('Tintorería', 'Tintorería regular') THEN 'Tintorería'
    ELSE servicio
  END as servicio,
  ROUND((SUM(importe) / total_sum) * 100, 1) as total
FROM 
  remision_productos as A
JOIN 
  remisiones as B ON A.id_remision = B.id_remision,
  (SELECT SUM(importe) as total_sum 
   FROM remision_productos as A
   JOIN remisiones as B ON A.id_remision = B.id_remision
   WHERE YEAR(fh_recepcion) = YEAR(CURDATE()) 
   AND MONTH(fh_recepcion) = MONTH(CURDATE())) as C
WHERE 
  YEAR(fh_recepcion) = YEAR(CURDATE()) 
AND 
  MONTH(fh_recepcion) = MONTH(CURDATE())
GROUP BY 
  CASE 
    WHEN servicio IN ('Edredón king', 'Edredón queen', 'Edredón matrimonial', 'Edredón individual', 'Edredón pluma') THEN 'Edredones'
    WHEN servicio IN ('Planchado', 'Planchado regular') THEN 'Planchado'
    WHEN servicio IN ('Tintorería', 'Tintorería regular') THEN 'Tintorería'
    ELSE servicio
  END
ORDER BY total DESC
`;

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle("fetch-stackedBarChart", (event) => {
  const query = `SELECT cliente, ROUND(sum(total), 1) as importe, count(*) as remisiones
                FROM remisiones
                GROUP BY cliente
                ORDER BY importe DESC
                LIMIT 5`;

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
});

const generateTicket = (ticketInfo) => {
  const header = `
Plancha2
Augusto Rodin 306F, Col. Extremadura Insurgentes, Benito Juárez
Tel. 55 8538 1991
Horario:
Lun a Vie - 9:00 a 20:00
Sab - 9:00 a 17:00
Dom - 10:00 a 14:00
`;

  let servicesDetails = "\n";

  for (let service of ticketInfo.services) {
    servicesDetails += `${service.servicio} (x${service.cantidad}) - $${service.importe}\n`;
  }

  const ticketDetails = `
ID Remisión: ${ticketInfo.idRemision}
Fecha Recepción: ${ticketInfo.fechaRecepcion}
Cliente: ${ticketInfo.cliente}
Teléfono: ${ticketInfo.telefono}
Domicilio: ${ticketInfo.domicilio}

-------- RESUMEN --------
${servicesDetails}
-------------------------

Fecha Entrega: ${ticketInfo.fechaEntrega}

IVA: ${ticketInfo.iva ? "Sí" : "No"}
Total: $${ticketInfo.total}
Anticipo: $${ticketInfo.anticipo}
Saldo: $${ticketInfo.saldo}
`;

  return header + ticketDetails;
};
