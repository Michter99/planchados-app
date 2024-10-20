-- Create the 'remision' table
CREATE TABLE remisiones (
    id_remision BIGINT PRIMARY KEY,
    fh_recepcion DATETIME,
    fh_entrega DATETIME,
    cliente VARCHAR(255),
    telefono VARCHAR(50),
    domicilio VARCHAR(255),
    iva TINYINT(1),
    total DECIMAL(10,2),
    anticipo DECIMAL(10,2),
    saldo DECIMAL(10,2),
    pago_tarjeta TINYINT(1) -- Indicates whether the payment was made by card
);

-- Create the 'remision_producto' table
CREATE TABLE remision_productos (
    id_remision BIGINT, -- This references remision(id_remision)
    servicio VARCHAR(255),
    cantidad DECIMAL(10,2),
    importe DECIMAL(10,2)
    -- FOREIGN KEY (id_remision) REFERENCES remision(id_remision) -- Not enforced, just a comment
);

-- Create the 'descripcion' table
CREATE TABLE descripciones (
    id_descripcion INT PRIMARY KEY,
    id_remision BIGINT, -- This references remision(id_remision)
    descripcion VARCHAR(255),
    codigo VARCHAR(50),
    estado VARCHAR(50)
    -- FOREIGN KEY (id_remision) REFERENCES remision(id_remision) -- Not enforced, just a comment
);
