#!/bin/bash

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Start the Spring Boot application
echo "Starting Spring Boot application..."
java -Dspring.profiles.active=production -jar target/immunizationdb-backend-1.0.0.jar