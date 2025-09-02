package org.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan("org.core")
public class EasyCourseApplication {

    public static void main(String[] args) {
        SpringApplication.run(EasyCourseApplication.class, args);
    }

}
