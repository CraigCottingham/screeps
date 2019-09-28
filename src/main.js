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
  // logger.logCreeps();
  logger.logAllRooms();

  //
  // initialize memory structures
  //

  Memory.defenses = {
    walls:    1000000,  // 300000000 * 0.003 ; increase by 1000?
    ramparts:  100000,  //  10000000 * 0.010 ; increase by 1000?
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

    var creepCount = room.find(FIND_MY_CREEPS).length;
    var containerCount = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
    }).length;

      var drops = room.find(FIND_DROPPED_RESOURCES);
      for (var drop of drops) {
        var amount = drop.amount;
        if (amount > 0) {
          var creep = drop.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (c) => (_.sum(c.carry) < c.carryCapacity)
          });
          if (creep !== null) {
            // console.log(`dropped resource ${drop.id} assigned to creep ${creep.id}`);
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

    if (creepCount > (containerCount * 2)) {
      if (room.find(FIND_MY_CREEPS, {
        filter: (c) => (c.memory.role == "upgrader")
      }).length == 0) {
        creep = room.controller.pos.findClosestByRange(FIND_MY_CREEPS, {
          filter: (c) => (c.memory.role != "harvester") && (c.carry.energy > 0)
        })
        if (creep !== null) {
          creep.memory.role = "upgrader";
        }
      }
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

    var spawn = _.first(room.find(FIND_MY_SPAWNS))
    if (spawn !== undefined) {
      if (room.find(FIND_MY_CREEPS).length < 20) {
        var parts = [WORK, MOVE, CARRY, MOVE];
        var availableEnergy = room.energyAvailable;

        // if hostiles and availableEnergy > 200
        //   parts = [WORK, CARRY, MOVE]
        if (availableEnergy > 750) {  // 500 + minimum creep build cost
          parts = [WORK, MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE];
        }
        if (availableEnergy > 880) {  // 630 + minimum creep build cost
          parts = [ATTACK, MOVE, WORK, MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE];
        }
        if (availableEnergy > 950) {  // 700 + minimum creep build cost
          parts = [RANGED_ATTACK, MOVE, WORK, MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE];
        }
        if (availableEnergy > 2570) {  // 2320 + minimum  -- NPC melee, RCL >= 4
          parts = [
            TOUGH,  MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,  MOVE,
            TOUGH,  MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,  MOVE,
            TOUGH,  MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,  MOVE,
            TOUGH,  MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, ATTACK, MOVE,
            ATTACK, MOVE, WORK,          MOVE, CARRY,         MOVE, WORK,          MOVE, CARRY,  MOVE
          ];
        }
        if (availableEnergy > 4360) {  // 4110 + minimum  -- NPC ranged, RCL >= 4
          parts = [
            TOUGH,         TOUGH,         TOUGH,         TOUGH,         TOUGH,         TOUGH,         MOVE,          MOVE,          MOVE,          MOVE,
            MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,
            MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, WORK,          MOVE
          ];
        }

        worker.spawn(spawn, parts);
      }
    }
  }

  if (worker.totalCount() < 10) {
    Memory.endangered = true;
    for (var name in Game.creeps) {
      var creep = Game.creeps[name];
      if ((creep.memory.role != "harvester") && (creep.memory.role != "replenisher")) {
        creep.memory.role = "replenisher";
      }
    }
  }
  else {
    Memory.endangered = undefined;
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
