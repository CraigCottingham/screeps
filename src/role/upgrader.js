var worker = require("worker");

var roleUpgrader = {
  run: function(creep) {
    // creep.say("upgrade");

    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    var target = creep.room.controller;
    if (target === undefined) {
      creep.memory.role = "replenisher";
    }
    else {
      // if we're not on a road, drop a construction site
      // let sites = creep.pos.lookFor(LOOK_STRUCTURES);
      // if (!sites.length || _.all(sites, (s) => (s.structureType != STRUCTURE_ROAD))) {
      //   creep.pos.createConstructionSite(STRUCTURE_ROAD);
      // }

      // this.sign(creep, creep.room.controller);
      this.upgrade(creep, creep.room.controller);
    }

    return OK;
  },

  sign: function(creep, controller) {
    switch (creep.signController(controller, "CraigCottingham - github.com/CraigCottingham/screeps")) {
      case ERR_INVALID_TARGET:
        creep.memory.role = "replenisher";
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, controller);
        break;
      default:
        break;
    }
  },

  upgrade: function (creep, controller) {
    switch (creep.upgradeController(controller)) {
      case ERR_NOT_OWNER:
        break;
      case ERR_BUSY:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.role = "harvester";
        break;
      case ERR_INVALID_TARGET:
        creep.memory.role = "harvester";
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, controller);
        break;
      case ERR_NO_BODYPART:
        creep.suicide();
        break;
      default:
        break;
    }
  }
}

module.exports = roleUpgrader;
