'use strict';

const worker = require("worker");

let logger = {
  logCPU: function() {
    if (Memory.enableLogging.cpu) {
      let cpu = Game.cpu;
      console.log(`CPU: used=${cpu.getUsed()} limit=${cpu.limit} tickLimit=${cpu.tickLimit}  bucket=${cpu.bucket}`);
    }
  },

  logCreeps: function() {
    if (Memory.enableLogging.creeps) {
      console.log(`Creeps: active=${worker.activeCount()} spawning=${worker.spawningCount()} dead=${worker.deadCount()}`);
    }
  },

  logAllRooms: function() {
    for (let name in Game.rooms) {
      let room = Game.rooms[name];
      this.logRoom(room);
    }
  },

  logRoom: function(room) {
    console.log(`room ${room.name}: energy=${room.energyAvailable} creeps=${room.find(FIND_MY_CREEPS).length}`);
  }
}

module.exports = logger;
