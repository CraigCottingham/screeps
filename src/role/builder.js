var worker = require("worker");

var roleBuilder = {
  run: function (creep) {
    // creep.say("build");

    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    var site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
      filter: (site) => (site.progress < site.progressTotal)
    });
    if (site === null) {
      creep.memory.role = "replenisher";
    }
    else {
      switch (creep.build(site)) {
        case ERR_NOT_OWNER:
          break;
        case ERR_BUSY:
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          creep.memory.role = "harvester";
          break;
        case ERR_INVALID_TARGET:
          break;
        case ERR_NOT_IN_RANGE:
          worker.moveTo(creep, site);
          break;
        case ERR_NO_BODYPART:
          creep.suicide();
          break;
        default:
          break;
      }
    }

    return OK;
  }
}

module.exports = roleBuilder;
