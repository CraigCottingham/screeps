const worker = require('worker');

var logger = {
  logCPU: function() {
    var cpu = Game.cpu;
    console.log(`CPU  limit: ${cpu.limit}  tickLimit: ${cpu.tickLimit}  bucket: ${cpu.bucket}`);
  },

  logCreeps: function() {
    console.log(`Creeps: active=${worker.activeCount()} spawning=${worker.spawningCount()} dead=${worker.deadCount()}`);
  },

  logAllRooms: function() {
    for (var name in Game.rooms) {
      var room = Game.rooms[name];
      this.logRoom(room);
    }
  },

  logRoom: function(room) {
    var str = 'room ' + room.name + ': energy = ' + room.energyAvailable;

    if (room.controller.safeMode === undefined) {
      if (room.controller.safeModeCooldown === undefined) {
        str = str + '; activating safe mode';
        room.controller.activateSafeMode();
      }
      else {
        str = str + '; safe mode cooldown remaining = ' + room.controller.safeModeCooldown;
      }
    }
    else {
      str = str + '; safe mode remaining = ' + room.controller.safeMode;
    }

    console.log(str);
  },

  logUsedCPU: function() {
    console.log(`CPU used: ${Game.cpu.getUsed()}`)
  }
}

module.exports = logger;
