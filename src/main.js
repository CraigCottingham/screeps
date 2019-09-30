var logger = require("logger");
var roleBreacher = require("role.breacher");
var roleBuilder = require("role.builder");
var roleHarvester = require("role.harvester");
var roleRepairer = require("role.repairer");
var roleReplenisher = require("role.replenisher");
var roleScavenger = require("role.scavenger");
var roleUpgrader = require("role.upgrader");
var tower = require("tower");
var worker = require("worker");

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
  // logger.logCreeps();
  logger.logAllRooms();

  //
  // initialize memory structures
  //

  if (Memory.defenseLowWater === undefined) {
    Memory.defenseLowWater = {};
  }
  if (Memory.redAlert === undefined) {
    Memory.redAlert = {};
  }

  //
  // run objects
  //

  for (var name in Game.rooms) {
    var room = Game.rooms[name];

    // fetch arrays of structures for this room

    var creeps = room.find(FIND_MY_CREEPS);
    var containers = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
    });
    var drops = room.find(FIND_DROPPED_RESOURCES);
    var extensions = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_EXTENSION)
    });
    var flags = room.find(FIND_FLAGS);
    var ramparts = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_RAMPART)
    });
    var spawns = room.find(FIND_MY_SPAWNS);
    var tombstones = room.find(FIND_TOMBSTONES);
    var towers = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_TOWER)
    });
    var walls = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_WALL)
    });

    Memory.redAlert[name] = (room.find(FIND_HOSTILE_CREEPS).length > 0);

    // set up low water thresholds for defensive structures

    if (Memory.defenseLowWater[name] === undefined) {
      Memory.defenseLowWater[name] = {};
      Memory.defenseLowWater[name][STRUCTURE_RAMPART] = RAMPART_HITS;
      Memory.defenseLowWater[name][STRUCTURE_WALL] = WALL_HITS;
    }

    // increment low water threshold for ramparts

    if (Memory.defenseLowWater[name][STRUCTURE_RAMPART] < RAMPART_HITS_MAX[room.controller.level]) {
      var newThreshold = _.min(ramparts, "hits").hits + 1000;
      if (newThreshold > RAMPART_HITS_MAX[room.controller.level]) {
        newThreshold = RAMPART_HITS_MAX[room.controller.level];
      }
      if (newThreshold > Memory.defenseLowWater[name][STRUCTURE_RAMPART]) {
        Memory.defenseLowWater[name][STRUCTURE_RAMPART] = newThreshold;
      }
    }

    // increment low water threshold for walls

    if (Memory.defenseLowWater[name][STRUCTURE_WALL] < WALL_HITS_MAX) {
      var newThreshold = _.min(walls, "hits").hits + 1000;
      if (newThreshold > WALL_HITS_MAX) {
        newThreshold = WALL_HITS_MAX;
      }
      if (newThreshold > Memory.defenseLowWater[name][STRUCTURE_WALL]) {
        Memory.defenseLowWater[name][STRUCTURE_WALL] = newThreshold;
      }
    }

    // run towers

    _.forEach(towers, (t) => tower.run(t));

    if (creeps.length > containers.length) {
      // run flags

      for (var flag of flags) {
        if (flag.memory.assignedCreep !== undefined) {
          var creep = Game.getObjectById(flag.memory.assignedCreep);
          if ((creep === null) || (creep.memory.role != "breacher")) {
            flag.memory.assignedCreep = undefined;
          }
        }

        if (flag.memory.assignedWall === undefined) {
          // assume that any flag placed on a wall indicates breaching
          walls = room.lookForAt(LOOK_STRUCTURES, flag);
          if (walls.length && (walls[0].structureType == STRUCTURE_WALL)) {
            flag.memory.assignedWall = walls[0].id;
          }
        }

        if ((flag.memory.assignedWall !== undefined) && (flag.memory.assignedCreep === undefined)) {
          var creep = flag.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c) => ((c.memory.assignment === undefined) && (c.memory.role == "harvester") && (_.sum(c.carry) == 0))
          });
          if (creep !== null) {
            flag.memory.assignedCreep = creep.id;
            creep.memory.assignment = flag.memory.assignedWall;
            creep.memory.role = "breacher";
          }
        }
      }

      // run drops

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

      // run tombstones

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

    if (creeps.length > (containers.length * 2)) {
      // TODO: use creeps array already loaded
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
    }

    // if (creeps.length >= ((containers.length * 2) + towers.length)) {
    //   _.forEach(towers, (t) => {
    //     if (room.find(FIND_MY_CREEPS, {
    //       filter: (c) => (c.memory.assignedToTower == t.id)
    //     }).length == 0) {
    //       creep = t.pos.findClosestByRange(FIND_MY_CREEPS, {
    //         filter: (c) => ((c.memory.parkedAt === undefined) && (c.memory.role != "scavenger") && (c.memory.role != "upgrader"))
    //       });
    //       if (creep !== null) {
    //         creep.memory.assignedToTower = t.id;
    //       }
    //     }
    //   });
    // }

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

    // TODO: look for a spawn that isn't busy, instead of using the first?
    //       Is it even possible to have more than one spawn per room?
    var spawn = _.first(spawns);
    if (spawn !== undefined) {
      // assumes all flags are for breaching
      if (creeps.length < (20 + flags.length)) {
        var parts = [WORK, MOVE, CARRY, MOVE];
        var availableEnergy = room.energyAvailable;

        // console.log(`partsRangedRCL5 = ${_.sum(_.map(partsRangedRCL5, (p) => BODYPART_COST[p]))}`);

        // if redAlert and availableEnergy > 200
        //   parts = [WORK, CARRY, MOVE]
        // if (availableEnergy > 750) {  // 500 + minimum creep build cost
        //   parts = [WORK, MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE];
        // }
        // if (availableEnergy > 880) {  // 630 + minimum creep build cost
        //   parts = [ATTACK, MOVE, WORK, MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE];
        // }
        // if (availableEnergy > 950) {  // 700 + minimum creep build cost
        //   parts = [RANGED_ATTACK, MOVE, WORK, MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE];
        // }
        // if (availableEnergy > 2570) {  // 2320 + minimum  -- NPC melee, RCL >= 4
        //   parts = [
        //     TOUGH,  MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,  MOVE,
        //     TOUGH,  MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,  MOVE,
        //     TOUGH,  MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,         MOVE, TOUGH,  MOVE,
        //     TOUGH,  MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, ATTACK, MOVE,
        //     ATTACK, MOVE, WORK,          MOVE, CARRY,         MOVE, WORK,          MOVE, CARRY,  MOVE
        //   ];
        // }
        // if (availableEnergy > 4360) {  // 4110 + minimum  -- NPC ranged, RCL >= 4
        //   parts = [
        //     TOUGH,         TOUGH,         TOUGH,         TOUGH,         TOUGH,         TOUGH,         MOVE,          MOVE,          MOVE,          MOVE,
        //     MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,
        //     MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,          MOVE,
        //     RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
        //     RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, WORK,          MOVE
        //   ];
        // }

        worker.spawn(spawn, parts);
      }
    }

    if (room.energyAvailable < (extensions.length * EXTENSION_ENERGY_CAPACITY[room.controller.level])) {
      _.each(creeps, (c) => {
        if (c.memory.role == "builder") {
          c.memory.role = "replenisher";
        }
      });
    }
  }

  if (worker.totalCount() < 10) {
    Memory.endangered = true;
    for (var name in Game.creeps) {
      var creep = Game.creeps[name];
      // if (creep.memory.assignedToTower !== undefined) {
      //   creep.memory.assignedToTower = undefined;
      // }
      if ((creep.memory.role != "harvester") && (creep.memory.role != "replenisher")) {
        creep.memory.role = "replenisher";
      }
    }
  }
  else {
    Memory.endangered = undefined;
  }

  // TODO: dynamic dispatch, rather than role transitions hardcoded in roles
  // * raise priority of replenishing extensions over building


  for (var name in Game.creeps) {
    var creep = Game.creeps[name];

    if (creep.memory.role === undefined) {
      creep.memory.role = "upgrader";
    }

    switch (creep.memory.role) {
      case "breacher":
        roleBreacher.run(creep);
        break;
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
  // clean up memory structures
  //

  //
  // clean up creep memory
  //

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      var ghost = Memory.creeps[name];

      for (var flag of room.find(FIND_FLAGS)) {
        if (flag.memory.assignedCreep == ghost.id) {
          flag.memory.assignedCreep = undefined;
        }
      }

      delete Memory.creeps[name];
    }
  }

  logger.logCPU();
}
