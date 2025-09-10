/*
 * IMPORTS
 */
import { Kafka } from "kafkajs";
import debug from "debug";

/*
 * LOGGER
 */
const _Log = {
  kafka: debug("app:kafka"),
};

/*
 * KAFKA CLIENT
 */
const kafka = new Kafka({
  clientId: "app-service",
  brokers: [process.env.KAFKA_BROKER || "127.0.0.1:9092"],
});

/*
 * PRODUCER & CONSUMER
 */
export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "app-service-group" });

/*
 * HELPER – timeout wrapper
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
 * INIT FUNCTION
 */
export async function initKafka() {
  try {
    // Producer connect with timeout
    await withTimeout(producer.connect(), 5000);

    // Consumer usually should connect only after subscribe, but we add timeout for safety
    await withTimeout(consumer.connect(), 5000);

    _Log.kafka("Kafka Connected");
  } catch (err: any) {
    _Log.kafka("Kafka connection failed:", err.message || err);
  }
}

/*
 * SHUTDOWN FUNCTION
 */
export async function shutdownKafka() {
  try {
    await producer.disconnect();
    await consumer.disconnect();
    _Log.kafka("🛑 Kafka Disconnected");
  } catch (err) {
    _Log.kafka("Error during Kafka shutdown:", err);
  }
}
