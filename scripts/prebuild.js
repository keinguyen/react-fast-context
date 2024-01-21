const fs = require("fs");
const { join } = require("path");

fs.rmSync(join(__dirname, "../dist"), { recursive: true, force: true });
