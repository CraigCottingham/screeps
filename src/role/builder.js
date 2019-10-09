let worker = require("worker");

let roleBuilder = {
  run: function (creep) {
    // creep.say("build");

    if (creep.carry.energy == 0) {
      this.switchTo(creep, "harvester");
      return OK;
    }

    let site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
      filter: (site) => (site.progress < site.progressTotal)
    });
    if (site === null) {
      // changed from replenisher
      // hopefully, switching to repairer will enduce the creep to build up
      // a rampart or wall after building it
      this.switchTo(creep, "repairer");
    }
    else {
      this.build(creep, site);
    }

    return OK;
  },

  build: function (creep, site) {
    switch (creep.build(site)) {
      case ERR_NOT_OWNER:
        this.switchTo("replenisher");
        break;
      case ERR_BUSY:
        this.switchTo("replenisher");
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        this.switchTo(creep, "harvester");
        break;
      case ERR_INVALID_TARGET:
        // don't change role
        // next time through, hopefully we'll find a different target
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, site);
        break;
      case ERR_NO_BODYPART:
        this.terminate(creep);
        break;
      default:
        break;
    }
  },

  switchTo: function (creep, newRole) {
    creep.memory.role = newRole;
  },

  terminate: function (creep) {
    creep.memory.role = undefined;
    creep.suicide();
  }
}

module.exports = roleBuilder;
