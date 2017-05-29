'use strict';
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const controller = require('./controller.js');
const connectingPort = process.env.MONGODB_URI || 'mongodb://localhost/test';
const rp = require('request-promise');

//set up middleware
app.set('port', (process.env.PORT || 3000));
app.use(bodyParser.json());

//allow access to all (allowing heorku server access)
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

//connect to mongoose
mongoose.connection.on('open', ()=>{
  console.log('mongoose opened');
});
mongoose.connection.on('disconnected', ()=>{
  console.log('mongoose disconnected');
});
mongoose.connect(connectingPort, (err)=>{
  if (err) {
    console.log('error connecting', err);
  }
});


/*********************************************************************************
get tracking information, save to database, return page
*********************************************************************************/
app.get('/bookings/:hash', (req, res)=>{
  controller.Track.find({'BLNumber': req.params.hash})
  .then((foundBills)=>{
    // if in database, send it back
    if(foundBills.length > 0) {
      res.status(201).json(foundBills[0]);
    } else {
      // otherwise fetch from website
      getBill(req.params.hash, (err, details)=>{
        if (err != null) {
          console.log('err getting data', err);
          res.status(404).json(err);
        } else {
          //when no err, save to database and return
          const newTrack = controller.Track(details);
          newTrack.save()
          .then((savedData)=>{
            console.log('saved data', savedData);
            res.status(201).json(savedData);
          })
          .catch((err) => {
            console.log('error saving', err);
            res.status(404).json(err);
          });
        }
      });
    }
  })
  .catch((err)=>{
    console.log('err checking db', err);
    res.status(404).json(err);
  });
});


/*********************************************************************************
serve static files
*********************************************************************************/
var path = require('path');
app.use(express.static(path.join(__dirname, 'src/client')));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/dist/index.html');
});


/*********************************************************************************
listen on port
*********************************************************************************/
app.listen(app.get('port'), ()=>{
  console.log('listening on port', app.get('port'));
});

/*********************************************************************************
parse results
form of data:
//{
//   'BLNumber': 'TXG790195200',
//   'SteamshipLine': 'PIL',
//   'Origin': 'Xingang',
//   'Destination': 'Oakland',
//   'Vessel': 'CSCL AUTUMN',
//   'Voyage': 'VQC60007E',
//   'VesselETA': Date.now(),
//   'ListOfContainers': [{'Number': 'SEGU1712879', 'Size': 20, 'Type': 'GP'}],
// };
*********************************************************************************/

// get port information
// if want acronyms, uncomment slices belows
const parsePort = (info) => {
  let $ = cheerio.load(info);
  const b = $('b');

  // port
  const port = b.first().text().split('[');
  const portName = port[0];
  // const portAcronym = port[1].slice(0, -1);

  // destination 
  const dest = b.next().next().text().split('[');
  const destName = dest[0];
  // const destAndContainer = dest[1].split(']');
  // const destAcronym = destAndContainer[0];

  // OriginAcronym: portAcronym,
  // DestinationAcronym: destAcronym,
  return {
    Origin: portName,
    Destination: destName,
  };
};

// get voyage and container information
const parseVoyage = (table, details) => {
  let $ = cheerio.load(table);
  // vessel and voyage info
  const vesselVoyage = $('.vessel-voyage').first().text();
  const voyageInfo = vesselVoyage.match(/[A-Z]{3}[0-9]{3}\d*[A-Z]*/);
  details['Voyage'] = voyageInfo[0];
  details['Vessel'] = vesselVoyage.slice(0, voyageInfo.index);

  // TODO: finish parsing and use a for loop to get more than 1 container
  let allContainers = [];
  const numb = $('.container-num').last().text().split(' ')[0];
  const containerDetails = $('.container-num').next().text();
  const sizeLocation = containerDetails.match(/[0-9]+/);
  const size = sizeLocation[0];
  const type = containerDetails.slice(containerDetails.length - 2, containerDetails.length);
  allContainers.push({Number: numb, Size: size, Type: type});

  const arrivalDelivery = $('.arrival-delivery').text().match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g);
  // TODO: fix javascript date parsing so that it gets correct date
  const date = new Date(arrivalDelivery[0]);
  details['VesselETA'] = date;
  details['ListOfContainers'] = allContainers;
  return details;
};

// split content for parsing
const htmlParser = (body) => {
  if (body.indexOf('data') == -1){
    return null;
  }
  const cleaned = body.replace(/\\/g, '');
  const html = cleaned.split('"scheduletable":"')[1].split(',"scheduleinfo":"');
  const table = html[0];
  const info  = html[1].slice(0, -3);
  let details = parsePort(info);
  details = parseVoyage(table, details);
  return details;
};

const getBill = (trackID, cb)=>{
  const getOptions = {
    uri: 'https://www.pilship.com/shared/ajax/?fn=get_tracktrace_bl&ref_num=' + trackID,
    method: 'GET',
    json: true,
    headers: {
      'Content-Type': 'application/json'
    },
  };

  rp(getOptions)
  .then((body)=>{
    let details = htmlParser(body);
    if (details == null) {
      cb('no track exists', null);
    } else {   
      details['BLNumber'] = trackID;
      details['SteamshipLine'] = 'PIL';
      cb(null, details);
    }
  })
  .catch((err)=>{
    cb(err, null);
  });
};

// to test get request locally
// getBill('TXG790195200', ()=>console.log('hello world'));