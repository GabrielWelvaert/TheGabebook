#!/bin/bash

PORT=3000

echo "Finding processes using port $PORT..."
PIDS=$(lsof -ti :$PORT)

if [ -z "$PIDS" ]; then
  echo "No processes are using port $PORT."
else
  echo "Killing the following process IDs: $PIDS"
  kill -9 $PIDS
  echo "Done. Port $PORT is now free."
fi
