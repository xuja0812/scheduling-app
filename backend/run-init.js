require("dotenv").config();
const { initDB, migration } = require("./db");

initDB()
  .then(() => {
    console.log("DB initialization complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("DB initialization failed:", err);
    process.exit(1);
  });

migration().then(() => {
  console.log('Migration complete');
  process.exit(0);
}).catch((err) => {
  console.error("Migration error: " + err);
  process.exit(1);
});


