'use strict';

let worker = require("worker");

let roleRanger = {
  run: function (creep) {
    // creep.say("ranger");

    let destination = creep.mem.destination;
    if (destination === undefined) {
      let pos = this.findRoadAtEdge(creep.room);
      if (pos !== undefined) {
        destination = creep.mem.destination = {x: pos.x, y: pos.y, roomName: pos.roomName};
      }
    }

    if (destination === undefined) {
      return OK;
    }

    if (creep.room.name != destination.roomName) {
      // we're already in the other room

      // first, if we're not on a road, drop a construction site
      // let sites = creep.pos.lookFor(LOOK_STRUCTURES);
      // if (!sites.length || _.all(sites, (s) => (s.structureType != STRUCTURE_ROAD))) {
      //   creep.pos.createConstructionSite(STRUCTURE_ROAD);
      // }
      if (creep.room.controller.my) {
        let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
        });
        if (container !== null) {
          if (creep.pos.isNearTo(container)) {
            creep.mem.role = "harvester";
            return OK;
          }
          else {
            creep.moveTo(container);
            return OK;
          }
        }

        let source = creep.pos.findClosestByRange(FIND_SOURCES);
        if (source !== null) {
          if (creep.pos.isNearTo(source)) {
            creep.mem.role = "harvester";
            return OK;
          }
          else {
            creep.moveTo(source);
            return OK;
          }
        }

        creep.mem.role = "builder";
        return OK;
      }

      let controller = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTROLLER) && !s.my
      });
      if (controller !== null) {
        if (creep.pos.isNearTo(controller)) {
          creep.claimController(controller);
          creep.mem.role = "harvester";
          return OK;
        }

        creep.moveTo(controller);
        return OK;
      }

      return OK;
    }

    let destPos = new RoomPosition(destination.x, destination.y, destination.roomName);
    if (creep.pos.isEqualTo(destPos)) {
      exits = destPos.findInRange(FIND_EXIT, 1, {
        filter: (p) => (p.x == destPos.x) || (p.y == destPos.y)
      });
      if (exits.length) {
        creep.moveTo(exits[0]);
        return OK;
      }
      else {
        creep.mem.role = "harvester";
        delete creep.mem.destination;
        return OK;
      }
    }

    creep.moveTo(destPos);
    return OK;
  },

  findRoadAtEdge: function (room) {
    // search the top
    for (let x = 1; x <= 48; x++) {
      const found = room.lookForAt(LOOK_STRUCTURES, x, 1);
      if (found.length && _.any(found, (s) => (s.structureType == STRUCTURE_ROAD))) {
        return new RoomPosition(x, 1, room.name);
      }
    }

    // search the left
    for (let y = 1; y <= 48; y++) {
      const found = room.lookForAt(LOOK_STRUCTURES, 1, y);
      if (found.length && _.any(found, (s) => (s.structureType == STRUCTURE_ROAD))) {
        return new RoomPosition(1, y, room.name);
      }
    }

    // search the bottom
    for (let x = 1; x <= 48; x++) {
      const found = room.lookForAt(LOOK_STRUCTURES, x, 48);
      if (found.length && _.any(found, (s) => (s.structureType == STRUCTURE_ROAD))) {
        return new RoomPosition(x, 48, room.name);
      }
    }

    // search the right
    for (let y = 1; y <= 48; y++) {
      const found = room.lookForAt(LOOK_STRUCTURES, 48, y);
      if (found.length && _.any(found, (s) => (s.structureType == STRUCTURE_ROAD))) {
        return new RoomPosition(48, y, room.name);
      }
    }

    return undefined;
  }
}

module.exports = roleRanger;
