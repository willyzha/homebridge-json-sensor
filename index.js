var Service, Characteristic;

var sys = require('sys')
var exec = require('child_process').exec;
var request = require("request")

module.exports = function(homebridge) {
  console.log("homebridge API version: " + homebridge.version);

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
 
  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerAccessory("homebridge-json-sensor", "JSONSensor", JSONSensorAccessory);
}

function JSONSensorAccessory(log, config) {
  this.log = log;

  this.name = config["name"];
  this.regex = config["regex"];
  this.updateInterval = config["update_interval"];
  this.max_sensor_value = config["max_sensor_value"];
  this.min_sensor_value = config["min_sensor_value"];
  this.lux = 0
}

function getLuxCallback(luxVal) {
  console.log(luxVal);
}

//function puts(error, stdout, stderr) { sys.puts(stdout) }

JSONSensorAccessory.prototype = {
  
  jsonRequest: function(url, callback) {
      request({
          url: url,
          json: true
      }, function (error, response, body) {
          callback(error, response, body)
      })    
  },

  getLux: function (callback) {
    var url = "http://192.168.0.94:8080/sensors.json?sense=light"
    console.log ("getting CurrentLux");
    
    this.jsonRequest(url, function(error, response, body) {
        if (error) {
            console.log ('HTTP function failed: %s', error);
            callback(error);
        } else {
            console.log ('HTTP function succeeded - %s', body.light.data[body.light.data.length - 1][1][0]);
            callback(null, body.light.data[body.light.data.length - 1][1][0]);
        }
    })
  },
  
  updateState: function () {

    var self = this
  
    this.getLux(function (err, lux) {
        self.lightService.getCharacteristic(Characteristic.CurrentAmbientLightLevel).setValue(lux)
    });
  
  },

  getServices: function() {

    // you can OPTIONALLY create an information service if you wish to override
    // the default values for things like serial number, model, etc.
    this.informationService = new Service.AccessoryInformation();

    this.informationService
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, "Homebridge")
      .setCharacteristic(Characteristic.Model, "Network Sensor")
      .setCharacteristic(Characteristic.SerialNumber, "WZ-18");
    
    this.lightService = new Service.LightSensor();
    this.lightService.getCharacteristic(Characteristic.StatusActive).setValue(true);
    
    //this.lightService.getCharacteristic(Characteristic.CurrentAmbientLightLevel)        .on('get', this.getLux.bind(this));
    
    if (this.updateInterval > 0) {
      this.timer = setInterval(this.updateState.bind(this), this.updateInterval);
    }
    
    return [this.informationService, this.lightService];
  }
};
