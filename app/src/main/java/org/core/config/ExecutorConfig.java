package org.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class ExecutorConfig {

    @Value("${sectionPool}")
    private int sectionPoolSize;

    @Value("${lessonPool}")
    private int lessonPoolSize;

    @Value("${stepPool}")
    private int stepPoolSize;

    @Bean(name = "sectionExecutor", destroyMethod = "shutdown")
    public ExecutorService sectionExecutor(){
        return Executors.newFixedThreadPool(sectionPoolSize);
    }

    @Bean(name = "lessonExecutor", destroyMethod = "shutdown")
    public ExecutorService lessonExecutor(){
        return Executors.newFixedThreadPool(lessonPoolSize);
    }

    @Bean(name = "stepExecutor", destroyMethod = "shutdown")
    public ExecutorService stepExecutor(){
        return Executors.newFixedThreadPool(stepPoolSize);
    }
}
