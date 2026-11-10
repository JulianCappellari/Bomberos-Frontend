export type ReceiptPerson = { id: string; username: string; profile: { fullName: string } | null };
export type MessageReceipt = { id: string; userId: string; contentHash: string; bodySnapshot: string; acknowledgedAt: string; user: ReceiptPerson };
export function groupMessageReceipts(receipts: MessageReceipt[], currentHash: string) {
  const versions = new Map<string, { hash: string; body: string; current: boolean; readers: MessageReceipt[] }>();
  for (const row of [...receipts].sort((a, b) => b.acknowledgedAt.localeCompare(a.acknowledgedAt))) {
    let version = versions.get(row.contentHash);
    if (!version) { version = { hash: row.contentHash, body: row.bodySnapshot, current: row.contentHash === currentHash, readers: [] }; versions.set(row.contentHash, version); }
    if (!version.readers.some(reader => reader.userId === row.userId)) version.readers.push(row);
  }
  return { current: versions.get(currentHash)?.readers || [], previous: [...versions.values()].filter(v => !v.current) };
}
