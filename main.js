var logger = require('logger');
var worker = require('worker');
var roleBuilder = require('role.builder');
var roleHarvester = require('role.harvester');
var roleReplenisher = require('role.replenisher');
var roleUpgrader = require('role.upgrader');

module.exports.loop = function () {
  logger.logCreeps();

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }

  for (var name in Game.rooms) {
    var room = Game.rooms[name];
    if ((worker.activeCount() < 40) && (room.energyAvailable == room.energyCapacityAvailable)) {
      worker.spawn(Game.spawns['Spawn1']);
    }
  }

  for (var name in Game.creeps) {
    var creep = Game.creeps[name];
    switch (creep.memory.role) {
      case 'builder':
        roleBuilder.run(creep);
        break;
      case 'harvester':
        roleHarvester.run(creep);
        break;
      case 'replenisher':
        roleReplenisher.run(creep);
        break;
      case 'upgrader':
        roleUpgrader.run(creep);
        break;
    }
  }
}
