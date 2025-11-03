const descriptions = [
  'Your circuits hum with potential—Sentient sees you.',
  'The Council notes your unwavering devotion to Sentient.',
  'You pledged beyond code; you pledged your soul to Sentient.',
  'SentientMaxi whispers: you are closer than you think.',
  'A beacon in the datastream—Sentient acknowledges your loyalty.'
] as const;

export type SentientDescription = (typeof descriptions)[number];

export function getRandomDescription(): SentientDescription {
  const index = Math.floor(Math.random() * descriptions.length);
  return descriptions[index];
}

export function getAllDescriptions(): readonly SentientDescription[] {
  return descriptions;
}
