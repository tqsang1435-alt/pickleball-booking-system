const http = require("http");

const payload = {
  "code": "00",
  "desc": "success",
  "data": {
    "orderCode": 17,
    "amount": 350000,
    "description": "DH25",
    "accountNumber": "0000",
    "reference": "PAYOS1781454822962",
    "transactionDateTime": "2026-06-14 16:33:42",
    "currency": "VND",
    "paymentLinkId": "LNK-UJZ6C0ZJ",
    "code": "00",
    "desc": "success"
  },
  "signature": "5ce33b5b1c3c447a5d57541a11103b6028309564864ae7acbbe0b297b9964d05"
};

const dataStr = JSON.stringify(payload);

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/payments/payos-webhook",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(dataStr)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding("utf8");
  res.on("data", (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on("end", () => {
    console.log("No more data in response.");
  });
});

req.on("error", (e) => {
  console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(dataStr);
req.end();
