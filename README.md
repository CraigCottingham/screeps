# screeps

## DEPLOYING

    grunt screeps

## TODO

* [ ] when dispatching a creep, look for the closest _anything_ of relevance
      (construction site, repair site, spawn or resource) and go to that
* [ ] if controller.ticksToDowngrade drops below max for the level, and there
      is not a creep already in the `upgrader` role, force one
* [ ] when building/repairing/replenishing/upgrading, move as close as possible
      to the location being operated on?
* [ ] low-priority creeps (small persistent number?) for fortifying walls
