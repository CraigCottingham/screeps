"use strict";

// fun fact:
//   a = Game.cpu.getUsed(); for (let creepName in Game.creeps) Game.creeps[creepName].memory.abc; console.log(Game.cpu.getUsed() - a);
// uses about 0.1 CPU, while
//   a = Game.cpu.getUsed(); for (let creepName in Game.creeps) Memory.creeps[Game.creeps[creepName].name].abc; console.log(Game.cpu.getUsed() - a);
// uses about 0.025 CPU
// though are those numbers for more creeps than I normally use? I'm not seeing much of a difference at around 32 creeps
// suggested by Tigga in #cpu-clinic:

Object.defineProperty(Creep.prototype, "mem", {
  get: function() {
    return Memory.creeps[this.name] = Memory.creeps[this.name] || {};
  },
  set: function(value) {
    Memory.creeps[this.name] = value;
  },
  configurable: true,
});
