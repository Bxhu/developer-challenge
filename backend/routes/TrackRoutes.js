const express = require('express');
const request = require('request-promise-native');
const multer = require('multer');
const upload = multer();
const {URL} = require('url');
const archiver = require('archiver');
const Swagger = require('swagger-client');
const app = express();

const Track = require('../models/TrackModel');

const {
  KALEIDO_REST_GATEWAY_URL,
  IPFS_REST_GATEWAY_URL,
  KALEIDO_AUTH_USERNAME,
  KALEIDO_AUTH_PASSWORD,
  CONTRACT_MAIN_SOURCE_FILE,
  CONTRACT_CLASS_NAME,
  FROM_ADDRESS
} = require('../config');

app.get('/tracks', async (req, res) => {
  const tracks = await Track.find({});

  let data = [];

  for (let i=0; i < tracks.length; i++) {
    const track = tracks[i];

    swaggerClient = await Swagger(track.endpoint, {
      requestInterceptor: req => {
        req.headers.authorization = `Basic ${Buffer.from(`${KALEIDO_AUTH_USERNAME}:${KALEIDO_AUTH_PASSWORD}`).toString("base64")}`;
      }
    });

    try {
      let postRes = await swaggerClient.apis.default.getHash_get({
        address: track.contract,
        "kld-from": FROM_ADDRESS,
        "kld-sync": "true"
      });

      const ipfsURL = new URL(IPFS_REST_GATEWAY_URL);
      ipfsURL.username = KALEIDO_AUTH_USERNAME;
      ipfsURL.password = KALEIDO_AUTH_PASSWORD;
      ipfsURL.pathname = `/api/v0/cat/${postRes.body.ipfsHash}`;

      let response = await request.get({
        url: ipfsURL.href
      })

      data.push({
        metaData: {
          name: track.name,
          id: track._id
        },
        file: response
      })
    } catch(err) {
      res.status(500).send({error: `${err.response && err.response.body && err.response.text}\n${err.stack}`});
    }
  }

  try {
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/track', async (req, res) => {
  const track = await Track.findById(req.body.id);

  swaggerClient = await Swagger(track.endpoint, {
    requestInterceptor: req => {
      req.headers.authorization = `Basic ${Buffer.from(`${KALEIDO_AUTH_USERNAME}:${KALEIDO_AUTH_PASSWORD}`).toString("base64")}`;
    }
  });

  try {
    let postRes = await swaggerClient.apis.default.getHash_get({
      address: track.contract,
      "kld-from": FROM_ADDRESS,
      "kld-sync": "true"
    });

    const ipfsURL = new URL(IPFS_REST_GATEWAY_URL);
    ipfsURL.username = KALEIDO_AUTH_USERNAME;
    ipfsURL.password = KALEIDO_AUTH_PASSWORD;
    ipfsURL.pathname = `/api/v0/cat/${postRes.body.ipfsHash}`;

    let response = await request.get({
      url: ipfsURL.href
    })

    res.status(200).send(response);
  }
  catch(err) {
    res.status(500).send({error: `${err.response && err.response.body && err.response.text}\n${err.stack}`});
  }
});

app.post('/track', upload.single('file'), async (req, res) => {
  const ipfsURL = new URL(IPFS_REST_GATEWAY_URL);
  ipfsURL.username = KALEIDO_AUTH_USERNAME;
  ipfsURL.password = KALEIDO_AUTH_PASSWORD;
  ipfsURL.pathname = "/api/v0/add";

  console.log(req.file);

  const formData = {
    file: req.file.buffer
  }

  let response = await request.post({
    url: ipfsURL.href,
    json: true,
    headers: {
      'content-type': 'multipart/form-data',
    },
    formData
  });

  const ipfsHash = response.Hash;

  const nodeURL = new URL(KALEIDO_REST_GATEWAY_URL);
  nodeURL.username = KALEIDO_AUTH_USERNAME;
  nodeURL.password = KALEIDO_AUTH_PASSWORD;
  nodeURL.pathname = "/abis";
  var archive = archiver('zip');  
  archive.directory("contracts", "");
  await archive.finalize();
  response = await request.post({
    url: nodeURL.href,
    qs: {
      compiler: "0.5", // Compiler version
      source: CONTRACT_MAIN_SOURCE_FILE, // Name of the file in the directory
      contract: `${CONTRACT_MAIN_SOURCE_FILE}:${CONTRACT_CLASS_NAME}` // Name of the contract in the 
    },
    json: true,
    headers: {
      'content-type': 'multipart/form-data',
    },
    formData: {
      file: {
        value: archive,
        options: {
          filename: 'smartcontract.zip',
          contentType: 'application/zip',
          knownLength: archive.pointer()
        }
      }
    }
  });

  nodeURL.pathname = response.path;
  nodeURL.search = '?ui';
  // console.log(`Generated REST API: ${nodeURL}`);
  
  swaggerClient = await Swagger(response.openapi, {
    requestInterceptor: req => {
      req.headers.authorization = `Basic ${Buffer.from(`${KALEIDO_AUTH_USERNAME}:${KALEIDO_AUTH_PASSWORD}`).toString("base64")}`;
    }
  });

  try {
    let postRes = await swaggerClient.apis.default.constructor_post({
      body: {
        ipfsHash
      },
      "kld-from": FROM_ADDRESS,
      "kld-sync": "true"
    });

    const track = new Track({
      name: req.body.name,
      endpoint: response.openapi,
      contract: postRes.body.contractAddress
    });
    track.save();
    console.log('track successfully uploaded');
    res.status(200).send(postRes.body)
  }
  catch(err) {
    res.status(500).send({error: `${err.response && err.response.body}\n${err.stack}`});
  }
});

module.exports = app