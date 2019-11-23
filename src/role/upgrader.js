"use strict";

let worker = require("worker");

let roleUpgrader = {
  run: function(creep) {
    // creep.say("upgrade");

    const room = creep.room;
    const controller = room.controller;

    if ((controller === undefined) || !controller.my || (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0)) {
      this.reset(creep);
      return OK;
    }

    if (!creep.mem.path) {
      creep.mem.path = room.findPath(creep.pos, controller.pos, {range: 1, serialize: true});
    }

    switch (creep.moveByPath(creep.mem.path)) {
      case OK:
      case ERR_NOT_FOUND:
        // this.sign(creep, controller);
        this.upgrade(creep, controller);
        break;
      case ERR_TIRED:
        // try creep.build(site)
        // but we need site....
        break;
      case ERR_NOT_OWNER:
        console.log("ERR_NOT_OWNER");
        this.reset(creep);
        break;
      case ERR_BUSY:
        console.log("ERR_BUSY");
        this.reset(creep);
        break;
      // case ERR_NOT_FOUND:
      //   console.log("ERR_NOT_FOUND");
      //   this.reset(creep);
      //   break;
      case ERR_INVALID_ARGS:
        console.log("ERR_INVALID_ARGS");
        this.reset(creep);
        break;
      case ERR_NO_BODYPART:
        creep.suicide();
        break;
    }

    return OK;
  },

  reset: function(creep) {
    delete creep.mem.path;
    creep.mem.role = "harvester";
    return OK;
  },

  sign: function(creep, controller) {
    switch (creep.signController(controller, "CraigCottingham - github.com/CraigCottingham/screeps")) {
      case OK:
        break;
      case ERR_INVALID_TARGET:
        this.reset(creep);
        break;
      case ERR_NOT_IN_RANGE:
        break;
      default:
        break;
    }
  },

  upgrade: function (creep, controller) {
    switch (creep.upgradeController(controller)) {
      case OK:
        break;
      case ERR_NOT_OWNER:
      case ERR_BUSY:
      case ERR_NOT_IN_RANGE:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
      case ERR_INVALID_TARGET:
        this.reset(creep);
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
