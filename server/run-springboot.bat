@echo off
echo Starting MediChain Java Spring Boot Backend...
"%~dp0maven\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
pause
