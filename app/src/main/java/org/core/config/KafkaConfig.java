package org.core.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

import java.util.Map;

@Configuration
public class KafkaConfig {

    @Value("${app.kafka.account-update-topic}")
    private String topicName;

    @Value("${app.kafka.partitions}")
    private int partitions;

    @Value("${app.kafka.replicas}")
    private int replicas;

    @Value("${app.kafka.min-insync-replicas}")
    private int minInsyncReplicas;

    @Bean
    public NewTopic linkUpdateTopic() {
        return TopicBuilder.name(topicName)
                .partitions(partitions)
                .replicas(replicas)
                .configs(Map.of("min.insync.replicas", String.valueOf(minInsyncReplicas)))
                .build();
    }

}
