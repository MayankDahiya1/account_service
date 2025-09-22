/*
 * IMPORTS
 */
import { Kafka } from "kafkajs";
import debug from "debug";

/*
 * DEBUG LOGGING
 */
const _Log = {
  kafka: debug("app:kafka"),
};

/*
 * KAFKA CLIENT
 */
const kafka = new Kafka({
  clientId: "account-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});
export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "account-service-group" });

/*
 * HELPER: Timeout Wrapper
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Kafka connect timeout")), ms)
    ),
  ]);
}

/*
 * FUNCTION: Initialize Kafka
 */
export async function initKafka() {
  try {
    await withTimeout(producer.connect(), 5000);

    await withTimeout(consumer.connect(), 5000);

    _Log.kafka("Kafka Connected");
  } catch (err: any) {
    _Log.kafka("Kafka connection failed:", err.message || err);
  }
}

/*
 * FUNCTION: Shutdown Kafka
 */
export async function shutdownKafka() {
  try {
    await producer.disconnect();
    await consumer.disconnect();
    _Log.kafka("Kafka Disconnected");
  } catch (err) {
    _Log.kafka("Error during Kafka shutdown:", err);
  }
}
