"use strict";

let worker = require("worker");

let roleBuilder = {
  run: function (creep) {
    // creep.say("build");

    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    let site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (site === null) {
      // changed from replenisher
      // hopefully, switching to repairer will enduce the creep to build up
      // a rampart or wall after building it
      creep.memory.role = "repairer";
    }
    else {
      this.build(creep, site);
    }

    return OK;
  },

  build: function (creep, site) {
    switch (creep.build(site)) {
      case OK:
        worker.moveTo(creep, site);
        break;
      case ERR_NOT_OWNER:
        creep.memory.role = "replenisher";
        break;
      case ERR_BUSY:
        creep.memory.role = "replenisher";
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.role = "harvester";
        break;
      case ERR_INVALID_TARGET:
        // don't change role
        // next time through, hopefully we'll find a different target
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, site);
        break;
      case ERR_NO_BODYPART:
        creep.suicide();
        break;
      default:
        break;
    }
  }
}

module.exports = roleBuilder;
