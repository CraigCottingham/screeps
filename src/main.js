"use strict";

require("config");
require("visualizer");

require("creep.mem");
require("room.mem");
require("spawn");

let roleBreacher = require("role.breacher");
let roleBuilder = require("role.builder");
let roleHarvester = require("role.harvester");
let roleRanger = require("role.ranger");
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

module.exports.loop = function () {
  let roomsControlled = _.filter(_.values(Game.structures), (s) => (s.structureType == STRUCTURE_CONTROLLER)).length;
  let roomsAllowed = Game.gcl.level;

  //
  // run objects
  //

  for (let name in Game.rooms) {
    let room = Game.rooms[name];

    // fetch arrays of structures and other objects for this room

    let structures = _.groupBy(room.find(FIND_STRUCTURES), "structureType");

    let objects = {
      containers: structures[STRUCTURE_CONTAINER] || [],
      creeps: room.find(FIND_MY_CREEPS),
      constructionSites: room.find(FIND_CONSTRUCTION_SITES),
      drops: room.find(FIND_DROPPED_RESOURCES),
      extensions: structures[STRUCTURE_EXTENSION] || [],
      flags: room.find(FIND_FLAGS),
      hostileCreeps: room.find(FIND_HOSTILE_CREEPS),
      ramparts: structures[STRUCTURE_RAMPART] || [],
      roads: structures[STRUCTURE_ROAD] || [],
      ruins: room.find(FIND_RUINS),
      sources: room.find(FIND_SOURCES),
      spawns: room.find(FIND_MY_SPAWNS),
      tombstones: room.find(FIND_TOMBSTONES),
      towers: structures[STRUCTURE_TOWER] || [],
      walls: structures[STRUCTURE_WALL] || []
    };

    room.mem.endangered = (objects.creeps.length < (objects.sources.length * 2)); // (objects.creeps.length < 10);
    room.mem.maxCreeps = (objects.sources.length * 6) + objects.flags.length + roomsAllowed - roomsControlled;
    room.mem.redAlert = (objects.hostileCreeps.length > 0);
    room.mem.spawns = room.mem.spawns || {};
    _.forEach(objects.spawns, (s) => room.mem.spawns[s.id] = room.mem.spawns[s.id] || 0);
    room.mem.threshold = room.mem.threshold || {rampart: RAMPART_HITS, wall: WALL_HITS};

    if (room.mem.threshold.update) {
      // autoincrement low water threshold for ramparts

      if (room.mem.threshold.rampart < RAMPART_HITS_MAX[room.controller.level]) {
        let newThreshold = _.min(objects.ramparts, "hits").hits + TOWER_POWER_REPAIR;
        if (newThreshold > RAMPART_HITS_MAX[room.controller.level]) {
          newThreshold = RAMPART_HITS_MAX[room.controller.level];
        }
        if (newThreshold > room.mem.threshold.rampart) {
          room.mem.threshold.rampart = newThreshold;
        }
      }

      // autoincrement low water threshold for walls

      if (room.mem.threshold.wall < WALL_HITS_MAX) {
        let newThreshold = _.min(objects.walls, "hits").hits + TOWER_POWER_REPAIR;
        if (newThreshold > WALL_HITS_MAX) {
          newThreshold = WALL_HITS_MAX;
        }
        if (newThreshold > room.mem.threshold.wall) {
          room.mem.threshold.wall = newThreshold;
        }
      }

      room.mem.threshold.update = false;
    }

    // run towers

    _.forEach(objects.towers, (t) => tower.run(t, objects));

    if (objects.creeps.length > objects.containers.length) {
      // run flags

      // run drops

      for (let drop of objects.drops) {
        let amount = drop.amount;
        if (amount > 0) {
          let creep = drop.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (c) => (c.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
          });
          if (creep !== null) {
            creep.mem.assignment = drop.id;
            if (creep.mem.role == "ranger") {
              creep.mem.task = "harvest";
              delete creep.mem.path;
            }
            else {
              creep.mem.role = "scavenger";
            }
          }
        }
      }

      // run tombstones

      for (let tombstone of objects.tombstones) {
        let amount = _.sum(tombstone.store);
        if (amount > 0) {
          let creep = tombstone.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (c) => (c.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
          });
          if (creep !== null) {
            creep.mem.assignment = tombstone.id;
            if (creep.mem.role == "ranger") {
              creep.mem.task = "harvest";
              delete creep.mem.path;
            }
            else {
              creep.mem.role = "scavenger";
            }
          }
        }
      }

      // run ruins

      for (let ruin of objects.ruins) {
        let amount = _.sum(ruin.store);
        if (amount > 0) {
          let creep = ruin.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (c) => (c.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
          });
          if (creep !== null) {
            creep.mem.assignment = ruin.id;
            if (creep.mem.role == "ranger") {
              creep.mem.task = "harvest";
              delete creep.mem.path;
            }
            else {
              creep.mem.role = "scavenger";
            }
          }
        }
      }

      // don't run this if there are too many things needing repair?
      if (!room.mem.redAlert) {
        // run construction sites

        for (let site of objects.constructionSites) {
          let creep = site.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c) => (c.memory.parkedAt === undefined) &&
                           (c.memory.role != "ranger") &&
                           (c.memory.role != "replenisher") &&
                           (c.memory.role != "scavenger") &&
                           (c.carry.energy > 0) &&
                           (_.sum(c.carry) == c.carry.energy)
          });
          if (creep !== null) {
            creep.mem.role = "builder";
          }
        }
      }

      if (room.controller.my && (room.name != "E16S32")) {
        if (_.all(objects.creeps, (c) => (c.memory.role != "upgrader") && (c.memory.role != "ranger"))) {
          let creep = room.controller.pos.findClosestByRange(FIND_MY_CREEPS, {
            // filter: (c) => (c.memory.parkedAt === undefined) && (c.carry.energy > 0)
            filter: (c) => (c.carry.energy > 0)
          })
          if (creep !== null) {
            delete creep.mem.parkedAt;
            delete creep.mem.path;
            creep.mem.role = "upgrader";
          }
        }
      }
    }

    // TODO: look for a spawn that isn't busy, instead of using the first?
    //       Is it even possible to have more than one spawn per room?
    let spawn = _.first(objects.spawns);
    // if ((spawn !== undefined) && (spawn.spawning === null)) {
    if (spawn !== undefined) {
      // the number of creeps in a room should be some function of the number of WORK parts
      // ((5 WORK parts) * (number of sources)) + (number of controllers = 1) + (number of towers)
      // *** better yet, a function of the number of sources
      // since the number of sources determines how much energy is available in the room

      if ((room.mem.spawns[spawn.id] <= 0) || room.mem.endangered) {
        if ((spawn.spawning === null) && (room.energyAvailable > 250)) {
          const spawnCooldown = _.floor(CREEP_LIFE_TIME / room.mem.maxCreeps);

          // TODO: should be checking that there are no rangers in the world, not just in this room
          if ((Memory.colonize !== undefined) && _.all(_.values(Game.creeps), (c) => (c.mem.role != "ranger"))) {
            // spawn ranger
            let parts = [CLAIM, MOVE, WORK, MOVE, CARRY, MOVE];
            spawn.spawnCreep(parts, `Ranger${Game.time}`, {memory: {role: "ranger"}});
            room.mem.spawns[spawn.id] = spawnCooldown;
          }
          else if (objects.creeps.length < room.mem.maxCreeps) {
            let parts = [WORK, MOVE, CARRY, MOVE];
            let availableEnergy = room.energyAvailable;

            // console.log(`partsRangedRCL5 = ${_.sum(_.map(partsRangedRCL5, (p) => BODYPART_COST[p]))}`);

            // add minimum viable creep cost ([WORK, MOVE, CARRY, MOVE] == 250) to each of these thresholds?

            if (availableEnergy > 400) {
              parts = [WORK, MOVE, WORK, MOVE, CARRY, MOVE];
            }

            if (availableEnergy > 550) {
              parts = [WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, MOVE];
            }

            if (availableEnergy > 700) {
              parts = [WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, MOVE];
            }

            if (availableEnergy > 850) {
              parts = [WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, MOVE];
            }

            if (availableEnergy > 950) {
              parts = [WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, MOVE, CARRY, MOVE];
            }

            if (availableEnergy > 1050) {
              parts = [WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
            }

            if (availableEnergy > 1150) {
              parts = [WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
            }

            // console.log("spawning worker");
            spawn.spawnCreep(parts, undefined);
            room.mem.spawns[spawn.id] = spawnCooldown;
          }
        }
      }
      else {
        room.mem.spawns[spawn.id] = room.mem.spawns[spawn.id] - 1;
      }
    }

    // not if creep is sitting on top of a construction site?
    if (room.energyAvailable < (objects.extensions.length * EXTENSION_ENERGY_CAPACITY[room.controller.level])) {
      _.each(objects.creeps, (c) => {
        if (c.memory.role == "builder") {
          c.memory.role = "replenisher";
        }
      });
    }

    if (room.mem.endangered) {
      _.each(objects.creeps, (c) => {
        if ((c.memory.role != "harvester") && (c.memory.role != "ranger") && (c.memory.role != "replenisher") && (c.memory.role != "upgrader")) {
          c.memory.role = "replenisher";
        }
      });
    }

    // TODO: dynamic dispatch, rather than role transitions hardcoded in roles

    for (let creep of objects.creeps) {
      if (creep.mem.role === undefined) {
        creep.mem.role = "upgrader";
      }

      if (creep.pos.roomName == "E16S32") {
        creep.mem.role = "ranger";
      }

      // if we're not on a road, drop a construction site
      // let structures = creep.pos.lookFor(LOOK_STRUCTURES);
      // if (!structures.length || _.all(structures, (s) => (s.structureType != STRUCTURE_ROAD))) {
      //   switch (creep.pos.createConstructionSite(STRUCTURE_ROAD)) {
      //     case OK:
      //       break;
      //     case ERR_INVALID_TARGET:
      //       // console.log("The structure cannot be placed at the specified location.");
      //       break;
      //     case ERR_FULL:
      //       // console.log("You have too many construction sites.");
      //       break;
      //     case ERR_INVALID_ARGS:
      //       // console.log("The location is incorrect.")
      //       break;
      //     case ERR_RCL_NOT_ENOUGH:
      //       // console.log("Room Controller Level insufficient.");
      //       break;
      //   }
      // }

      switch (creep.mem.role) {
        case "breacher":
          roleBreacher.run(creep);
          break;
        case "builder":
          roleBuilder.run(creep);
          break;
        case "harvester":
          roleHarvester.run(creep);
          break;
        case "ranger":
          roleRanger.run(creep);
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

  //
  // visualizer is the lowest priority function
  //

  if (config.visualizer.enabled) {
    // try {
    //   Memory.myRooms.forEach(visualizer.myRoomDatasDraw);
    // } catch (e) {
    //   console.log('Visualizer Draw Exeception', e);
    // }

    try {
      visualizer.render();
      // if (config.profiler.enabled) {
      //   global.profiler.registerObject(visualizer, 'Visualizer');
      // }
    } catch (e) {
      console.log('visualizer render exception', e, e.stack);
    }
  }
}
