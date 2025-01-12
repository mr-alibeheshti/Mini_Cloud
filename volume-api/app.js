const express = require('express');
const app = express();

app.use(express.json());

app.use("/api/v1/volume", require("./routes/volume"));
app.all("*", (req, res, next) => {
    res.status(404).send("not Found");
  });
  
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
  });
  
  module.exports = app;