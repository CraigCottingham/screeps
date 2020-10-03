'use strict'

require('spawn')

let level = {
  run: function (room) {
    // const controller = room.controller

    // if (!controller || !controller.my) {
    //   return OK
    // }

    this.runCreeps(room)

    this.spawnCreeps(room)

    return OK
  },

  runCreeps: function (room) {
    const creeps = room.find(FIND_MY_CREEPS)
    if (!creeps || creeps.length < 1) {
      return OK
    }

    for (const creep of creeps) {
      this.runOneCreep(creep)
    }
  },

  runOneCreep: function (creep) {
    let dest = null

    if (creep.memory.harvesting == undefined) {
      creep.memory.harvesting = false
    }

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && creep.memory.harvesting == false) {
      // it has energy and it is not harvesting

      if (dest == null) {
        dest = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES)
      }
      if (dest == null) {
        dest = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_CONTROLLER } })
      }
      if (dest == null) {
        dest = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: { structureType: STRUCTURE_CONTROLLER } })
      }
    } else {
      // it doesn't have energy or it is harvesting

      if (dest == null) {
        dest = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0,
        })
      }
      if (dest == null) {
        dest = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
      }
    }

    if (dest instanceof ConstructionSite) {
      creep.build(dest)
    } else if (dest instanceof StructureController) {
      creep.claimController(dest)
      creep.upgradeController(dest)
    } else if (dest instanceof StructureContainer) {
      creep.withdraw(dest, RESOURCE_ENERGY)
    } else if (dest instanceof Source) {
      const pos = creep.pos
      if (pos.isNearTo(dest)) {
        if (
          _.filter(pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType == STRUCTURE_CONTAINER).length == 0 &&
          pos.lookFor(LOOK_CONSTRUCTION_SITES).length == 0
        ) {
          pos.createConstructionSite(STRUCTURE_CONTAINER)
        }

        creep.memory.harvesting = creep.harvest(dest) == OK && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      }
    }

    if (dest != null) {
      creep.moveTo(dest)
    }
  },

  spawnCreeps: function (room) {
    const spawns = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN } })
    if (!spawns || spawns.length < 1) {
      return OK
    }

    for (const spawn of spawns) {
      if (spawn.store.getUsedCapacity(RESOURCE_ENERGY) >= 200 && spawn.spawning == null) {
        spawn.spawnCreep([WORK, CARRY, MOVE], undefined)
      }
    }
  },
}

module.exports = level
