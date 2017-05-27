'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const controller = require('./controller.js');
const connectingPort = process.env.MONGODB_URI || 'mongodb://localhost/test';
// const rp = require('request-promise');

//set up express middleware
app.set('port', (process.env.PORT || 3000));
app.use(bodyParser.json());

const data = {
  'Origin': 'Xingang',
  'Destination': 'Oakland',
  'Vessel': 'CSCL AUTUMN',
  'Voyage': 'VQC60007E',
  'VesselETA': Date.now(),
  'ListOfContainers': [{'Number': 'SEGU1712879', 'Size': 20, 'Type': 'GP'}],
};

//connect to mongoose
mongoose.connection.on('open', ()=> {
  console.log('mongoose opened');
});
mongoose.connection.on('disconnected', ()=> {
  console.log('mongoose disconnected');
});
mongoose.connect(connectingPort, (err)=> {
  if (err) {
    console.log('error connecting', err);
  }
});


/*********************************************************************************
get tracking information, save to database, return page
*********************************************************************************/
app.get('/bookings/:hash', (req, res)=>{
  console.log('hash', req.params.hash);
  const newTrack = controller.Track(data);
  newTrack.save()
  .then((savedData)=>{
    console.log('saved', savedData);
    res.status(201).json(savedData);
  })
  .catch((err) => {
    console.log('error', err);
    res.status(404).json(err);
  });
});


/*********************************************************************************
listen
*********************************************************************************/
app.listen(app.get('port'), ()=> {
  console.log('listening on port', app.get('port'));
});




const getBill = function(pubUrl, cb) {
  const getOptions = {
    uri: 'https://www.pilship.com/shared/ajax/?fn=get_tracktrace_bl&ref_num=TXG790195200',
    method: 'GET',
    json: true,
    headers: {
      'Content-Type': 'application/json'
    },
  };

  request(getOptions, (err, resp)=> {
    const body = resp['body'];
    console.log('body', body);
    console.log('type', typeof(body));
    // const data = body['data'];
    // console.log('data', data);
    // const parsed = JSON.parse(body);
    // console.log('parsed', parsed);
  });
};

// getBill();