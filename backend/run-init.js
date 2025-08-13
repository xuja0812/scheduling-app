require("dotenv").config();
const { initDB, migration } = require("./db");

migration().then(() => {
  console.log('Migration complete');
  process.exit(0);
}).catch((err) => {
  console.error("Migration error: " + err);
  process.exit(1);
});


