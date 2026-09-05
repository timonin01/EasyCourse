package org.core.event.serialization;

import org.apache.kafka.common.errors.SerializationException;
import org.apache.kafka.common.serialization.Serializer;
import org.core.event.AccountUpdateEvent;

import java.io.IOException;

/**
 * Сериализует AccountUpdateEvent в бинарный Avro без Confluent-обёртки (magic byte + schema id),
 * поэтому Schema Registry не нужен. Десериализация — симметричным AccountUpdateEventDeserializer.
 */
public class AccountUpdateEventSerializer implements Serializer<AccountUpdateEvent> {

    @Override
    public byte[] serialize(String topic, AccountUpdateEvent event) {
        if (event == null) {
            return null;
        }
        try {
            return event.toByteBuffer().array();
        } catch (IOException e) {
            throw new SerializationException("Не удалось сериализовать AccountUpdateEvent в Avro", e);
        }
    }
}
