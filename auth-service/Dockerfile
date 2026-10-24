# syntax=docker/dockerfile:1
# Build
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B -Dmaven.wagon.http.retryHandler.count=5 -Daether.connector.connectTimeout=60000 -Daether.connector.requestTimeout=120000
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn package -Dmaven.test.skip=true -B -Dmaven.wagon.http.retryHandler.count=5 -Daether.connector.connectTimeout=60000 -Daether.connector.requestTimeout=120000

# Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar
USER app
EXPOSE 8081
ENV EUREKA_URL="http://discovery-service:8761/eureka/"
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Duser.timezone=UTC"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
