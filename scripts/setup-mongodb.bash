#!/bin/bash

# Sets up MongoDB (engine and data) for server app(s).
# Meant to be run from dev env setup scripts.

if [[ -z "$MONGO_NAME" ]] || [[ -z "$MONGO_DL_BASE_URL" ]] || \
   [[ -z "$MONGO_BASE_FOLDER" ]] || [[ -z "$MONGO_DATA_FOLDER" ]]; then
  echo ""
  echo "Expected environment variables:"
  echo "    MONGO_NAME        Full name of the MongoDB version, e.g. \"mongodb-osx-x86_64-2.4.5\""
  echo "    MONGO_DL_BASE_URL Base download URL, e.g. \"mongodb-osx-x86_64-2.4.5\""
  echo "    MONGO_BASE_FOLDER Root installation folder; created if missing"
  echo "    MONGO_DATA_FOLDER Mongo data folder; created if missing"
  echo ""
  echo "MongoDB will be installed (if needed) in \"MONGO_BASE_FOLDER/MONGO_NAME\""
  echo ""
  exit 1
fi

# working dir fix
SCRIPT_FOLDER=$(cd $(dirname "$0"); pwd)
cd $SCRIPT_FOLDER/

mkdir -p $MONGO_BASE_FOLDER
mkdir -p $MONGO_DATA_FOLDER

if [[ ! -d $MONGO_BASE_FOLDER ]]; then
  echo ""
  echo "Invalid base folder path: '$MONGO_BASE_FOLDER' does not exist"
  echo ""
  exit 1
fi

if [[ ! -d $MONGO_DATA_FOLDER ]]; then
  echo ""
  echo "Invalid data folder path: '$MONGO_DATA_FOLDER' does not exist"
  echo ""
  exit 1
fi

echo ""
echo "Checking for MongoDB ($MONGO_BASE_FOLDER/$MONGO_NAME)..."
if [[ ! -d $MONGO_BASE_FOLDER/$MONGO_NAME ]]; then
  echo "...installing $MONGO_NAME"
  echo ""
  EXIT_CODE=0
  curl -C - -o "$MONGO_BASE_FOLDER/$MONGO_NAME.tgz" $MONGO_DL_BASE_URL/$MONGO_NAME.tgz
  EXIT_CODE=`expr ${EXIT_CODE} + $?`
  cd $MONGO_BASE_FOLDER
  tar -xzf $MONGO_NAME.tgz
  EXIT_CODE=`expr ${EXIT_CODE} + $?`
  rm $MONGO_BASE_FOLDER/$MONGO_NAME.tgz
  if [[ ${EXIT_CODE} -ne 0 ]]; then
    echo ""
    echo "Failed installing MongoDB. Setup aborted."
    echo ""
    exit $((${EXIT_CODE}))
  fi
else
  echo "...skipped: $MONGO_NAME already installed"
fi


echo ""
echo "Database setup complete."
echo ""
echo "To run MongoDB (--dbpath defaults to /data/db if not specified):"
echo "    $MONGO_BASE_FOLDER/$MONGO_NAME/bin/mongod --dbpath $MONGO_DATA_FOLDER [<other arguments>]"
echo ""
