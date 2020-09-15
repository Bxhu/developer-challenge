const request = require('request-promise-native')
const express = require('express');
const app = express();
const archiver = require('archiver');
const Swagger = require('swagger-client');
const {URL} = require('url');
const bodyparser = require('body-parser');

const mongoose = require('mongoose');

const {
  PORT,
  MONGO_PASSWORD,
  MONGO_DBNAME
} = require('./config');

const mongoURI = `mongodb+srv://general:${MONGO_PASSWORD}@cluster0.m5gpv.mongodb.net/${MONGO_DBNAME}?retryWrites=true&w=majority`;

const trackRouter = require('./routes/TrackRoutes.js');
const userRouter = require('./routes/UserRoutes');

let swaggerClient;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(trackRouter);
app.use(userRouter);

async function init() {
  app.listen(PORT, () => console.log(`Kaleido DApp backend listening on port ${PORT}!`))
}

init().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
  

module.exports = {
  app
};
