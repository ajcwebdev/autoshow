#!/bin/bash

# Check if Docker is running
if ! docker info &>/dev/null; then
    echo "Docker is not running. Checking for Colima..."
    if command_exists colima; then
        echo "Colima is installed. Attempting to start Colima..."
        colima start &>/dev/null
        if [ $? -eq 0 ]; then
            echo "Colima started successfully."
        else
            echo "Failed to start Colima. Please start Docker manually or check your Docker installation."
        fi
    else
        echo "Colima is not installed. Please start Docker manually or check your Docker installation."
    fi
else
    echo "Docker is running."
fi