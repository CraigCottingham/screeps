var logger = require("logger");
var roleBuilder = require("role.builder");
var roleHarvester = require("role.harvester");
var roleRepairer = require("role.repairer");
var roleReplenisher = require("role.replenisher");
var roleScavenger = require("role.scavenger");
var roleUpgrader = require("role.upgrader");
var tower = require("tower");
var worker = require("worker");

module.exports.loop = function () {
  logger.logCreeps();

  //
  // initialize memory structures
  //

  Memory.defenses = {
    walls:    (300000000 * 0.003),
    ramparts:  (10000000 * 0.100)
  };

  //
  // clean up memory structures
  //

  //
  // run objects
  //

  // run towers

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

    var towers = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_TOWER)
    });
    _.forEach(towers, (t) => tower.run(t));

    var drops = room.find(FIND_DROPPED_RESOURCES);
    for (var drop of drops) {
      var amount = drop.amount;
      if (amount > 0) {
        var creep = drop.pos.findClosestByPath(FIND_MY_CREEPS, {
          filter: (c) => (_.sum(c.carry) < c.carryCapacity)
        });
        if (creep !== null) {
          creep.memory.assignment = drop.id;
          creep.memory.role = "scavenger";
        }
      }
    }

    var tombstones = room.find(FIND_TOMBSTONES);
    for (var tombstone of tombstones) {
      var amount = _.sum(tombstone.store);
      // var amount = tombstone.store[RESOURCE_ENERGY];
      if (amount > 0) {
        var creep = tombstone.pos.findClosestByPath(FIND_MY_CREEPS, {
          filter: (c) => (_.sum(c.carry) < c.carryCapacity)
        });
        if (creep !== null) {
          creep.memory.assignment = tombstone.id;
          creep.memory.role = "scavenger";
        }
      }
    }
  }

  // TODO: dynamic dispatch, rather than role transitions hardcoded in roles
  for (var name in Game.creeps) {
    var creep = Game.creeps[name];

    if (creep.memory.role === undefined) {
      creep.memory.role = "upgrader";
    }

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
      case "upgrader":
        roleUpgrader.run(creep);
        break;
    }
  }

  var spawn = Game.spawns["Spawn1"];

  containers = spawn.room.find(FIND_STRUCTURES, {
    filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
  });

  // TODO: sum up all the things that need doing:
  //   * number of extensions
  //   * number of towers x 2
  //   * +1 for controller
  //   * +1 for spawn?
  //   * number of construction sites? (or maybe a fraction thereof)
  // that's the number of workers we should have
  // maybe a few extras, but probably not many if any
  // the makeup of new workers should be a function of
  //   * energy and/or energy capacity in the room
  //   * the current number (if very small, for instance -- see endangered flag)

  var parts = [WORK, CARRY, MOVE];
  if (worker.totalCount() > 20) {
    parts = [WORK, CARRY, WORK, CARRY, MOVE, MOVE];
  }
  if (worker.totalCount() > 30) {
    parts = [ATTACK, WORK, CARRY, WORK, CARRY, MOVE, MOVE]
  }

  worker.spawn(spawn, parts);

  if (worker.totalCount() < 10) {
    Memory.endangered = true;
    for (var name in Game.creeps) {
      var creep = Game.creeps[name];
      if ((creep.memory.role != "harvester") && (creep.memory.role != "replenisher") && (creep.memory.role != "staticHarvester")) {
        creep.memory.role = "replenisher";
      }
    }
  }
  else {
    Memory.endangered = undefined;
  }

  //
  // clean up creep memory
  //

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }

  logger.logCPU();
}
