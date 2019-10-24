"use strict";

let worker = require("worker");

let roleBuilder = {
  run: function (creep) {
    // creep.say("build");

    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    let sites = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (!sites.length) {
      delete creep.memory.path;
      creep.memory.role = "replenisher";
      return OK;
    }

    if (!creep.memory.path) {
      let site = creep.pos.findClosestByPath(sites);
      if (site !== null) {
        this.build(creep, site);
        return OK;
      }

      let shortestPath = _.min(_.map(sites, (s) => creep.room.findPath(creep.pos, s.pos, { range: 3, serialize: true })), (p) => p.length);
      if (shortestPath == Infinity) {
        creep.memory.role = "repairer";
        return OK;
      }

      creep.memory.path = shortestPath;
    }

    // this.build(creep, site);
    switch (creep.moveByPath(creep.memory.path)) {
      case OK:
      case ERR_TIRED:
        // try creep.build(site)
        // but we need site....
        break;
      case ERR_NOT_OWNER:
      case ERR_BUSY:
      case ERR_NOT_FOUND:
      case ERR_INVALID_ARGS:
        delete creep.memory.path;
        break;
      case ERR_NO_BODYPART:
        creep.suicide();
        break;
    }

    let site = _.find(sites, (s) => creep.pos.inRangeTo(s, 3));
    if (site !== undefined) {
      this.build(creep, site);
      return OK;
    }

    return OK;
  },

  build: function (creep, site) {
    switch (creep.build(site)) {
      case OK:
        if (creep.memory.path) {
          switch (creep.moveByPath(creep.memory.path)) {
            case OK:
            case ERR_TIRED:
              break;
            case ERR_NOT_OWNER:
            case ERR_BUSY:
            case ERR_NOT_FOUND:
            case ERR_INVALID_ARGS:
              delete creep.memory.path;
              break;
            case ERR_NO_BODYPART:
              creep.suicide();
              break;
          }
        }
        else {
          worker.moveTo(creep, site);
        }
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
        if (creep.memory.path) {
          switch (creep.moveByPath(creep.memory.path)) {
            case OK:
            case ERR_TIRED:
              break;
            case ERR_NOT_OWNER:
            case ERR_BUSY:
            case ERR_NOT_FOUND:
            case ERR_INVALID_ARGS:
              delete creep.memory.path;
              break;
            case ERR_NO_BODYPART:
              creep.suicide();
              break;
          }
        }
        else {
          worker.moveTo(creep, site);
        }
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
