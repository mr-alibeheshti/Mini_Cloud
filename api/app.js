require("express-async-errors");
const express = require("express");
const app = express();

app.use(express.json());

app.use("/api/v1/container", require("./routes/container"));
app.use("/api/v1/volume", require("./routes/volume"));
<<<<<<< HEAD
app.use("/api/v1/run", require("./routes/run"));

=======
>>>>>>> bfe2b53ca8a6e45b09f897a71f187187ac4afc2f


app.all("*", (req, res, next) => {
  res.status(404).send("not Found");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = app;
