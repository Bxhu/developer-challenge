const express = require('express');
const userModel = require('../models/UserModel');
const app = express();

app.get('/users', async (req, res) => {
  const users = await userModel.find({});

  try {
    res.send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/user', async (req, res) => {
  console.log(req.body);
  const users = await userModel.findById(req.body.id);

  try {
    res.send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/user', async (req, res) => {
  const user = new userModel(req.body);

  try {
    await user.save();
    res.send(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = app