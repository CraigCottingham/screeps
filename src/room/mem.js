"use strict";

Object.defineProperty(Room.prototype, "mem", {
  get: function() {
    // return Memory.rooms[this.name] = Memory.rooms[this.name] || {};
    return this.memory = this.memory || {};
  },
  set: function(value) {
    // Memory.rooms[this.name] = value;
    this.memory = value;
  },
  configurable: true,
});
