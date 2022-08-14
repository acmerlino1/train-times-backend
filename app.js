const express = require("express");
const request = require("request");
const parseString = require("xml2js").parseString;
const serverless = require("serverless-http");
const router = express.Router();
const app = express();

router.get("/stations", (req, res) => {
  try {
    request(
      "http://api.irishrail.ie/realtime/realtime.asmx/getAllStationsXML",
      (error, response, body) => {
        const xml = body;
        parseString(xml, function (err, result) {
          const arrayOfStations = result.ArrayOfObjStation;
          const formatStations = arrayOfStations.objStation.map((station) => {
            return {
              stationAlias: station.StationAlias[0],
              stationCode: station.StationCode[0],
              stationDesc: station.StationDesc[0],
              stationId: station.StationId[0],
            };
          });

          res.set("Access-Control-Allow-Origin", "http://localhost:3000");
          res.send({ stations: formatStations });
        });
      }
    );
  } catch (err) {
    res.send(new Error("there was an error", err));
    res.sendStatus(500);
  }
});
router.get("/stations/:code", (req, res) => {
  try {
    const stationCode = req.params.code;
    console.log({ stationCode });

    request(
      `http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByCodeXML?StationCode=${stationCode}`,
      (error, response, body) => {
        parseString(body, (err, result) => {
          const data = result.ArrayOfObjStationData;
          const nextTwoTrainsToArrive = data.objStationData;
          const arrayOfTrainsAtStation = nextTwoTrainsToArrive?.map(
            (trainData) => {
              return {
                servertime: trainData.Servertime[0],
                traincode: trainData.Traincode[0],
                stationfullname: trainData.Stationfullname[0],
                stationcode: trainData.Stationcode[0],
                querytime: trainData.Querytime[0],
                traindate: trainData.Traindate[0],
                origin: trainData.Origin[0],
                destination: trainData.Destination[0],
                origintime: trainData.Origintime[0],
                destinationtime: trainData.Destinationtime[0],
                status: trainData.Status[0],
                lastlocation: trainData.Lastlocation[0],
                duein: trainData.Duein[0],
                direction: trainData.Direction[0],
                traintype: trainData.Traintype[0],
              };
            }
          );

          const sortByArrivalTime = arrayOfTrainsAtStation?.sort((a, b) => {
            if (a.duein > b.duein) {
              return 1;
            } else if (a.duein < b.duein) {
              return -1;
            }
            return 0;
          });

          res.set("Access-Control-Allow-Origin", "http://localhost:3000");
          res.send(sortByArrivalTime?.slice(0, 2));
        });
      }
    );
  } catch (err) {
    res.send(
      new Error("there was an error fetching station data by code", err)
    );
    res.sendStatus(500);
  }
});

// app.listen(8080, () => {
//   console.log("listening on port 8080");
// });

app.use("/", router);
module.exports.handler = serverless(app);
