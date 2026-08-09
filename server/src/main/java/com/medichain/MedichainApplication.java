package com.medichain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class MedichainApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedichainApplication.class, args);
    }
}
