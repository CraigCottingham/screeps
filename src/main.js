'use strict'

let level0 = require('room.level0')

// override functions:
//   extendFunction: function(obj, funcName, replacementFunc, prefix) {
//     if (!prefix) {
//       prefix = "_"
//     }
//     obj.prototype[prefix+funcName] = obj.prototype[funcName];
//     obj.prototype[funcName] = replacementFunc;
//   }
//
// also, you can add functions to existing objects (classes?) like
//   creep.prototype.foo = function (args) { ... }

module.exports.loop = function () {
  const roomsControlled = _.filter(_.values(Game.structures), (s) => s.structureType == STRUCTURE_CONTROLLER)
  const roomsAllowed = Game.gcl.level

  // if (rooms visible) > (rooms controlled)
  //   for each room visible that isn't controlled
  //    spawn a creep with CLAIM in the controlled room closest to the visible room

  //
  // run objects
  //

  for (let name in Game.rooms) {
    let room = Game.rooms[name]

    if (room.controller !== undefined && room.controller.my) {
      switch (room.controller.level) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        default:
          level0.run(room)
      }
    } else {
      console.log(`Room ${room.name} is visible but isn't controlled`)
    }
  }

  //
  // clean up memory structures
  //

  //
  // clean up creep memory
  //

  for (let name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name]
    }
  }

  //
  // clean up flag memory
  //

  for (let name in Memory.flags) {
    if (!Game.flags[name]) {
      delete Memory.flags[name]
    }
  }
}
