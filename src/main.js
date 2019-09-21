var logger = require("logger");
var tower = require("tower");
var worker = require("worker");
var roleBuilder = require("role.builder");
var roleHarvester = require("role.harvester");
var roleRepairer = require("role.repairer");
var roleReplenisher = require("role.replenisher");
var roleScavenger = require("role.scavenger");
var roleStaticHarvester = require("role.static_harvester");
var roleUpgrader = require("role.upgrader");

module.exports.loop = function () {
  logger.logCreeps();

  // initialize memory structures

  if (Memory.carrion === undefined) {
    Memory.carrion = {};
  }
  if (Memory.staticHarvesters === undefined) {
    Memory.staticHarvesters = {};
  }

  // clean up memory structures

  for (var id in Memory.carrion) {
    if (Game.getObjectById(id) === null) {
      delete Memory.carrion[id];
    }
  }
  for (var id in Memory.staticHarvesters) {
    if (Game.getObjectById(id) === null) {
      delete Memory.staticHarvesters[id];
    }
  }

  //
  // run objects
  //

  // run towers

  for (var name in Game.structures) {
    var structure = Game.structures[name];
    if (structure.structureType == STRUCTURE_TOWER) {
      tower.run(structure);
    }
  }

  // look for tombstones/free resources
  // if found and not already assigned to a worker
  //   find closest unassigned worker with available capacity
  //   if closest worker is closer than decay timeout
  //     assign worker
  //   else
  //     find closest unassigned worker with any kind of carrying capacity
  //     have it drop its carry and assign it

  for (var name in Game.rooms) {
    var room = Game.rooms[name];

    var tombstones = room.find(FIND_TOMBSTONES);
    for (var tombstone of tombstones) {
      var amount = _.sum(tombstone.store);
      if (amount > 0) {
        if (Memory.carrion[tombstone.id] === undefined) {
          Memory.carrion[tombstone.id] = {};
        }
        if (Memory.carrion[tombstone.id].creepId === undefined) {
          var closestCreep = tombstone.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (creep) => {
              return (creep.carry.energy < creep.carryCapacity);
            }
          });
          if (closestCreep !== null) {
            Memory.carrion[tombstone.id].creepId = closestCreep.id;
            closestCreep.memory.assignment = tombstone.id;
            closestCreep.memory.role = "scavenger";
          }
        }
      }
    }

    var drops = room.find(FIND_DROPPED_RESOURCES);
    for (var drop of drops) {
      var amount = drop.amount;
      if (amount > 0) {
        if (Memory.carrion[drop.id] === undefined) {
          Memory.carrion[drop.id] = {};
        }
        if (Memory.carrion[drop.id].creepId === undefined) {
          var closestCreep = drop.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (creep) => {
              return (creep.carry.energy < creep.carryCapacity);
            }
          });
          if (closestCreep !== null) {
            Memory.carrion[drop.id].creepId = closestCreep.id;
            closestCreep.memory.assignment = drop.id;
            closestCreep.memory.role = "scavenger";
          }
        }
      }
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
      case "scavenger":
        roleScavenger.run(creep);
        break;
      case "staticHarvester":
        roleStaticHarvester.run(creep);
        break;
      case "upgrader":
        roleUpgrader.run(creep);
        break;
    }
  }

  if (_.values(Memory.staticHarvesters).length < 5) { // number of containers
    for (var name in Game.spawns) {
      worker.spawn(Game.spawns[name], [WORK, CARRY, MOVE], "staticHarvester");
    }
  }
  else {
    var parts = [WORK, CARRY, MOVE];
    if (worker.totalCount() > 20) {
      parts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    }

    for (var name in Game.spawns) {
      worker.spawn(Game.spawns[name], parts);
    }
  }


  if (worker.totalCount() < 5) {
    for (var name in Game.creeps) {
      var creep = Game.creeps[name];
      if ((creep.memory.role != "harvester") && (creep.memory.role != "replenisher")) {
        creep.memory.role = "replenisher";
      }
    }
  }

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }

  logger.logCPU();
}
