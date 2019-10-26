'use strict';

let worker = require("worker");

let roleScavenger = {
  run: function (creep) {
    // creep.say("scavenge");

    if (_.sum(creep.carry) >= creep.carryCapacity) {
      creep.mem.role = "builder";
      return OK;
    }

    if (creep.mem.assignment === undefined) {
      creep.mem.role = "harvester";
      return OK;
    }

    let target = Game.getObjectById(creep.mem.assignment);
    if (target === null) {
      creep.mem.assignment = undefined;
      creep.mem.role = "harvester";
      return OK;
    }

    if (target.resourceType !== undefined) {
      // creep.say("resource");
      this.pickup(creep, target, target.resourceType);
    }
    else {
      // creep.say("tombstone");
      for (let resourceType in target.store) {
        this.withdraw(creep, target, resourceType);
      }
    }

    return OK;
  },

  pickup: function (creep, target, resourceType) {
    switch (creep.pickup(target, resourceType)) {
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
      case ERR_NOT_OWNER:
      case ERR_BUSY:
      case ERR_NOT_ENOUGH_RESOURCES:
      case ERR_INVALID_TARGET:
      case ERR_FULL:
      case ERR_INVALID_ARGS:
      default:
        creep.mem.assignment = undefined;
        break;
    }

    if (creep.mem.assignment === undefined) {
      if (_.sum(creep.carry) > 0) {
        creep.mem.role = "replenisher";
      }
      else {
        creep.mem.role = "harvester";
      }
    }

    return OK;
  },

  withdraw: function (creep, target, resourceType) {
    switch (creep.withdraw(target, resourceType)) {
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
      case ERR_NOT_OWNER:
      case ERR_BUSY:
      case ERR_NOT_ENOUGH_RESOURCES:
      case ERR_INVALID_TARGET:
      case ERR_FULL:
      case ERR_INVALID_ARGS:
      default:
        creep.mem.assignment = undefined;
        break;
    }

    if (creep.mem.assignment === undefined) {
      if (_.sum(creep.carry) > 0) {
        creep.mem.role = "replenisher";
      }
      else {
        creep.mem.role = "harvester";
      }
    }

    return OK;
  }
}

module.exports = roleScavenger;
