const { Vonage } = require("@vonage/server-sdk");

const vonage = new Vonage({
  apiKey: "9e291f3b",
  apiSecret: "R46AZ7pxRk9b69pe",
});

const from = "Plancha2";
const to = "525581013572";
const text = `
Plancha2
Augusto Rodin 306F, Col. Extremadura Insurgentes, Benito Juárez
Tel. 55 8538 1991
Horario:
Lun a Vie - 9:00 a 20:00
Sab - 9:00 a 17:00
Dom - 10:00 a 14:00

ID Remisión: 1691372777185
Fecha Recepción: 2023-08-11
Cliente: Miguel Richter
Teléfono: 5581013572
Domicilio: Fragonard 48

-------- RESUMEN --------

Planchado regular (x12) - $140
Planchado (x2) - $40

-------------------------

Fecha Entrega: 2023-08-11

IVA: No
Total: $180
Anticipo: $100
Saldo: $80
`;

const opts = {
  type: "unicode",
};

async function sendSMS() {
  await vonage.sms
    .send({ to, from, text, ...opts })
    .then((resp) => {
      console.log("Message sent successfully");
      console.log(resp);
    })
    .catch((err) => {
      console.log("There was an error sending the messages.");
      console.error(err);
    });
}

sendSMS();
