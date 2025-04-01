FROM openjdk:21-jdk-slim

# Install Gradle (optional: if you want to build inside Docker)
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    && curl -s https://get.sdkman.io | bash \
    && source "$HOME/.sdkman/bin/sdkman-init.sh" \
    && sdk install gradle

# Set work directory
WORKDIR /app

# Copy the whole project to the container
COPY . /app

# Build the Spring application using Gradle (this will create the .jar file)
RUN gradle build

# Expose port
EXPOSE 8080

# Run the Spring application
ENTRYPOINT ["java", "-jar", "build/libs/*.jar"]