const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackingSchema = new Schema({
  'BLNumber': String,
  'SteamshipLine': String,
  'Origin': String,
  'Destination': String,
  'Vessel': String,
  'Voyage': String,
  'VesselETA': Date,
  'ListOfContainers': [{'Number': String, 'Size': Number, 'Type': String}],
});

exports.Track = mongoose.model('Track', trackingSchema);