"use strict";

let worker = require("worker");

let roleRanger = {
  run: function (creep) {
    creep.say("ranger");

    if (!creep.mem.path) {
      if (Memory.colonize === undefined) {
        // colonize was deleted before the ranger ran the first time?
        // not much to do but bail out
        creep.suicide();
        return OK;
      }

      let destination;

      if (Game.rooms[Memory.colonize] === undefined) {
        // no visibility in destination room, so set up path to the middle of the room
        destination = new RoomPosition(25, 25, Memory.colonize);
        creep.mem.destinationRoomName = destination.roomName;
      }
      else {
        // visibility in destination room, so set up path to the controller
        destination = Game.rooms[Memory.colonize].controller.pos;
        delete creep.mem.destinationRoomName;
      }

      creep.mem.path = creep.room.findPath(creep.pos, destination);
    }

    if (creep.room.name == creep.mem.destinationRoomName) {
      creep.mem.path = creep.pos.findPathTo(creep.room.controller);
      delete creep.mem.destinationRoomName;
    }

    let structures = creep.pos.lookFor(LOOK_STRUCTURES);
    if (!structures.length || _.all(structures, (s) => (s.structureType != STRUCTURE_ROAD))) {
      switch (creep.pos.createConstructionSite(STRUCTURE_ROAD)) {
        case OK:
          break;
        case ERR_INVALID_TARGET:
          // console.log("The structure cannot be placed at the specified location.");
          break;
        case ERR_FULL:
          // console.log("You have too many construction sites.");
          break;
        case ERR_INVALID_ARGS:
          // console.log("The location is incorrect.")
          break;
        case ERR_RCL_NOT_ENOUGH:
          // console.log("Room Controller Level insufficient.");
          break;
      }
    }

    if (creep.mem.path) {
      switch (creep.moveByPath(creep.mem.path)) {
        case OK:
          break;
        case ERR_TIRED:
          console.log("tired");
          break;
        case ERR_NOT_OWNER:
          console.log("not owner");
          delete creep.mem.path;
          break;
        case ERR_BUSY:
          console.log("busy");
          delete creep.mem.path;
          break;
        case ERR_NOT_FOUND:
          console.log("not found");
          delete creep.mem.path;
          break;
        case ERR_INVALID_ARGS:
          console.log("invalid args");
          delete creep.mem.path;
          break;
        case ERR_NO_BODYPART:
          console.log("no bodypart");
          creep.suicide();
          break;
      }
      return OK;
    }
  },
}

module.exports = roleRanger;
