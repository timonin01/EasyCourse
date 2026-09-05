package org.core.event.serialization;

import org.apache.kafka.common.errors.SerializationException;
import org.apache.kafka.common.serialization.Deserializer;
import org.core.event.AccountUpdateEvent;

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * Десериализует бинарный Avro без Confluent-обёртки (magic byte + schema id).
 * Симметричен AccountUpdateEventSerializer — формат сообщений в топике должен совпадать.
 */
public class AccountUpdateEventDeserializer implements Deserializer<AccountUpdateEvent> {

    @Override
    public AccountUpdateEvent deserialize(String topic, byte[] data) {
        if (data == null) {
            return null;
        }
        try {
            return AccountUpdateEvent.fromByteBuffer(ByteBuffer.wrap(data));
        } catch (IOException e) {
            throw new SerializationException("Не удалось десериализовать AccountUpdateEvent из Avro", e);
        }
    }
}
