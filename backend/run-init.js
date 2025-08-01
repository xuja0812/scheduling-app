require("dotenv").config();
const { initDB } = require("./db");

initDB()
  .then(() => {
    console.log("DB initialization complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("DB initialization failed:", err);
    process.exit(1);
  });
