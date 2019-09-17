var logger = require("logger");
var tower = require("tower");
var worker = require("worker");
var roleBuilder = require("role.builder");
var roleHarvester = require("role.harvester");
var roleRepairer = require("role.repairer");
var roleReplenisher = require("role.replenisher");
var roleUpgrader = require("role.upgrader");

module.exports.loop = function () {
  logger.logCreeps();

  for (var name in Game.structures) {
    var structure = Game.structures[name];
    if (structure.structureType == STRUCTURE_TOWER) {
      tower.run(structure);
    }
  }

  // order creeps by role, then run them by priority?
  for (var name in Game.creeps) {
    var creep = Game.creeps[name];
    switch (creep.memory.role) {
      case "builder":
        roleBuilder.run(creep);
        break;
      case "harvester":
        roleHarvester.run(creep);
        break;
      case "repairer":
        roleRepairer.run(creep);
        break;
      case "replenisher":
        roleReplenisher.run(creep);
        break;
      case "upgrader":
        roleUpgrader.run(creep);
        break;
    }
  }

  var parts = [WORK, CARRY, MOVE];
  if (worker.totalCount() > 20) {
    parts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
  }

  for (var name in Game.spawns) {
    worker.spawn(Game.spawns[name], parts);
  }

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }

  logger.logCPU();
}
