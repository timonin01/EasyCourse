FROM eclipse-temurin:21-jdk-alpine

COPY build/libs/easy-course-app-1.0.0.jar easy-course-app.jar

CMD ["java", "-Dspring.profiles.active=mysql-local", "-jar", "easy-course-app.jar"]

EXPOSE 8080
