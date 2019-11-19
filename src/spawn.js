"use strict";

let spawnExtensions = {
  mySpawnCreep: function (parts, name, opts) {
    if (!name) {
      name = `Worker${Game.time}`;
    }

    // sort extensions & spawns in order of increasing distance from each source in the room
    // zipper them (sort of) into a single array that rotates (sort of) between sources

    const room = this.room;
    const extensions = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_EXTENSION)});
    const sources = room.find(FIND_SOURCES);

    const extensionsByDistanceFromSource = _.reduce(sources, (acc, s) => {
      acc.push(_.sortBy(extensions, (e) => (s.pos.getRangeTo(e))));
      return acc;
    }, []);
    let energyStructures = _.uniq(_.flatten(_.zip(...extensionsByDistanceFromSource)));
    energyStructures.push(this);

    opts = opts || {};
    opts.energyStructures = energyStructures;

    const result = this._spawnCreep(parts, name, opts);
    switch (result) {
      case OK:
        // spawn.room.visual.text("🛠️ Worker", spawn.pos.x + 1, spawn.pos.y, {align: "left", opacity: 0.8});
        break;
      case ERR_NOT_OWNER:
        console.log("not owner");
        break;
      case ERR_NAME_EXISTS:
        // console.log("name exists");
        break;
      case ERR_BUSY:
        // console.log("busy");
        break;
      case ERR_NOT_ENOUGH_ENERGY:
        // console.log("not enough energy");
        break;
      case ERR_INVALID_ARGS:
        console.log("invalid args");
        break;
      case ERR_RCL_NOT_ENOUGH:
        console.log("RCL not enough");
        break;
      default:
        console.log("(reached default)");
        break;
    }
    return result;
  }
}

StructureSpawn.prototype["_spawnCreep"] = StructureSpawn.prototype["spawnCreep"];
StructureSpawn.prototype["spawnCreep"] = spawnExtensions.mySpawnCreep;

module.exports = spawnExtensions;
