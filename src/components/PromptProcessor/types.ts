class ListNode<T> {
  public prev: ListNode<T> | null = null;
  public next: ListNode<T> | null = null;

  constructor(
    public key: string,
    public value: T,
  ) {}
}

export class LRUCache<T> {
  private readonly capacity: number;
  private cache: Map<string, ListNode<T>> = new Map();
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  public get(key: string): T | undefined {
    if (this.cache.has(key)) {
      const node = this.cache.get(key)!;
      this.removeNode(node);
      this.addToHead(node);
      return node.value;
    } else {
      return undefined;
    }
  }

  public put(key: string, value: T) {
    if (this.cache.has(key)) {
      const node = this.cache.get(key)!;
      node.value = value;
      this.removeNode(node);
      this.addToHead(node);
    } else {
      const node = new ListNode(key, value);
      this.cache.set(key, node);
      this.addToHead(node);
      if (this.cache.size > this.capacity) {
        const tail = this.tail!;
        this.cache.delete(tail.key);
        this.removeNode(tail);
      }
    }
  }

  private removeNode(node: ListNode<T>) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private addToHead(node: ListNode<T>) {
    if (this.head) {
      this.head.prev = node;
      node.next = this.head;
      this.head = node;
    } else {
      this.head = node;
      this.tail = node;
    }
  }
}
