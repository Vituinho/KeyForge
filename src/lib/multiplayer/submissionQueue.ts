/** Keeps input independent of transport while preserving ordered, idempotent submissions. */
export class SubmissionQueue<Input, Output> {
  private items: Input[] = []
  private running = false
  private blocked = false
  private stopped = false
  constructor(private send: (input: Input) => Promise<Output>, private received: (output: Output) => void, private failed: () => void) {}
  enqueue(input: Input) { if (!this.stopped) { this.items.push(input); void this.drain() } }
  start() { this.stopped = false }
  retry() { this.blocked = false; void this.drain() }
  stop() { this.stopped = true; this.items = [] }
  private async drain() {
    if (this.running || this.blocked || this.stopped) return
    this.running = true
    try {
      while (this.items.length && !this.stopped) {
        const result = await this.send(this.items[0])
        if (this.stopped) return
        this.items.shift()
        this.received(result)
      }
    } catch { if (!this.stopped) { this.blocked = true; this.failed() } }
    finally { this.running = false }
  }
}
