import test from "node:test"
import assert from "node:assert/strict"
import { SubmissionQueue } from "./submissionQueue"
test("input can enqueue the next word immediately while acknowledgements preserve order", async () => {
  let resolve: (value: number) => void = () => {}
  const sent: number[] = [], received: number[] = []
  const queue = new SubmissionQueue<number, number>(input => { sent.push(input); return new Promise(done => { resolve = done }) }, value => received.push(value), () => assert.fail())
  queue.enqueue(0); queue.enqueue(1)
  assert.deepEqual(sent, [0])
  resolve(0); await new Promise(done => setImmediate(done))
  assert.deepEqual(sent, [0, 1]); assert.deepEqual(received, [0])
  resolve(1); await new Promise(done => setImmediate(done))
  assert.deepEqual(received, [0, 1]); queue.stop()
})
test("a failed submission retains its exact event for retry before following words", async () => {
  let fails = true, failures = 0
  const sent: string[] = [], received: string[] = []
  const queue = new SubmissionQueue<string, string>(async input => { sent.push(input); if (fails) throw new Error(); return input }, value => received.push(value), () => { failures++ })
  queue.enqueue("event-a"); queue.enqueue("event-b")
  await new Promise(done => setImmediate(done)); assert.equal(failures, 1)
  fails = false; queue.retry(); await new Promise(done => setImmediate(done))
  assert.deepEqual(sent, ["event-a", "event-a", "event-b"]); assert.deepEqual(received, ["event-a", "event-b"])
})
