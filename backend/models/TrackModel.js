const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TrackSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    // required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  contract: {
    type: String,
    required: true
  }
});

const Track = mongoose.model("Track", TrackSchema);
module.exports = Track;