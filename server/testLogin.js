const http = require("http");
const data = JSON.stringify({ email: "rahul.verma@placementtutor.demo", password: "Mentor@123" });
const req = http.request({
  host: "localhost", port: 5000, path: "/api/auth/login", method: "POST",
  headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
}, (res) => {
  let body = "";
  res.on("data", (c) => (body += c));
  res.on("end", () => console.log("STATUS", res.statusCode, "\nBODY", body));
});
req.on("error", (e) => console.log("ERROR", e.message));
req.write(data);
req.end();