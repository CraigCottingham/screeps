const worker = require("worker");

var logger = {
  logCPU: function() {
    if (Memory.enableLogging.cpu) {
      var cpu = Game.cpu;
      console.log(`CPU: used=${cpu.getUsed()} limit=${cpu.limit} tickLimit=${cpu.tickLimit}  bucket=${cpu.bucket}`);
    }
  },

  logCreeps: function() {
    if (Memory.enableLogging.creeps) {
      console.log(`Creeps: active=${worker.activeCount()} spawning=${worker.spawningCount()} dead=${worker.deadCount()}`);
    }
  },

  logAllRooms: function() {
    for (var name in Game.rooms) {
      var room = Game.rooms[name];
      this.logRoom(room);
    }
  },

  logRoom: function(room) {
    console.log(`room ${room.name}: energy=${room.energyAvailable} creeps=${room.find(FIND_MY_CREEPS).length}`);
  }
}

module.exports = logger;
