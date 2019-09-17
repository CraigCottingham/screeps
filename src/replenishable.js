var replenishable = {
  energy: function(structure) {
    switch (structure.structureType) {
      case STRUCTURE_CONTAINER:
      case STRUCTURE_STORAGE:
      case STRUCTURE_TERMINAL:
        return _.sum(structure.store);
      case STRUCTURE_EXTENSION:
      case STRUCTURE_LAB:
      case STRUCTURE_LINK:
      case STRUCTURE_NUKER:
      case STRUCTURE_POWER_SPAWN:
      case STRUCTURE_SPAWN:
      case STRUCTURE_TOWER:
        return structure.energy;
    }

    return undefined;
  },

  energyCapacity: function(structure) {
    switch (structure.structureType) {
      case STRUCTURE_CONTAINER:
      case STRUCTURE_STORAGE:
      case STRUCTURE_TERMINAL:
        return structure.storeCapacity;
      case STRUCTURE_EXTENSION:
      case STRUCTURE_LAB:
      case STRUCTURE_LINK:
      case STRUCTURE_NUKER:
      case STRUCTURE_POWER_SPAWN:
      case STRUCTURE_SPAWN:
      case STRUCTURE_TOWER:
        return structure.energyCapacity;
    }

    return undefined;
  },

  isReplenishable: function(structure) {
    switch (structure.structureType) {
      case STRUCTURE_CONTAINER:
      case STRUCTURE_EXTENSION:
      case STRUCTURE_LAB:
      case STRUCTURE_LINK:
      case STRUCTURE_NUKER:
      case STRUCTURE_POWER_SPAWN:
      case STRUCTURE_SPAWN:
      case STRUCTURE_STORAGE:
      case STRUCTURE_TERMINAL:
      case STRUCTURE_TOWER:
        return true;
    }

    return undefined;
  }
}

module.exports = replenishable;
