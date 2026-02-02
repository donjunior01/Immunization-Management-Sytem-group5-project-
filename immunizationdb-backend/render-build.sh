#!/bin/bash

# Install Java 17 and Maven
echo "Installing Java 17 and Maven..."

# Update package list
apt-get update

# Install Java 17
apt-get install -y openjdk-17-jdk

# Install Maven
apt-get install -y maven

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Verify installations
echo "Java version:"
java -version
echo "Maven version:"
mvn -version

# Build the application
echo "Building Spring Boot application..."
mvn clean install -DskipTests

echo "Build completed successfully!"