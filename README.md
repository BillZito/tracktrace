# Track and Trace

## How it works ##
Search for an id (eg. 'TXG790195100') or go to https://nameless-journey-97987.herokuapp.com/#/bookings/TXG790195100 to get information about the container

## Getting Started ##
```
git clone https://github.com/billzito/tracktrace
npm install
npm start


(in another terminal tab):
npm run dev
```

## Product roadmap: ##
1. Fix 2 parsing bugs below
1. Allow 'following' of containers to see updates to information
1. Write unit tests for server and test robustness of parsing in particular
1. Put frontend in a table to improve look

## Known bugs: ## 
1. Native javascript date parsing is off by a couple days, putting VesselETA off
1. Only first container is returned (need to iterate through containers)
