'use strict';

let logger = require("logger");
let roleBreacher = require("role.breacher");
let roleBuilder = require("role.builder");
let roleHarvester = require("role.harvester");
let roleRepairer = require("role.repairer");
let roleReplenisher = require("role.replenisher");
let roleScavenger = require("role.scavenger");
let roleUpgrader = require("role.upgrader");
let tower = require("tower");
let worker = require("worker");

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

// fun fact:
//   a = Game.cpu.getUsed(); for (let creepName in Game.creeps) Game.creeps[creepName].memory.abc; console.log(Game.cpu.getUsed() - a);
// uses about 0.1 CPU, while
//   a = Game.cpu.getUsed(); for (let creepName in Game.creeps) Memory.creeps[Game.creeps[creepName].name].abc; console.log(Game.cpu.getUsed() - a);
// uses about 0.025 CPU
// suggested by Tigga in #cpu-clinic:

// Object.defineProperty(Creep.prototype, 'mem', {
//   get: function() {
//     return Memory.creeps[this.name] = Memory.creeps[this.name] || {};
//   },
//   set: function(value) {
//     Memory.creeps[this.name] = value
//   },
//   configurable: true,
// });
//
// Creep.prototype.initTick = function() {
//   this.mem = Memory.creeps[this.name];
// // ^^^ what is this initTick() and how is it called?

//
// initialize memory structures
//

if (Memory.defenseLowWater === undefined) {
  Memory.defenseLowWater = {};
}
if (Memory.redAlert === undefined) {
  Memory.redAlert = {};
}
if (Memory.triggerAutoincrementThreshold === undefined) {
  Memory.triggerAutoincrementThreshold = {};
}

module.exports.loop = function () {
  let roomsControlled = _.filter(_.values(Game.structures), (s) => (s.structureType == STRUCTURE_CONTROLLER)).length;
  let roomsAllowed = Game.gcl.level;

  // logger.logCreeps();
  // logger.logAllRooms();

  //
  // run objects
  //

  for (let name in Game.rooms) {
    let room = Game.rooms[name];

    // fetch arrays of structures for this room

    let creeps = room.find(FIND_MY_CREEPS);
    let constructionSites = room.find(FIND_CONSTRUCTION_SITES);
    let containers = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
    });
    let drops = room.find(FIND_DROPPED_RESOURCES);
    let extensions = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_EXTENSION)
    });
    let flags = room.find(FIND_FLAGS);
    let ramparts = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_RAMPART)
    });
    let spawns = room.find(FIND_MY_SPAWNS);
    let tombstones = room.find(FIND_TOMBSTONES);
    let towers = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_TOWER)
    });
    let walls = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_WALL)
    });

    Memory.redAlert[name] = (room.find(FIND_HOSTILE_CREEPS).length > 0);

    // set up low water thresholds for defensive structures

    if (Memory.defenseLowWater[name] === undefined) {
      Memory.defenseLowWater[name] = {};
      Memory.defenseLowWater[name][STRUCTURE_RAMPART] = RAMPART_HITS;
      Memory.defenseLowWater[name][STRUCTURE_WALL] = WALL_HITS;
    }

    if (Memory.triggerAutoincrementThreshold[name]) {
      // autoincrement low water threshold for ramparts
      if (Memory.defenseLowWater[name][STRUCTURE_RAMPART] < RAMPART_HITS_MAX[room.controller.level]) {
        let newThreshold = _.min(ramparts, "hits").hits + 1000;
        if (newThreshold > RAMPART_HITS_MAX[room.controller.level]) {
          newThreshold = RAMPART_HITS_MAX[room.controller.level];
        }
        if (newThreshold > Memory.defenseLowWater[name][STRUCTURE_RAMPART]) {
          Memory.defenseLowWater[name][STRUCTURE_RAMPART] = newThreshold;
        }
      }

      // autoincrement low water threshold for walls
      if (Memory.defenseLowWater[name][STRUCTURE_WALL] < WALL_HITS_MAX) {
        let newThreshold = _.min(walls, "hits").hits + 1000;
        if (newThreshold > WALL_HITS_MAX) {
          newThreshold = WALL_HITS_MAX;
        }
        if (newThreshold > Memory.defenseLowWater[name][STRUCTURE_WALL]) {
          Memory.defenseLowWater[name][STRUCTURE_WALL] = newThreshold;
        }
      }

      Memory.triggerAutoincrementThreshold[name] = undefined;
    }

    // run towers

    _.forEach(towers, (t) => tower.run(t));

    if (creeps.length > containers.length) {
      // run flags

      // run drops

      for (let drop of drops) {
        let amount = drop.amount;
        if (amount > 0) {
          let creep = drop.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (c) => (c.memory.parkedAt === undefined) && (_.sum(c.carry) < c.carryCapacity)
          });
          if (creep !== null) {
            creep.memory.assignment = drop.id;
            creep.memory.role = "scavenger";
          }
        }
      }

      // run tombstones

      for (let tombstone of tombstones) {
        let amount = _.sum(tombstone.store);
        // let amount = tombstone.store[RESOURCE_ENERGY];
        if (amount > 0) {
          let creep = tombstone.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (c) => (c.memory.parkedAt === undefined) && (_.sum(c.carry) < c.carryCapacity)
          });
          if (creep !== null) {
            creep.memory.assignment = tombstone.id;
            creep.memory.role = "scavenger";
          }
        }
      }

      // run construction sites

      // don't run this if there are too many things needing repair?
      if (!Memory.redAlert[name]) {
        for (let site of constructionSites) {
          let creep = site.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c) => (c.memory.parkedAt === undefined) &&
                           (c.memory.role != "replenisher") &&
                           (c.memory.role != "scavenger") &&
                           (c.carry.energy > 0) &&
                           (_.sum(c.carry) == c.carry.energy)
          });
          if (creep !== null) {
            creep.memory.role = "builder";
          }
        }
      }

      // TODO: use creeps array already loaded
      if (room.controller.my) {
        if (_.all(creeps, (c) => (c.memory.role != "upgrader"))) {
          creep = room.controller.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c) => (c.memory.parkedAt === undefined) && (c.carry.energy > 0)
          })
          if (creep !== null) {
            creep.memory.role = "upgrader";
          }
        }
      }
    }

    if (creeps.length > (containers.length * 2)) {
      // TODO: revisit this
      // if (roomsAllowed > roomsControlled) {
      //   if (_.all(_.values(Game.creeps), (c) => (c.memory.role != "ranger"))) {
      //     creep = _.find(creeps, (c) => (_.any(c.body, (p) => (p.type == CLAIM))));
      //     if (creep !== undefined) {
      //       creep.memory.role = "ranger";
      //     }
      //   }
      // }
      // else {
        // only send rangers if any controlled room does not have its own spawn
        // if (_.all(_.values(Game.creeps), (c) => (c.memory.role != "ranger"))) {
        //   creep = _.find(creeps, (c) => (c.memory.parkedAt === undefined) && (c.memory.role == "harvester") && (c.carry.energy > 0));
        //   if (creep !== undefined) {
        //     creep.memory.role = "ranger";
        //   }
        // }
      // }
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
    let spawn = _.first(spawns);
    if (spawn !== undefined) {
      // assumes all flags are for breaching
      if (creeps.length < ((_.max([containers.length, 1]) * 4) + flags.length + roomsAllowed - roomsControlled)) {
        let parts = [WORK, MOVE, CARRY, MOVE];
        let availableEnergy = room.energyAvailable;

        // console.log(`partsRangedRCL5 = ${_.sum(_.map(partsRangedRCL5, (p) => BODYPART_COST[p]))}`);

        // TODO: limit # of "extra work workers" to # of containers?
        //       if we're intending to limit these to containers, maybe eliminate the CARRY?
        if (availableEnergy > 350) {
          parts = [WORK, WORK, MOVE, CARRY, MOVE];
        }

        // TODO: create haulers (CARRY, MOVE)?

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

        // if ((roomsAllowed > roomsControlled) && (_.all(_.values(Game.creeps), (c) => (c.memory.role != "ranger")))) {
        //   parts = [WORK, CARRY, CLAIM, MOVE, MOVE, MOVE];
        // }

        worker.spawn(spawn, parts);
      }

      // if (spawn.spawning === null) {
      //   let pos = spawn.pos;
      //   let creep = _.min(_.filter(creeps, (c) => (pos.isNearTo(c))), "ticksToLive");
      //   // renewCreep() increases the creep's timer by a number of ticks according to the formula
      //   //   floor(600/body_size)
      //   // so don't renew the creep if we can't restore that many ticks
      //   if ((creep !== Infinity) && (creep.ticksToLive < (CREEP_LIFE_TIME - _.floor(600 / creep.body.length)))) {
      //     // creep.say("zap!");
      //     spawn.renewCreep(creep);
      //   }
      // }
    }

    // not if creep is sitting on top of a construction site?
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
    for (let name in Game.creeps) {
      let creep = Game.creeps[name];
      if ((creep.memory.role != "harvester") && (creep.memory.role != "replenisher")) {
        creep.memory.role = "replenisher";
      }
    }
  }
  else {
    Memory.endangered = undefined;
  }

  // TODO: dynamic dispatch, rather than role transitions hardcoded in roles

  for (let name in Game.creeps) {
    let creep = Game.creeps[name];

    if (creep.memory.birthRoom === undefined) {
      creep.memory.birthRoom = creep.room.name;
    }

    if (creep.memory.role === undefined) {
      creep.memory.role = "upgrader";
    }

    // if we're not on a road, drop a construction site
    let structures = creep.pos.lookFor(LOOK_STRUCTURES);
    if (!structures.length || _.all(structures, (s) => (s.structureType != STRUCTURE_ROAD))) {
      switch (creep.pos.createConstructionSite(STRUCTURE_ROAD)) {
        case OK:
          break;
        case ERR_INVALID_TARGET:
          // console.log("The structure cannot be placed at the specified location.");
          break;
        case ERR_FULL:
          // console.log("You have too many construction sites.");
          break;
        case ERR_INVALID_ARGS:
          // console.log("The location is incorrect.")
          break;
        case ERR_RCL_NOT_ENOUGH:
          // console.log("Room Controller Level insufficient.");
          break;
      }
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

  for (let name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }

  //
  // clean up flag memory
  //

  for (let name in Memory.flags) {
    if (!Game.flags[name]) {
      delete Memory.flags[name];
    }
  }

  // logger.logCPU();
}
