#!/usr/bin/env bash
# .github/setup/cleanup.sh
#
# This script creates a timestamped logfile, redirects all output to it, 
# and defines a trap to remove the logfile on successful completion.

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOGFILE="setup-${TIMESTAMP}.log"

# Send both STDOUT and STDERR to tee, appending to $LOGFILE
exec > >(tee -a "$LOGFILE") 2>&1

# Trap function to remove the logfile if exit status is 0, else show error
cleanup_log() {
  local status=$?
  if [ "$status" -eq 0 ]; then
    rm -f "$LOGFILE"
  else
    echo ""
    echo "============================================================"
    echo "ERROR: Script failed (exit code $status)."
    echo "Logs have been saved in: $LOGFILE"
    echo "============================================================"
  fi
  exit $status
}
trap cleanup_log EXIT