"use strict";

Object.defineProperty(Room.prototype, "mem", {
  get: function() {
    return Memory.rooms[this.name] = Memory.rooms[this.name] || {};
  },
  set: function(value) {
    Memory.rooms[this.name] = value;
  },
  configurable: true,
});
